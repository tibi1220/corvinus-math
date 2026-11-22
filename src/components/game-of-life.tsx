'use client';

import { useEffect, useRef } from 'react';

// Conway's Game of Life on a wrapping grid, drawn on a canvas that fills its
// parent. The live cells take the canvas's CSS `color`, so the theme (and
// Tailwind's dark: variant) sets it. The root not-found page uses it, and
// Next.js ships the root not-found file with every route, so keep this small.

const CELL = 10; // CSS pixels per cell, gap included
const GAP = 1;
const STEP_MS = 120; // time between generations
const DENSITY = 0.22; // share of live cells in a random soup
const QUIET_LIMIT = 40; // generations of near-stillness before new gliders

// The five cells of a glider heading down and to the right.
const GLIDER = [
  [1, 0],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
];

type Grid = { cols: number; rows: number; cells: Uint8Array };

function randomGrid(cols: number, rows: number): Grid {
  const cells = new Uint8Array(cols * rows);
  for (let i = 0; i < cells.length; i++) {
    cells[i] = Math.random() < DENSITY ? 1 : 0;
  }
  return { cols, rows, cells };
}

// A new grid of the given size that keeps the cells of the old one that
// still fit; the new area starts as a random soup.
function resizeGrid(old: Grid, cols: number, rows: number): Grid {
  const grid = randomGrid(cols, rows);
  for (let y = 0; y < Math.min(rows, old.rows); y++) {
    for (let x = 0; x < Math.min(cols, old.cols); x++) {
      grid.cells[y * cols + x] = old.cells[y * old.cols + x];
    }
  }
  return grid;
}

function step({ cols, rows, cells }: Grid): Grid {
  const next = new Uint8Array(cells.length);
  for (let y = 0; y < rows; y++) {
    const up = ((y - 1 + rows) % rows) * cols;
    const mid = y * cols;
    const down = ((y + 1) % rows) * cols;
    for (let x = 0; x < cols; x++) {
      const left = (x - 1 + cols) % cols;
      const right = (x + 1) % cols;
      const n =
        cells[up + left] +
        cells[up + x] +
        cells[up + right] +
        cells[mid + left] +
        cells[mid + right] +
        cells[down + left] +
        cells[down + x] +
        cells[down + right];
      next[mid + x] = n === 3 || (n === 2 && cells[mid + x]) ? 1 : 0;
    }
  }
  return { cols, rows, cells: next };
}

// Gliders in random places and directions, to wake up a settled board.
function addGliders(grid: Grid, count: number) {
  const { cols, rows, cells } = grid;
  for (let g = 0; g < count; g++) {
    const ox = Math.floor(Math.random() * cols);
    const oy = Math.floor(Math.random() * rows);
    const fx = Math.random() < 0.5;
    const fy = Math.random() < 0.5;
    for (const [dx, dy] of GLIDER) {
      const x = (ox + (fx ? 2 - dx : dx)) % cols;
      const y = (oy + (fy ? 2 - dy : dy)) % rows;
      cells[y * cols + x] = 1;
    }
  }
}

// Cells that differ from two generations back: zero for still lifes and
// blinkers, so a low count means the board has settled.
function changes(a: Uint8Array, b: Uint8Array) {
  let count = 0;
  for (let i = 0; i < a.length; i++) count += a[i] ^ b[i];
  return count;
}

export function GameOfLife({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let grid: Grid = { cols: 0, rows: 0, cells: new Uint8Array(0) };
    let previous = grid.cells; // the generation before the current one
    let quiet = 0;
    let frame = 0;
    let last = 0;

    function draw() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = getComputedStyle(canvas).color;
      const { cols, rows, cells } = grid;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (cells[y * cols + x]) {
            ctx.fillRect(x * CELL, y * CELL, CELL - GAP, CELL - GAP);
          }
        }
      }
    }

    function advance() {
      const next = step(grid);
      const settled = changes(next.cells, previous) <= grid.cells.length / 500;
      quiet = settled ? quiet + 1 : 0;
      previous = grid.cells;
      grid = next;
      if (quiet >= QUIET_LIMIT) {
        addGliders(grid, Math.max(2, Math.round(grid.cells.length / 1500)));
        quiet = 0;
      }
    }

    function fit() {
      if (!canvas) return;
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const cols = Math.max(1, Math.ceil(width / CELL));
      const rows = Math.max(1, Math.ceil(height / CELL));
      if (cols !== grid.cols || rows !== grid.rows) {
        const first = grid.cols === 0;
        grid = first ? randomGrid(cols, rows) : resizeGrid(grid, cols, rows);
        previous = new Uint8Array(grid.cells.length);
        // Skip the noisy first generations of a fresh soup.
        if (first) for (let i = 0; i < 12; i++) advance();
      }
      draw();
    }

    function tick(time: number) {
      frame = requestAnimationFrame(tick);
      if (time - last < STEP_MS) return;
      last = time;
      advance();
      draw();
    }

    // Runs only while the tab is visible and motion is welcome; otherwise
    // the board stays as a still picture.
    function update() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!document.hidden && !motion.matches) {
        frame = requestAnimationFrame(tick);
      }
    }

    fit();
    update();

    const resize = new ResizeObserver(fit);
    resize.observe(canvas);
    // The cell color follows the theme toggle even while paused.
    const theme = new MutationObserver(draw);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', update);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      theme.disconnect();
      document.removeEventListener('visibilitychange', update);
      motion.removeEventListener('change', update);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
    />
  );
}

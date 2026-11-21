-- Finds the exercise files of a week and reads their docstrings, for
-- exercises/macros.tex (loaded by LuaLaTeX with dofile).
--
-- An exercise file is called NN-slug.tex: NN is its number within the week
-- (01 -> Exercise 10.1 in week 10), the slug is how documents refer to it.
-- It starts with a docstring:
--
--   % ---
--   % title: License plates
--   % tags: counting, permutations
--   % ---
--
-- The tag "finance" marks a finance exercise. scripts/build-content.mjs reads
-- the same docstrings for the website.

local M = { list = {}, slugs = {} }

local function docstring(file)
  local meta, inside = {}, false
  local handle = assert(io.open(file, "r"))
  for line in handle:lines() do
    if line:match("^%%%s*%-%-%-%s*$") then
      if inside then break end
      inside = true
    elseif inside then
      local key, value = line:match("^%%%s*([%w-]+)%s*:%s*(.-)%s*$")
      if key then meta[key] = value end
    elseif line:match("%S") then
      break
    end
  end
  handle:close()
  return meta
end

local function define(name, value)
  tex.sprint("\\expandafter\\gdef\\csname " .. name .. "\\endcsname{" .. value .. "}")
end

-- Defines, for every exercise, \exnum@<slug> (10.1), \extitle@<slug>,
-- \exfile@<slug> and, for finance exercises, \exfinance@<slug>. Unless
-- listed is false, the exercise is also one of the week's own (M.each, so
-- \allexercises).
function M.scan(dir, week, listed)
  local files, numbers = {}, {}
  for name in lfs.dir(dir) do
    local number, slug = name:match("^(%d+)%-([%w%-]+)%.tex$")
    if number then
      number = tonumber(number)
      if numbers[number] then
        error("exercises: " .. name .. " and " .. numbers[number] .. " have the same number")
      end
      numbers[number] = name
      files[#files + 1] = { number = number, slug = slug, name = name }
    end
  end
  table.sort(files, function(a, b) return a.number < b.number end)
  for _, exercise in ipairs(files) do
    if M.slugs[exercise.slug] then
      error("exercises: " .. dir .. "/" .. exercise.name .. " and "
        .. M.slugs[exercise.slug] .. " have the same slug")
    end
    M.slugs[exercise.slug] = dir .. "/" .. exercise.name
    local meta = docstring(dir .. "/" .. exercise.name)
    if not meta.title then
      error("exercises: " .. exercise.name .. " has no title in its docstring")
    end
    define("exnum@" .. exercise.slug, week .. "." .. exercise.number)
    define("extitle@" .. exercise.slug, meta.title)
    define("exfile@" .. exercise.slug, dir .. "/" .. exercise.name)
    for tag in (meta.tags or ""):gmatch("[^,%s]+") do
      if tag == "finance" then define("exfinance@" .. exercise.slug, "") end
    end
    if listed ~= false then M.list[#M.list + 1] = exercise end
  end
end

-- The exercises of an earlier week, for exercises/macros.tex:
-- exercises.include("week-08") makes them usable by slug like the week's own
-- (\exref gives 8.11, \exerciseframe places the frames), but they are not
-- listed among the week's exercises. scripts/build-content.mjs copies them to
-- week-08/exercises/ next to the document; compiled in the week's own folder
-- they are read from ../week-08/exercises/.
function M.include(weekdir)
  local week = tonumber(weekdir:match("^week%-(%d+)$"))
  if not week then error("exercises: not a week folder: " .. weekdir) end
  local dir = weekdir .. "/exercises"
  if not lfs.attributes(dir, "mode") then dir = "../" .. dir end
  if not lfs.attributes(dir, "mode") then
    error("exercises: no exercises found for " .. weekdir)
  end
  M.scan(dir, tostring(week), false)
end

-- \<command>{<slug>} for every exercise, in number order.
function M.each(command)
  for _, exercise in ipairs(M.list) do
    tex.sprint("\\" .. command .. "{" .. exercise.slug .. "}")
  end
end

return M

// Light is the default theme; a saved "dark" choice is applied by this
// script, which the root layout inlines in <head> so it runs before the first
// paint (see the "Preventing flash before hydration" guide in the Next docs).
export const THEME_STORAGE_KEY = 'theme';

export const THEME_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`;

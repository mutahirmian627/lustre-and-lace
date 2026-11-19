export type StudioTheme = "light" | "dark";

/** Where the visitor's choice is remembered (this browser only). */
export const STUDIO_THEME_KEY = "aperionie-studio-theme";

/**
 * Runs in the page before it is painted, so the studio never flashes the wrong theme: the saved choice if there is one, else the
 * visitor's system setting. Written as plain ES5 in a string because it is inlined (see ThemeScript in the layout).
 */
export const STUDIO_THEME_SCRIPT = `(function(){try{var t=null;try{t=localStorage.getItem(${JSON.stringify(STUDIO_THEME_KEY)})}catch(e){}if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var w=document.querySelector(".studio-theme");if(w)w.setAttribute("data-theme",t)}catch(e){}})();`;

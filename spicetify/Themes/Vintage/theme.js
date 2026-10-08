// Vintage theme for Spotify (#58). The top bar is the window's title bar,
// which greys out when another window has focus. CSS has no selector for
// window focus, so this marks the page: html.vintage-window-inactive while
// Spotify doesn't have it. Blur also fires when focus moves into a frame
// inside the page, so focus is read from document.hasFocus().
const syncWindowFocus = () =>
  document.documentElement.classList.toggle("vintage-window-inactive", !document.hasFocus());
window.addEventListener("focus", syncWindowFocus);
window.addEventListener("blur", syncWindowFocus);
syncWindowFocus();

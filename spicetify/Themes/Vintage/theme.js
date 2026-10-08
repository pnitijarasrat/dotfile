// PROTOTYPE (#63): floating switcher for the Media Rack player bar variants.
// Throwaway; lives only on the prototype/spotify-media-rack branch.
// Click the arrows, or press Alt+Left / Alt+Right. The choice is kept in
// localStorage so it survives a restart.
(function rackSwitcher() {
  if (!document.body) return setTimeout(rackSwitcher, 300);
  const variants = { A: "Rack strip", B: "Two-tier unit", C: "Big LCD" };
  const keys = Object.keys(variants);
  const html = document.documentElement;
  const label = document.createElement("span");
  const set = (v) => {
    html.dataset.rack = v;
    localStorage.setItem("proto-rack", v);
    label.textContent = `${v} (${variants[v]})`;
  };
  const step = (d) => set(keys[(keys.indexOf(html.dataset.rack) + d + keys.length) % keys.length]);

  const bar = document.createElement("div");
  bar.style.cssText =
    "position:fixed;left:50%;bottom:150px;transform:translateX(-50%);z-index:99999;" +
    "display:flex;gap:12px;align-items:center;padding:6px 14px;border-radius:999px;" +
    "background:#ff00aa;color:#fff;font:600 13px system-ui;box-shadow:0 2px 10px #0006;";
  const arrow = (text, d) => {
    const b = document.createElement("button");
    b.textContent = text;
    b.style.cssText = "all:unset;cursor:pointer;padding:0 6px;font-size:16px;";
    b.onclick = () => step(d);
    return b;
  };
  bar.append(arrow("◀", -1), label, arrow("▶", 1));
  document.body.append(bar);
  document.addEventListener("keydown", (e) => {
    if (!e.altKey || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    e.preventDefault();
    step(e.key === "ArrowLeft" ? -1 : 1);
  });
  set(variants[localStorage.getItem("proto-rack")] ? localStorage.getItem("proto-rack") : "A");
})();

/* Shared by the tools home page and every individual tool. */
(() => {
  "use strict";
  const key = "tools-theme";
  const colors = { pink: "#fff5f8", blue: "#f2f8fa", beige: "#faf7f0" };
  const names = { pink: "ピンク", blue: "ブルー", beige: "ベージュ" };
  let current = "beige";

  try {
    const saved = localStorage.getItem(key);
    if (Object.hasOwn(colors, saved)) current = saved;
  } catch (_) {
    // Private browsing or storage restrictions should not prevent use of a tool.
  }

  function apply(theme, save = false) {
    if (!Object.hasOwn(colors, theme)) return;
    current = theme;
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = colors[theme];
    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
    });
    if (save) {
      try { localStorage.setItem(key, theme); } catch (_) { /* keep current page themed */ }
    }
  }

  apply(current);
  function mount() {
    if (!document.body || document.querySelector(".theme-switcher")) return;
    const bar = document.createElement("div");
    bar.className = "theme-switcher";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "テーマカラー");
    const label = document.createElement("span");
    label.className = "theme-switcher__label";
    label.textContent = "テーマ";
    bar.append(label);
    const choices = document.createElement("div");
    choices.className = "theme-switcher__choices";
    for (const theme of ["pink", "blue", "beige"]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-switcher__choice";
      button.dataset.themeChoice = theme;
      button.setAttribute("aria-label", names[theme] + "のテーマ");
      button.setAttribute("aria-pressed", String(theme === current));
      const dot = document.createElement("span");
      dot.className = "theme-switcher__dot";
      dot.setAttribute("aria-hidden", "true");
      button.append(dot, document.createTextNode(names[theme]));
      button.addEventListener("click", () => apply(theme, true));
      choices.append(button);
    }
    bar.append(choices);
    document.body.prepend(bar);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();

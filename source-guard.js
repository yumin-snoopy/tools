"use strict";
// 簡易的な閲覧抑止。入力欄のコピー・貼り付けメニューは利用できます。
document.addEventListener("contextmenu", event => {
  if (!event.target.closest("input, textarea, [contenteditable]")) event.preventDefault();
});
document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  if (key === "f12" || ((event.ctrlKey || event.metaKey) && (key === "u" || (event.shiftKey && ["i", "j", "c"].includes(key))))) event.preventDefault();
});

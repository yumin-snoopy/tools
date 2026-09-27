"use strict";

// 改行の形式を統一。元の入力欄は書き換えず、処理用の文字列だけ変換します。
function normalizeNewlines(text) {
  return text.replace(/\r\n?/g, "\n");
}

// 改行を除いたUnicodeコードポイント数。絵文字の結合文字は別々に数えます。
function getTextStats(text) {
  const normalized = normalizeNewlines(text);
  return {
    total: Array.from(normalized.replace(/\n/g, "")).length,
    noSpaces: Array.from(normalized.replace(/\s/g, "")).length,
    lines: normalized === "" ? 0 : normalized.split("\n").length
  };
}

// 横方向の空白だけを対象にし、改行は「改行を削除」を選んだときだけ削除。
const horizontalWhitespace = /[^\S\r\n]+/g;
const operations = {
  halfwidthDigits: text => text.replace(/[０-９]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0)),
  halfwidthLetters: text => text.replace(/[Ａ-Ｚａ-ｚ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0)),
  removeBold: text => text.replace(/\*\*/g, ""),
  trimLines: text => text.split("\n").map(line => line.trim()).join("\n"),
  removeBlankLines: text => text.split("\n").filter(line => line.trim() !== "").join("\n"),
  removeNewlines: text => text.replace(/\n/g, ""),
  collapseSpaces: text => text.replace(/ {2,}/g, " "),
  removeSpaces: text => text.replace(horizontalWhitespace, "")
};

function formatText(text, selected) {
  // 記号の削除 → 行の整理 → 改行結合 → 空白整理の順に処理。
  // 最後に空白を整理すると、行の結合でできた連続スペースも取り除けます。
  let result = normalizeNewlines(text);
  for (const [name, transform] of Object.entries(operations)) {
    if (selected.has(name)) result = transform(result);
  }
  return result;
}

const inputText = document.getElementById("input-text");
const outputText = document.getElementById("output-text");
const formatButton = document.getElementById("format-button");
const copyButton = document.getElementById("copy-button");
const clearButton = document.getElementById("clear-button");
const clearDialog = document.getElementById("clear-dialog");
const status = document.getElementById("status");
let statusTimer;
let resultVersion = 0;

function updateCounts(prefix, text) {
  const stats = getTextStats(text);
  document.getElementById(`${prefix}-total`).textContent = stats.total.toLocaleString("ja-JP");
  document.getElementById(`${prefix}-no-spaces`).textContent = stats.noSpaces.toLocaleString("ja-JP");
  document.getElementById(`${prefix}-lines`).textContent = stats.lines.toLocaleString("ja-JP");
}

function showStatus(message, isError = false, temporary = false) {
  clearTimeout(statusTimer);
  status.textContent = message;
  status.classList.toggle("error", isError);
  if (temporary) statusTimer = setTimeout(() => { status.textContent = ""; }, 3500);
}

// 入力や設定を変えたら古い結果を消し、以前の文章を誤ってコピーしないようにします。
function resetResult() {
  resultVersion += 1;
  outputText.value = "";
  copyButton.disabled = true;
  updateCounts("output", "");
  showStatus("");
}

inputText.addEventListener("input", () => {
  updateCounts("input", inputText.value);
  clearButton.disabled = inputText.value === "";
  formatButton.disabled = inputText.value === "";
  resetResult();
});

document.querySelectorAll("[data-operation]").forEach(checkbox => {
  checkbox.addEventListener("change", resetResult);
});

formatButton.addEventListener("click", () => {
  const selected = new Set(Array.from(document.querySelectorAll("[data-operation]:checked"), checkbox => checkbox.dataset.operation));
  if (selected.size === 0) {
    showStatus("整形したい項目にチェックを入れてください。", true);
    document.querySelector("[data-operation]").focus();
    return;
  }
  resultVersion += 1;
  outputText.value = formatText(inputText.value, selected);
  updateCounts("output", outputText.value);
  copyButton.disabled = outputText.value === "";
  showStatus(outputText.value === "" ? "整形しました。選択した処理で、文章が空になりました。" : "整形しました。結果を確認して「コピー」で利用できます。");
});

// Clipboard API が利用できない環境では、選択した結果を従来の方法でコピー。
function copyWithSelection() {
  outputText.focus();
  outputText.select();
  outputText.setSelectionRange(0, outputText.value.length);
  return typeof document.execCommand === "function" && document.execCommand("copy");
}

copyButton.addEventListener("click", async () => {
  if (outputText.value === "") return;
  const version = resultVersion;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(outputText.value);
      } catch {
        if (version !== resultVersion) return;
        if (!copyWithSelection()) throw new Error("Copy failed");
      }
    } else if (!copyWithSelection()) {
      throw new Error("Copy unavailable");
    }
    if (version === resultVersion) showStatus("コピーしました", false, true);
  } catch {
    if (version !== resultVersion) return;
    outputText.focus();
    outputText.select();
    showStatus("自動コピーができませんでした。結果を選択したので、右クリックや長押しのメニューからコピーしてください。", true);
  }
});

clearButton.addEventListener("click", () => {
  if (inputText.value === "") return;
  clearDialog.returnValue = "";
  clearDialog.showModal();
});

// キャンセル・Escでは削除しません。「削除する」を選んだ場合だけクリア。
clearDialog.addEventListener("close", () => {
  if (clearDialog.returnValue !== "clear") return;
  inputText.value = "";
  updateCounts("input", "");
  resetResult();
  formatButton.disabled = true;
  clearButton.disabled = true;
  inputText.focus();
  showStatus("クリアしました", false, true);
});

updateCounts("input", inputText.value);
updateCounts("output", outputText.value);

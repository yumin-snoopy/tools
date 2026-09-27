"use strict";
// 入力はメモリー内だけで処理し、通信やブラウザーへの保存は行いません。
const form = document.querySelector("#prompt-form");
const useCase = document.querySelector("#use-case");
const purpose = document.querySelector("#purpose");
const audience = document.querySelector("#audience");
const source = document.querySelector("#source");
const format = document.querySelector("#format");
const result = document.querySelector("#result");
const copyButton = document.querySelector("#copy");
const formStatus = document.querySelector("#form-status");
const copyStatus = document.querySelector("#copy-status");
const conditionHint = document.querySelector("#condition-hint");
let copyTimer;
let revision = 0;
let copying = false;

const uses = {
  writing: ["あなたは文章作成を支援するアシスタントです。", "社内向けに新しいサービスの紹介文を作成してほしい"],
  email: ["あなたはメール作成を支援するアシスタントです。", "お客様へのお詫びメールを作成してほしい"],
  summary: ["あなたは文章の要約を支援するアシスタントです。", "以下の文章の重要なポイントを要約してほしい"],
  ideas: ["あなたはアイデア出しを支援するアシスタントです。", "社内イベントのアイデアを5つ考えてほしい"],
  data: ["あなたはExcelの活用とデータ分析を支援するアシスタントです。", "売上データを分析してほしい"],
  code: ["あなたはプログラミングを支援するアシスタントです。", "JavaScriptでボタンのクリック処理を作成してほしい"],
  learning: ["あなたは学習と理解を支援するアシスタントです。", "初心者向けにVLOOKUPを説明してほしい"],
  slides: ["あなたはプレゼン資料作成を支援するアシスタントです。", "新しい企画を紹介する5枚のスライド構成を考えてほしい"]
};
const formats = { text: "文章形式で回答してください。", bullets: "箇条書きでまとめてください。", table: "表形式でまとめてください。", steps: "番号付きの手順形式で説明してください。", email: "件名と本文を含むメール形式で作成してください。", free: "内容に適した自由な形式で回答してください。" };

function updateCopyButton() {
  copyButton.disabled = copying || !result.value.trim();
}
function clearCopyStatus() {
  clearTimeout(copyTimer);
  copyStatus.textContent = "";
  copyStatus.classList.remove("error");
}
function showStatus(message, error = false) {
  formStatus.textContent = message;
  formStatus.classList.toggle("error", error);
}
function updateExample() {
  purpose.placeholder = "例：" + (uses[useCase.value]?.[1] || "初心者向けにVLOOKUPを説明してほしい");
}
// 相反する条件は勝手に変更せず、利用者が見直せる短い案内を表示します。
function updateConditionHint() {
  const notes = [];
  if (document.querySelector("#concise").checked && document.querySelector("#detailed").checked) notes.push("「簡潔」と「詳しく」の両方が選択されています。必要に応じて見直してください。");
  const layouts = [...form.querySelectorAll("[data-layout]:checked")];
  if (layouts.length > 1 || layouts.some(item => format.value && format.value !== "free" && item.dataset.layout !== format.value)) notes.push("まとめ方の条件が複数あります。出力形式と合わせて見直すと、より伝わりやすくなります。");
  conditionHint.textContent = notes.join(" ");
}

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!purpose.value.trim()) {
    showStatus("目的を入力してください。例：お詫びメールを作成してほしい", true);
    purpose.focus();
    return;
  }
  const sections = [];
  const addSection = (title, text) => { if (text) sections.push(`# ${title}\n${text}`); };
  // 未選択の用途・対象者・条件・入力・形式は出力しません。
  addSection("役割", uses[useCase.value]?.[0]);
  addSection("目的", purpose.value.trim());
  const reader = audience.value.trim();
  if (reader && reader !== "特に指定しない") addSection("対象者", `${reader}向けの内容にしてください。`);
  const conditions = [...form.querySelectorAll('[name="condition"]:checked')].map(item => "・" + item.value);
  addSection("条件", conditions.join("\n"));
  addSection("入力", source.value.trim());
  addSection("出力形式", formats[format.value]);
  result.value = sections.join("\n\n");
  revision++;
  clearCopyStatus();
  updateCopyButton();
  showStatus("プロンプトを作成しました。内容を確認してコピーしてください。");
  result.focus({ preventScroll: true });
  result.scrollIntoView({ behavior: "auto", block: "center" });
});

form.addEventListener("input", () => {
  purpose.setCustomValidity("");
  showStatus(result.value ? "入力内容を変更しました。反映するには、もう一度作成してください。" : "");
  updateConditionHint();
});
useCase.addEventListener("change", updateExample);
result.addEventListener("input", () => { revision++; clearCopyStatus(); updateCopyButton(); });

document.querySelector("#clear").addEventListener("click", () => {
  form.reset();
  purpose.setCustomValidity("");
  result.value = "";
  revision++;
  clearCopyStatus();
  updateCopyButton();
  updateExample();
  updateConditionHint();
  showStatus("入力内容をクリアしました。");
  useCase.focus();
});
document.querySelector("#sample").addEventListener("click", () => {
  form.reset();
  useCase.value = "email";
  purpose.value = "取引先への納期遅延のお詫びメールを作成する";
  audience.value = "取引先";
  for (const id of ["polite", "concise", "next-action"]) document.getElementById(id).checked = true;
  format.value = "email";
  purpose.setCustomValidity("");
  result.value = "";
  revision++;
  clearCopyStatus();
  updateCopyButton();
  updateExample();
  updateConditionHint();
  showStatus("サンプルを入力しました。「プロンプトを作成する」を押してください。");
  purpose.focus();
});

// Clipboard APIが使えない環境では、選択範囲からのコピーを試します。
function fallbackCopy(text) {
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.append(helper);
  helper.select();
  let success = false;
  try { success = document.execCommand("copy"); } catch { /* 手動コピーへ案内 */ }
  helper.remove();
  copyButton.focus({ preventScroll: true });
  return success;
}
copyButton.addEventListener("click", async () => {
  const text = result.value;
  if (!text.trim() || copying) return;
  const copiedRevision = revision;
  copying = true;
  updateCopyButton();
  clearCopyStatus();
  let success = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      success = true;
    }
  } catch { /* 権限が拒否された場合もフォールバックを試します。 */ }
  if (!success) success = fallbackCopy(text);
  copying = false;
  updateCopyButton();
  if (revision !== copiedRevision) return;
  copyStatus.textContent = success ? "コピーしました" : "コピーできませんでした。下の文章を選択して手動でコピーしてください。";
  copyStatus.classList.toggle("error", !success);
  if (success) copyTimer = setTimeout(clearCopyStatus, 3000);
  else { result.focus(); result.select(); }
});

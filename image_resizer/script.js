"use strict";

const $ = id => document.getElementById(id);
const ui = {
  file: $("file-input"), drop: $("drop-zone"), error: $("error"), status: $("status"),
  originalSection: $("original-section"), originalPreview: $("original-preview"),
  originalName: $("original-name"), originalDimensions: $("original-dimensions"), originalSize: $("original-size"),
  width: $("width-input"), widthNote: $("width-note"), quality: $("quality-input"), qualityValue: $("quality-value"),
  qualityNote: $("quality-note"), format: $("format-input"), convert: $("convert-button"),
  resultSection: $("result-section"), resultPreview: $("result-preview"), resultDimensions: $("result-dimensions"),
  resultSize: $("result-size"), comparison: $("size-comparison"), saving: $("saving"), save: $("save-button"), reset: $("reset-button")
};
const formats = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"};
const presets = [...document.querySelectorAll(".preset")];
let source = null;
let result = null;
let sourceUrl = null;
let resultUrl = null;
let requestId = 0;

function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function showError(message) {
  ui.error.textContent = message;
  ui.error.hidden = !message;
}

function clearResult() {
  requestId++;
  result = null;
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = null;
  ui.resultPreview.removeAttribute("src");
  ui.resultSection.hidden = true;
  ui.status.textContent = "";
  ui.convert.disabled = !source;
}

function updateWidthNote() {
  presets.forEach(button => button.classList.toggle("active", button.dataset.width === ui.width.value));
  if (!source) { ui.widthNote.textContent = ""; return; }
  const width = Number(ui.width.value);
  ui.widthNote.textContent = Number.isInteger(width) && width > source.width
    ? `元画像の横幅は${source.width}pxです。変換時は元の大きさのままにします。` : "";
}

function updateQuality() {
  ui.qualityValue.textContent = `${ui.quality.value}%`;
  const isPng = ui.format.value === "image/png";
  ui.quality.disabled = isPng;
  ui.qualityNote.textContent = isPng
    ? "PNGは画質を指定できません。写真の容量を小さくしたい場合はJPGかWebPを選んでください。"
    : "数字を下げると容量が小さくなりやすくなります。";
}

function clearSource() {
  clearResult();
  source = null;
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = null;
  ui.originalPreview.removeAttribute("src");
  ui.originalSection.hidden = true;
  ui.convert.disabled = true;
  updateWidthNote();
}

function readImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像を開けませんでした。対応形式の画像を選び直してください。"));
    image.src = url;
  });
}

async function loadFile(file) {
  clearSource();
  showError("");
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  const types = {jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp"};
  if (!types[ext] || (file.type && file.type !== types[ext])) {
    showError("JPG・PNG・WebPの画像を選んでください。");
    return;
  }
  if (file.size === 0) { showError("ファイルが空です。別の画像を選んでください。"); return; }
  const id = requestId;
  const url = URL.createObjectURL(file);
  try {
    const image = await readImage(url);
    if (id !== requestId) { URL.revokeObjectURL(url); return; }
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("画像を開けませんでした。別の画像を選んでください。");
    source = {file, image, width: image.naturalWidth, height: image.naturalHeight};
    sourceUrl = url;
    ui.originalPreview.src = url;
    ui.originalName.textContent = file.name;
    ui.originalDimensions.textContent = `${source.width} × ${source.height} px`;
    ui.originalSize.textContent = fileSize(file.size);
    ui.originalSection.hidden = false;
    ui.convert.disabled = false;
    updateWidthNote();
  } catch (error) {
    URL.revokeObjectURL(url);
    if (id === requestId) showError(error.message);
  }
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob || blob.type !== type) reject(new Error("このブラウザでは選択した形式で保存できません。別の形式を試してください。"));
      else resolve(blob);
    }, type, quality);
  });
}

async function convert() {
  if (!source) { showError("先に画像を選んでください。"); return; }
  clearResult();
  showError("");
  const requestedWidth = Number(ui.width.value);
  if (!Number.isInteger(requestedWidth) || requestedWidth < 1 || requestedWidth > 16384) {
    showError("横幅は1〜16384の整数で入力してください。");
    ui.width.focus();
    return;
  }
  const width = Math.min(requestedWidth, source.width);
  const height = Math.max(1, Math.round(source.height * width / source.width));
  if (height > 16384 || width * height > 268435456) {
    showError("変換後の画像が大きすぎます。横幅を小さくしてください。");
    return;
  }
  const id = requestId;
  const type = ui.format.value;
  ui.convert.disabled = true;
  ui.status.textContent = "変換しています…";
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("画像を処理できませんでした。ブラウザを変えてお試しください。");
    if (type === "image/jpeg") {
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source.image, 0, 0, width, height);
    const blob = await canvasBlob(canvas, type, Number(ui.quality.value) / 100);
    if (id !== requestId) return;
    result = {blob, width, height, type};
    resultUrl = URL.createObjectURL(blob);
    ui.resultPreview.src = resultUrl;
    ui.resultDimensions.textContent = `${width} × ${height} px`;
    ui.resultSize.textContent = fileSize(blob.size);
    ui.comparison.textContent = `${fileSize(source.file.size)} → ${fileSize(blob.size)}`;
    const change = Math.round(Math.abs(1 - blob.size / source.file.size) * 100);
    ui.saving.textContent = blob.size < source.file.size ? `約${change}%削減` : blob.size > source.file.size ? `元画像より約${change}%大きくなりました` : "元画像とほぼ同じ容量です";
    ui.resultSection.hidden = false;
    ui.status.textContent = "変換できました。下の画像を確認して保存してください。";
  } catch (error) {
    if (id === requestId) showError(error.message || "画像を変換できませんでした。別の画像をお試しください。");
    if (id === requestId) ui.status.textContent = "";
  } finally {
    if (id === requestId) ui.convert.disabled = false;
  }
}

ui.file.addEventListener("change", () => {
  const file = ui.file.files[0];
  ui.file.value = "";
  loadFile(file);
});
ui.drop.addEventListener("dragover", event => { event.preventDefault(); ui.drop.classList.add("dragging"); });
ui.drop.addEventListener("dragleave", () => ui.drop.classList.remove("dragging"));
ui.drop.addEventListener("drop", event => {
  event.preventDefault();
  ui.drop.classList.remove("dragging");
  loadFile(event.dataTransfer.files[0]);
});
presets.forEach(button => button.addEventListener("click", () => {
  ui.width.value = button.dataset.width;
  clearResult(); updateWidthNote();
}));
ui.width.addEventListener("input", () => { clearResult(); updateWidthNote(); });
ui.quality.addEventListener("input", () => { clearResult(); updateQuality(); });
ui.format.addEventListener("change", () => { clearResult(); updateQuality(); });
ui.convert.addEventListener("click", convert);
ui.save.addEventListener("click", () => {
  if (!result || !resultUrl || !source) return;
  const link = document.createElement("a");
  link.href = resultUrl;
  link.download = `${source.file.name.replace(/\.[^.]+$/, "")}-resized.${formats[result.type]}`;
  document.body.append(link);
  link.click();
  link.remove();
});
ui.reset.addEventListener("click", () => {
  clearSource(); showError("");
  ui.file.value = ""; ui.width.value = "1280"; ui.quality.value = "80"; ui.format.value = "image/jpeg";
  updateWidthNote(); updateQuality();
});
updateQuality();

// 静的ページでの簡易的な閲覧抑止。ブラウザの仕様上、ソースを完全に隠すことはできません。
document.addEventListener("contextmenu", event => event.preventDefault());
document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  if (key === "f12" || ((event.ctrlKey || event.metaKey) && (key === "u" || (event.shiftKey && ["i", "j", "c"].includes(key))))) event.preventDefault();
});

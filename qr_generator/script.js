"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const input = $("qr-input"), canvas = $("qr-canvas"), status = $("status");
  const presets = {
    standard: ["#111111", "#ffffff"],
    pink: ["#9f355d", "#fff0f5"],
    blue: ["#204f86", "#edf5ff"],
    green: ["#266047", "#f1faf2"]
  };
  let timer;
  qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
  function message(text, error = false, temporary = false) {
    clearTimeout(timer);
    status.textContent = text;
    status.classList.toggle("error", error);
    if (temporary) timer = setTimeout(() => { status.textContent = ""; }, 3500);
  }
  function resetResult() {
    canvas.hidden = true;
    canvas.width = canvas.height = 0;
    $("placeholder").hidden = false;
    $("save").disabled = true;
    message("");
  }
  function updateInput() {
    const count = Array.from(input.value).length;
    $("char-count").textContent = `文字数：${count.toLocaleString("ja-JP")}文字`;
    $("length-warning").hidden = count <= 300;
    resetResult();
  }
  function luminance(hex) {
    const rgb = hex.match(/[a-f\d]{2}/gi).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  }
  function updatePresetSelection() {
    const colors = [$("qr-color").value.toLowerCase(), $("bg-color").value.toLowerCase()];
    document.querySelectorAll(".palette-button").forEach(button => {
      button.setAttribute("aria-pressed", String(presets[button.dataset.preset].every((color, index) => color === colors[index])));
    });
  }
  function captionLines(ctx, caption, width) {
    const characters = typeof Intl.Segmenter === "function"
      ? Array.from(new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(caption), part => part.segment)
      : Array.from(caption);
    const lines = [];
    let line = "";
    for (const character of characters) {
      if (line && ctx.measureText(line + character).width > width) {
        lines.push(line.trim());
        line = character.trimStart();
      } else {
        line += character;
      }
    }
    if (line) lines.push(line.trim());
    return lines;
  }
  input.addEventListener("input", updateInput);
  ["qr-size", "qr-caption"].forEach(id => $(id).addEventListener("input", resetResult));
  ["qr-color", "bg-color"].forEach(id => $(id).addEventListener("input", () => { updatePresetSelection(); resetResult(); }));
  document.querySelectorAll(".palette-button").forEach(button => button.addEventListener("click", () => {
    [$("qr-color").value, $("bg-color").value] = presets[button.dataset.preset];
    updatePresetSelection();
    resetResult();
  }));
  $("qr-form").addEventListener("submit", event => {
    event.preventDefault();
    resetResult();
    if (!input.value.trim()) {
      message("QRコードにしたい文字やURLを入力してください", true);
      input.focus();
      return;
    }
    const dark = $("qr-color").value, light = $("bg-color").value;
    const foreground = luminance(dark), background = luminance(light);
    if (foreground > .2 || background < .7 || (background + .05) / (foreground + .05) < 6) {
      message("読み取りやすいように、QRコードの色を暗く、背景色を明るくしてください。迷ったら黒と白がおすすめです。", true);
      $("advanced").open = true;
      return;
    }
    try {
      const qr = qrcode(0, "M");
      qr.addData(input.value, "Byte");
      qr.make();
      const size = Number($("qr-size").value), modules = qr.getModuleCount();
      const scale = Math.floor(size / (modules + 8));
      if (scale < 2) {
        message("このサイズではQRコードが細かすぎます。「大」を選ぶか、入力内容を短くしてください。", true);
        return;
      }
      const caption = $("qr-caption").value.trim();
      const fontSize = Math.max(16, Math.min(26, Math.round(size * .06)) - (caption.length > 80 ? 4 : caption.length > 40 ? 2 : 0));
      const lineHeight = Math.round(fontSize * 1.4);
      canvas.width = size;
      const ctx = canvas.getContext("2d");
      ctx.font = `600 ${fontSize}px "Yu Gothic", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif`;
      const lines = caption ? captionLines(ctx, caption, size - 48) : [];
      canvas.height = size + (lines.length ? 12 + lines.length * lineHeight + 20 : 0);
      ctx.font = `600 ${fontSize}px "Yu Gothic", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif`;
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = dark;
      const offset = Math.floor((size - modules * scale) / 2);
      for (let y = 0; y < modules; y++) for (let x = 0; x < modules; x++) {
        if (qr.isDark(y, x)) ctx.fillRect(offset + x * scale, offset + y * scale, scale, scale);
      }
      if (lines.length) {
        ctx.fillStyle = dark;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        lines.forEach((line, index) => ctx.fillText(line, size / 2, size + 12 + index * lineHeight));
      }
      canvas.setAttribute("aria-label", lines.length ? `説明文付きのQRコード：${caption}` : "作成したQRコード");
      canvas.hidden = false;
      $("placeholder").hidden = true;
      $("save").disabled = false;
      message("QRコードを作成しました。「QRコードを保存」で画像を保存できます。");
    } catch {
      message("入力内容が長すぎてQRコードを作成できませんでした。内容を短くして、もう一度お試しください。", true);
    }
  });
  $("save").addEventListener("click", () => {
    if (canvas.hidden) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "qr-code.png";
    document.body.append(a);
    a.click();
    a.remove();
  });
  $("clear").addEventListener("click", () => {
    $("qr-form").reset();
    $("advanced").open = false;
    updateInput();
    updatePresetSelection();
    input.focus();
  });
  updateInput();
  updatePresetSelection();
})();

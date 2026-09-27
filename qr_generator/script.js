"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const input = $("qr-input"), canvas = $("qr-canvas"), status = $("status");
  let timer, revision = 0;
  qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
  function message(text, error = false, temporary = false) {
    clearTimeout(timer);
    status.textContent = text;
    status.classList.toggle("error", error);
    if (temporary) timer = setTimeout(() => { status.textContent = ""; }, 3500);
  }
  function resetResult() {
    revision++;
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
    $("copy").disabled = !input.value;
    resetResult();
  }
  function luminance(hex) {
    const rgb = hex.match(/[a-f\d]{2}/gi).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  }
  input.addEventListener("input", updateInput);
  ["qr-size", "qr-color", "bg-color"].forEach(id => $(id).addEventListener("input", resetResult));
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
    if (foreground > .2 || background < .7 || (background + .05) / (foreground + .05) < 7) {
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
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = dark;
      const offset = Math.floor((size - modules * scale) / 2);
      for (let y = 0; y < modules; y++) for (let x = 0; x < modules; x++) {
        if (qr.isDark(y, x)) ctx.fillRect(offset + x * scale, offset + y * scale, scale, scale);
      }
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
  $("copy").addEventListener("click", async () => {
    if (!input.value) return;
    const version = revision;
    try {
      try { await navigator.clipboard.writeText(input.value); }
      catch {
        if (version !== revision) return;
        input.focus(); input.select();
        if (!document.execCommand("copy")) throw new Error("copy");
      }
      if (version === revision) message("コピーしました", false, true);
    } catch {
      if (version !== revision) return;
      input.focus(); input.select();
      message("自動コピーができませんでした。選択した入力内容をコピーしてください。", true);
    }
  });
  $("clear").addEventListener("click", () => {
    $("qr-form").reset();
    $("advanced").open = false;
    updateInput();
    input.focus();
  });
  updateInput();
})();

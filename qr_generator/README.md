# QRコード作成ツール

## 概要

URLや文章を入力し、QRコードを作ってPNG画像で保存するツールです。入力内容はブラウザ内で処理します。

## 主な機能

- 小・中・大のサイズ選択
- 色の設定と読み取りにくい配色の確認
- QRコードの下に説明文を追加（任意・日本語対応・長文は折り返し）。説明文は読み取るデータには含まれません
- 標準・ピンク・ブルー・グリーンのおすすめ配色をワンクリックで設定。設定後も色を個別に変更できます
- PNG保存と入力・設定のクリア

## 使い方

URLや文章を入力し、サイズを選んで「QRコードを作成する」を押します。表示を確認して「QRコードを保存」を押します。

必要なら説明文を入力します。「詳細設定（色を変える）」ではおすすめ配色を選ぶか、QRコードと背景の色を個別に指定できます。説明文を付けた場合は、QRコードと説明文を１枚のPNG画像で保存します。

## 起動・体験

[**QRコード作成ツールを開く**](https://yumin-snoopy.github.io/tools/qr_generator/)

## 使用技術

HTML・CSS・JavaScript

## ライセンス・外部ライブラリ

[qrcode-generator 1.4.4](https://github.com/kazuhikoarase/qrcode-generator) を使用しています。`qrcode.js`: Copyright (c) 2009 Kazuhiko Arase、`qrcode_UTF8.js`: Copyright (c) 2011 Kazuhiko Arase。どちらもMITライセンスです。著作権・ライセンス全文は [vendor/LICENSE](vendor/LICENSE) にあります。このツール自体のライセンスは明示されていません。

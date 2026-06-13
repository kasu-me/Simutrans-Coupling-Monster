---
name: jatab
description: ja.tab（Simutrans日本語化ファイル）の仕様と、このアプリでの読み書き実装を参照する際に使用する。
disable-model-invocation: false
---

# ja.tab 仕様ドキュメント

## 概要

`ja.tab` は Simutrans の翻訳ファイル形式で、アドオンの内部名（`name=` の値）と日本語名を対応付けるテキストファイルです。  
このアプリでは読み込み・編集・出力をサポートしています。

---

## Simutrans側の仕様

### ファイルフォーマット

```
§###########################################################
内部名
日本語名
内部名
日本語名
```

- **1行目（`§...`）**: `§` で始まる行は識別子として機能し、Simutrans側で読み込まれる際にファイルがUTF-8で書かれていることを識別するためのBOMのような役割を持つ。
- **以降**: 「内部名」と「日本語名」の2行ペアを繰り返す
- 空行は無視される

### 内部名（キー）

- datファイルの `name=` に対応するアドオン識別子
- 大文字小文字を区別する
- マッチする内部名が見つかった場合、その次の行が日本語名として採用される

### 編成テンプレート名の翻訳

ja.tab は車両アドオン名だけでなく、**編成テンプレートの `name=` 値**にも適用できる。  
編成テンプレートファイルの `name=テンプレート名` の値（例: `テンプレート名`）をキーとして ja.tab に記述することで、ゲーム内での表示名を翻訳できる。

```
§###########################################################
テンプレート名
テンプレートの日本語表示名
```

編成テンプレートファイルと ja.tab は別ファイルとして配布し、プレイヤーが好みに応じて適用できる形が一般的。

> **このアプリの実装状況:** 編成テンプレート名の ja.tab 対応は**未実装**。現状の `writeJaTab()` は車両アドオンの日本語名のみを出力する。

### 複数ファイルの結合

- 複数の `.tab` ファイルを同じアドオンセットに対して読み込める
- 後から読み込んだファイルの内容が既存の値を上書きする（このアプリの挙動による）

---

## このアプリでの実装

### グローバル状態

```js
// js/constants.js
let jatab = new Map();  // Map<addonオブジェクト, string（日本語名）>
```

- キーはaddonオブジェクトの参照（文字列ではない）
- `masterAddons` のリセット時（`loadDatFile` 冒頭）に `jatab = new Map()` でクリアされる

### 読み込み: `appendJaTab(file)` [js/main.js:296](js/main.js#L296)

```js
let tabs = tab.split("\n").map(x => x.trim()).filter(x => x != "");
masterAddons.forEach((addon) => {
    let name = addon.name;
    let index = tabs.indexOf(name);
    if (index != -1 && tabs[index + 1].trim() != "") {
        jatab.set(addon, tabs[index + 1]);
        count++;
    }
})
```

**挙動:**
- 空行をフィルタ後、各addonの `name` を行配列で検索
- 見つかった行の次の行が日本語名（空文字の場合は登録しない）
- 戻り値は適用できた件数（Promise経由）
- ファイル名が `.tab` 以外の場合は無視される（`ui.js` の `loadAndSetJaTabFile` で制御）

**注意:** `.tab` ファイルであれば `ja.tab` という名前でなくても読み込める。

### 出力: `writeJaTab()` [js/main.js:341](js/main.js#L341)

```js
function writeJaTab() {
    let tab = "§###########################################################\n";
    jatab.forEach((japaneseName, addon) => {
        tab += `${addon.name}\n`;
        tab += `${japaneseName}\n`;
    })
    return tab
}
```

- 先頭に固定のセクションヘッダー行を出力
- `jatab` Mapのイテレーション順（登録順）で出力
- `masterAddons` の順序とは独立

### 保存: `saveFile('ja.tab')` [js/main.js:40](js/main.js#L40)

```js
let fileName = "ja.tab";
if (type == "ja.tab" && jatab.size == 0) {
    new Message("日本語化ファイルは内容が存在しないため保存しませんでした。", ...);
} else {
    downloadFile(text, fileName);
}
```

- `jatab` が空の場合はファイルを生成せずにエラーメッセージを表示
- 出力ファイル名は常に `ja.tab` 固定

### 日本語名の取得: `getJapaneseNameFromAddon()` [js/main.js:76](js/main.js#L76)

```js
function getJapaneseNameFromAddon(addon, unsetString, prefix) {
    return jatab.has(addon) 
        ? `${prefix != undefined ? prefix : ""}${jatab.get(addon)}` 
        : unsetString != undefined ? unsetString : "";
}
```

| 引数 | 説明 |
|------|------|
| `addon` | addonオブジェクト |
| `unsetString` | 未設定時のフォールバック文字列（省略時は空文字） |
| `prefix` | 日本語名の前に付けるプレフィックス（省略時は何もつけない） |

### UIとの連携

| 場所 | 処理 |
|------|------|
| メイン画面の日本語名入力欄 (`jatabtable-japanese-name`) | `input` イベントで `jatab.set/delete` を直接操作 |
| フッターの車両リスト | `jatab.has(addon)` で日本語名の有無を判定して表示 |
| dat読み込み時のアドオン上書き | 旧addonのjatab値を新addonオブジェクトへ移行 ([js/main.js:211](js/main.js#L211)) |
| Ctrl+S | `saveFile('dat')` と `saveFile('ja.tab')` を同時実行 |

### dat読み込み時のキー移行 [js/main.js:211](js/main.js#L211)

同名アドオンを上書き読み込みした場合、旧addonオブジェクトへのjatabエントリを新addonオブジェクトへ移し替える。

```js
if (isAddonExists && jatab.has(oldAddon)) {
    jatab.set(tmpAddons.at(-1), jatab.get(oldAddon));
    jatab.delete(oldAddon);
}
```

---

## UI操作フロー

### ja.tabを読み込む

1. ヘッダーメニューから「日本語化ファイルを読み込み」を開く（`openJaTabFileDialog`）
2. `.tab` ファイルをドラッグ＆ドロップ（複数ファイル可）
3. マッチしたaddonに日本語名が適用され、フッター車両リストに反映される

### 日本語名を手動編集する

- メイン画面上部の日本語名入力欄で直接編集できる
- 空文字にすると `jatab` から削除される（`jatab.delete(addon)`）

### ja.tabを保存する

- ヘッダーメニューから「保存」→「ja.tab」を選択
- または Ctrl+S（dat と同時保存）

---

## 注意点・既知の挙動

- `jatab` のキーはaddonオブジェクトの参照のため、`masterAddons` のリセット（`resetAll()`）後は全エントリが失われる
- 複数の `.tab` ファイルを読み込んだ場合、同じアドオン名が複数ファイルにあると後勝ち
- ファイル名は `ja.tab` 以外でも読み込み可能だが、出力は常に `ja.tab` という名前で保存される
- `writeJaTab()` の出力順は `jatab` Mapの挿入順（`masterAddons` の並び順とは異なる場合がある）

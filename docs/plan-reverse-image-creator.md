# 編成反転時用画像 作成支援機能 実装計画

関連仕様: https://github.com/teamhimeh/simutrans/wiki/編成反転時用画像について-Image-for-Reversing
関連計画: [編成反転機能 実装計画](plan-reverse-formation.md)（反転画像の **指定** 機能。本計画は反転画像の **作成** 機能）

---

## 背景・目的

OTRP Patch の編成反転機能では、通常画像とは別に「編成反転時用画像」を用意する必要がある。
通常画像と反転時画像の主な違いは **ライト（前照灯／尾灯）の切り替え** であり、
前照灯／尾灯は発光表現のための特殊色が使われていることがほとんど。
したがって **比較的単純な色の置き換え** で反転時画像を作成できると考えられる。

本機能は、アプリ上で読み込み済みの画像に対して色置換を行い、反転時画像を作成して
**メモリに登録 ＋ PC にダウンロード** することで、反転時画像の作成を支援する。

> 本機能は画像を **作成して imageFiles に登録する** までが責務。
> 作成した画像を `freightimage[1]` に割り当てるのは既存の反転画像指定機能（editImageDialog の反転モード）が担う。

---

## 操作フロー（完成イメージ）

1. ユーザーが従来通り画像・dat・tab を読み込む（既存機能）。
2. 読み込み済み画像から任意の1枚を選び、本機能（色置換）で反転時画像を作成する。
   - 作成結果は `imageFiles` / `imageFileNames` に登録され、同時に PC にダウンロードされる。
3. 作成した画像を、既存の反転画像指定機能（editImageDialog の「反転時画像」モード）で
   `freightimage[1]` に指定する。

---

## 設計上の決定事項（確認済み）

| 項目 | 決定 |
|---|---|
| 起動経路 | **2か所に入口を置く**。①「画像ファイルリスト」(imageListDialog) の読込済み画像の行ボタン、②ヘッダー「画像」メニューの独立項目。専用ダイアログは1つ。 |
| 出力ファイル名 | **自動サフィックス＋編集可**。初期値 = `元画像名 + REVERSE_IMAGE_SUFFIX`（例 `_reverse`）。テキスト入力で変更可。空欄・既存名との衝突はチェック。 |
| 色の選択方法 | ①ブラウザ標準カラーピッカー (`<input type="color">`)、②**対象画像からのスポイト取得**、③**Simutrans 特殊色プリセットから選択** の3方式。`from` / `to` のどちらの色選択でも全方式を利用可。 |
| 特殊色プリセット | 透過色(1)・プレイヤーカラー(16)・発光色(15) をカテゴリ別に内蔵し、色見本パレットから選択可能にする（今回スコープに含める）。 |
| ブロック単位 | `PAK_TYPE`(128) px 単位のブロックごとに置換対象 ON/OFF を切替（要件）。デフォルトは **全ブロック対象**。 |
| 出力先 | メモリ登録（`imageFiles`/`imageFileNames`）＋ ダウンロードの **両方**（要件）。 |

---

## 再利用できる既存実装パターン

新規ロジックの大半は既存パターンの組み合わせで実装できる。

| やりたいこと | 参照する既存実装 |
|---|---|
| canvas でピクセル単位の色操作 | `getTransparentImage()`（[js/defineDialogs.js](../js/defineDialogs.js) formatedAddonsImageDialog 内）。`drawImage → getImageData → data[] を RGBA で走査・書換 → putImageData` の流れがそのまま色置換に使える。 |
| canvas をダウンロード | `formatedAddonsImageDialog.functions.saveAsFile()`。`canvas.toDataURL()` → `<a download>` → `click()`。 |
| 画像をメモリ(imageFiles)に登録 | `appendImageToImagesList(fileName, file)`（[js/main.js](../js/main.js)）。`file` は Blob でも可（FileReader.readAsDataURL）。`canvas.toBlob()` の Blob を渡せば再利用できる。 |
| 新規画像追加ダイアログの流れ | `addNewImageDialog`（[js/defineDialogs.js](../js/defineDialogs.js)）。`appendImageToImagesList(...).then(() => { refresh(); off(); })`。 |
| スプライトシート全体表示＋ブロック座標の算出 | `editImageDialog`（同上）。`#addon-image-whole-preview` に `background-image`、`imageDisplaySizeRatio = 600 / image.width` でスケール、マウス座標から `Math.floor((clientX - rect.left) / PAK_TYPE / ratio)` でブロック col/row を算出。**本機能のブロック選択 UI はこれをほぼ踏襲する。** |
| ブロックオーバーレイの CSS | [css/dialogs/editImageDialog.css](../css/dialogs/editImageDialog.css) の `#addon-image-whole-preview`（relative 背景＋絶対配置のポインタ）。 |
| 画像プレビュー（方向別） | `setAddonPreviewImageByDirection()`（[js/ui.js](../js/ui.js)）。 |
| 読込済み画像の一覧・行操作 | `imageListDialog`（[js/defineDialogs.js](../js/defineDialogs.js)）。行ごとに `imageFiles.has(fileName)` で読込済み判定し操作ボタンを出している。 |

---

## データ構造

専用ダイアログ `reverseImageCreatorDialog` の `functions` に以下の状態を持つ。

```js
sourceImageName: "",          // 元画像のファイル名（imageFiles のキー）
colorPairs: [],               // [{ from: [r,g,b], to: [r,g,b] }, ...] 色ペア（複数）
targetBlocks: new Set(),      // "col,row" 文字列の集合。置換対象の128pxブロック
sourceImageData: null,        // 元画像の ImageData をキャッシュ（スポイトの色取得用）
eyedropper: null,             // スポイトモード中の対象。null / { index, slot:"from"|"to" }
presetTarget: null,           // 特殊色プリセット選択中の対象。null / { index, slot:"from"|"to" }
```

- 色は内部的には `[r,g,b]` 配列で保持し、UI（`input[type=color]`）とは HEX 文字列で相互変換する。
- ブロックは `"col,row"`（例 `"0,1"`）をキーにした `Set` で「対象ブロック」を管理（要件の「任意ブロックを対象に/対象外に」をトグルで実現）。

---

## フェーズ別実装計画

---

### Phase 1: コアロジック（色置換エンジン・補助関数）

**対象ファイル:** `js/constants.js`, `js/main.js`

#### 1-1. constants.js

```js
// 反転時画像の既定ファイル名サフィックス
const REVERSE_IMAGE_SUFFIX = "_reverse";

// Simutrans 特殊色プリセット（色ペアの from / to 双方で選択可能にする）
// 透過色 #E7FFFF は既存の透過キーカラー RGB(231,255,255)（getTransparentImage 参照）と同一
const SPECIAL_COLOR_PRESETS = [
    {
        category: "透過色",
        description: "ゲーム中では透過され表示されない",
        colors: ["#E7FFFF"],
    },
    {
        category: "プレイヤーカラー",
        description: "ゲーム中では各プレイヤーの色に置き換えられる",
        colors: [
            "#244B67", "#395E7C", "#4C7191", "#6084A7", "#7497BD", "#88ABD3", "#9CBEE9", "#B0D2FF",
            "#7B5803", "#8E6F04", "#A18605", "#B49D07", "#C6B408", "#D9CB0A", "#ECE20B", "#FFF90D",
        ],
    },
    {
        category: "発光色",
        description: "夜間に暗くならない色",
        colors: [
            "#01DD01", "#FF211D", "#FFFF53", "#7F9BF1", "#C1B1D1", "#57656F", "#E3E3FF", "#4D4D4D",
            "#FF017F", "#0101FF", "#6B6B6B", "#9B9B9B", "#B3B3B3", "#C9C9C9", "#DFDFDF",
        ],
    },
];
```

#### 1-2. main.js — 色置換エンジン

スプライトシート全体（`HTMLImageElement`）に対し、対象ブロック内かつ色ペアに一致する
ピクセルのみを置換した canvas を返す。

```js
// "#rrggbb" → [r,g,b]
function hexToRgb(hex) {
    return [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
}
// [r,g,b] → "#rrggbb"
function rgbToHex(rgb) {
    return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
}

// 色置換した結果の canvas を生成する
// image       : 元画像(スプライトシート全体)の HTMLImageElement
// colorPairs  : [{ from:[r,g,b], to:[r,g,b] }, ...]
// targetBlocks: Set<"col,row"> 置換対象の128pxブロック
function createColorReplacedCanvas(image, colorPairs, targetBlocks) {
    let canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;
    for (let p = 0; p < data.length; p += 4) {
        if (data[p + 3] === 0) { continue; }              // 透明ピクセルは対象外
        let pixelIndex = p / 4;
        let px = pixelIndex % canvas.width;
        let py = Math.floor(pixelIndex / canvas.width);
        let block = `${Math.floor(px / PAK_TYPE)},${Math.floor(py / PAK_TYPE)}`;
        if (!targetBlocks.has(block)) { continue; }        // 対象外ブロックはスキップ
        for (let pair of colorPairs) {
            if (data[p] === pair.from[0] && data[p + 1] === pair.from[1] && data[p + 2] === pair.from[2]) {
                data[p] = pair.to[0];
                data[p + 1] = pair.to[1];
                data[p + 2] = pair.to[2];
                break;                                     // 1ピクセルにつき最初の一致のみ適用
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}
```

**設計上の注意:**
- **透明ピクセル(alpha=0)は置換対象外**。透明部分の RGB がたまたま `from` 色と一致しても置換しない。
- **アルファ値は維持**（RGB のみ置換）。発光特殊色は不透明なので問題なし。
- 1ピクセルは **最初に一致した1ペアのみ** 適用（`break`）。`from` 色が重複指定された場合の二重置換を防ぐ。
- 完全一致での置換。発光色に複数階調がある場合はペアを複数指定して対応（許容誤差は将来拡張、後述）。

#### 1-3. main.js — canvas のメモリ登録

`appendImageToImagesList` を再利用するため、canvas を Blob 化して渡す。

```js
// canvas を imageFiles / imageFileNames に登録する
function registerCanvasAsImage(fileName, canvas) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            appendImageToImagesList(fileName, blob).then(resolve);
        });
    });
}
```

#### 1-4. main.js — canvas のダウンロード

`saveAsFile` と同じパターン。

```js
function downloadCanvas(canvas, fileName) {
    let link = document.createElement("a");
    link.href = canvas.toDataURL();
    link.download = `${fileName}.png`;
    link.click();
}
```

#### 1-5. main.js — スポイト用のピクセル色取得

毎クリックで `drawImage` するのは非効率なため、**ダイアログ表示時に元画像の `ImageData` を一度だけ取得してキャッシュ**し（`sourceImageData`）、そこから色を引く。

```js
// キャッシュ済み ImageData から (x,y) のピクセル色 [r,g,b] を取得
function getPixelColorFromImageData(imageData, x, y) {
    let p = (y * imageData.width + x) * 4;
    return [imageData.data[p], imageData.data[p + 1], imageData.data[p + 2]];
}
```

---

### Phase 2: 専用ダイアログ UI（reverseImageCreatorDialog）

**対象ファイル:** `js/defineDialogs.js`（`window load` 内に追加）
**ダイアログ:** `isOverlay = true`（imageListDialog やメニューの上に重ねて表示）

#### 2-1. HTML 構造（htmlContent イメージ）

```html
<table class="input-area">
  <tr><td>元画像</td><td>
    <span class="selectbox-fluctuation-button">
      <select id="reverse-creator-source-image"></select>
    </span>
  </td></tr>
  <tr><td>保存ファイル名</td><td>
    <input id="reverse-creator-filename" type="text">
  </td></tr>
</table>

<!-- 色ペアリスト -->
<div id="reverse-creator-color-pairs"></div>
<button id="reverse-creator-add-pair" class="lsf-icon" icon="add">色のペアを追加</button>

<!-- ブロック選択（スプライトシート全体＋128pxグリッド） -->
<p>↓ クリックで128pxブロックの置換対象を切替（スポイト中はクリックで色取得）↓</p>
<div id="reverse-creator-block-controls">
  <button id="reverse-creator-select-all">全ブロック対象</button>
  <button id="reverse-creator-deselect-all">全ブロック対象外</button>
</div>
<div id="reverse-creator-sheet">
  <!-- JSでブロックグリッドのセルを生成して重ねる -->
</div>

<!-- Before / After プレビュー -->
<div id="reverse-creator-preview">
  <div><p>変換後</p><canvas id="reverse-creator-preview-after"></canvas></div>
</div>
```

ボタン: `[作成（メモリ追加＋ダウンロード）]` `[閉じる]`

#### 2-2. 色ペアリストの UI（1ペア = 1行）

各行のイメージ:

```
[変換前: <input type=color>] [スポイト] → [変換後: <input type=color>] [スポイト] [削除]
```

- `<input type="color">` … カラーピッカー。
- スポイトボタン … 押すと `eyedropper = { index, slot }` をセットしスポイトモードに入る（次にシート画像をクリックすると、その色を該当 input に反映）。スポイト中はボタンを active 表示。
- **プリセットボタン** … 押すと `presetTarget = { index, slot }` をセットし、特殊色プリセットパレット（2-2a）を開く。色見本クリックで該当 input に反映。`from` / `to` どちらのボタンからも開ける。
- 削除ボタン … その色ペアを削除。
- 「色のペアを追加」… `colorPairs.push({from:[...], to:[...]})` して再描画。
- 各 input の `change` で `colorPairs` を更新し、プレビューを更新。
- カラーピッカー／スポイト／プリセットはいずれも最終的に `applyColorToTarget(index, slot, rgb)` を通して `colorPairs[index][slot]` を更新する共通経路にすると整理しやすい。

#### 2-2a. 特殊色プリセットパレット

`SPECIAL_COLOR_PRESETS`（constants.js）をカテゴリ別の色見本グリッドで表示する共通 UI。

- カテゴリ（透過色／プレイヤーカラー／発光色）ごとに見出し＋説明を出し、その下に色見本（`background-color` を各色にした `<button>` 等）を並べる。
- 色見本クリック → `applyColorToTarget(presetTarget.index, presetTarget.slot, hexToRgb(色))` → パレットを閉じる。
- 各見本に色コード（例 `#FF211D`）を `mku-balloon`（ツールチップ）で表示すると親切。
- **パレット自体は1つを共用し、`presetTarget` で反映先（どの行の from/to か）を切り替える**（スポイトと同じ考え方）。
- 表示形態は、色ペア行付近に出すポップオーバー（既存 `js/utils/dropdown.js` / `balloon.js` 流用可）か `isOverlay` の小ダイアログのいずれか。実装しやすい方を選ぶ。

#### 2-3. ブロック選択 UI

editImageDialog の `#addon-image-whole-preview` を踏襲する。

- `#reverse-creator-sheet` に元画像を `background-image` で表示、`ratio = 600 / image.width` でスケール、`height = image.height * ratio`。
- その上に **ブロック数分の `<div>` セル**（`cols = ceil(width/PAK_TYPE)`、`rows = ceil(height/PAK_TYPE)`）を絶対配置で敷き詰める。各セルに `data-block="col,row"` を持たせる。
  - セルサイズ = `PAK_TYPE * ratio`。
  - 対象ブロックは半透明ハイライト、対象外は暗くマスク（CSS クラスでトグル）。
- セルクリック時:
  - スポイトモードなら → クリック座標を実ピクセル座標 `x = floor((clientX-rect.left)/ratio)`, `y = floor((clientY-rect.top)/ratio)` に変換し、`getPixelColorFromImageData` で色取得 → 対象 input に反映 → スポイト解除。
  - 通常時なら → `targetBlocks` に対して当該ブロックを add/delete トグル → 見た目更新 → プレビュー更新。
- 「全ブロック対象 / 対象外」ボタンで `targetBlocks` を一括設定。

> スポイトの対象はこのシート画像を共用する（別途プレビュー画像を置かない）。
> スポイトモード中だけクリックの意味がブロックトグルから色取得に切り替わる。

#### 2-4. プレビュー（Before / After）

- `before` canvas … 元画像をそのまま描画。
- `after` canvas … `createColorReplacedCanvas(image, colorPairs, targetBlocks)` の結果を描画。
- 色ペア・ブロック選択の変更時に `after` を更新。スプライトシートが大きい場合に備え、**更新は軽くデバウンス**（連続操作でのピクセル全走査の多発を避ける）。
- 表示は等倍だと大きいため、CSS で最大幅を制限（`max-width` ＋ `image-rendering: pixelated` でドット感を保つ）。

#### 2-5. functions 設計

```js
{
  sourceImageName: "", colorPairs: [], targetBlocks: new Set(),
  sourceImageData: null, eyedropper: null, presetTarget: null,

  // fileName 省略時はセレクトボックスの先頭 / 指定時はその画像を選択
  display: function (fileName) { /* 初期化 → on() */ },

  selectSourceImage: function (fileName) { /* 元画像確定→ImageDataキャッシュ・全ブロック対象・FILE名初期値・グリッド再構築・プレビュー */ },
  buildBlockGrid: function () { /* シート背景とブロックセルを生成 */ },
  toggleBlock: function (block) { /* targetBlocks add/delete */ },
  setAllBlocks: function (on) { /* 全ON/OFF */ },

  addColorPair: function () {}, removeColorPair: function (i) {},
  renderColorPairs: function () { /* 色ペア行を再描画 */ },
  startEyedropper: function (index, slot) {}, applyEyedropper: function (rgb) {},
  openPresetPalette: function (index, slot) {},        // presetTarget をセットしパレット表示
  applyColorToTarget: function (index, slot, rgb) {},  // ピッカー/スポイト/プリセット共通の反映経路

  updatePreview: function () { /* createColorReplacedCanvas → after canvas（デバウンス） */ },
  create: function () { /* バリデーション→registerCanvasAsImage＋downloadCanvas→Message→refresh→off */ },
}
```

#### 2-6. 作成（create）の処理とバリデーション

```
1. 元画像が選択されているか（imageFiles に存在するか）
2. ファイル名が空でないか
3. ファイル名が既存（imageFileNames）と衝突しないか
   → 衝突時は confirmDialog で「上書きしますか？」を確認
4. createColorReplacedCanvas で結果canvasを生成
5. registerCanvasAsImage（メモリ登録）
6. downloadCanvas（ダウンロード）
7. Message で完了通知 → refresh() → ダイアログを閉じる
```

> 色ペアが0件・対象ブロック0件でも「元画像のコピー」を作る用途はあり得るため、エラーにはせず注意表示に留める（要検討）。

---

### Phase 3: 起動経路（2か所）

**対象ファイル:** `js/defineDialogs.js`（imageListDialog）, `index.html`（メニュー）

#### 3-1. imageListDialog の行ボタン追加

[js/defineDialogs.js](../js/defineDialogs.js) の `imageListDialog.functions.display` で、
**読込済み画像（`imageFiles.has(fileName)` が true）の行** の操作セルに作成ボタンを追加する。

```js
// 変更前（読込済みの行）
table.addCell(`<button class="lsf mku-balloon" mku-balloon-message="画像を見る" onclick="Dialog.list.imageListDialog.functions.openImage('${fileName}')">eye</button>`);

// 変更後
table.addCell(
  `<button class="lsf mku-balloon" mku-balloon-message="画像を見る" onclick="Dialog.list.imageListDialog.functions.openImage('${fileName}')">eye</button>` +
  `<button class="lsf mku-balloon" mku-balloon-message="反転時画像を作成" onclick="Dialog.list.reverseImageCreatorDialog.functions.display('${fileName}')">（アイコン）</button>`
);
```

> アイコンは LigatureSymbols から反転/変換を表すもの（例 `swap` / `flip` 系）を選定。
> 無ければ既存の `image` 等で代替。

#### 3-2. ヘッダー「画像」メニューに項目追加

[index.html](../index.html) の「画像」ドロップメニュー（`#L79`〜`#L87`）、
`画像ファイルリスト` ボタン（`#L85`）の直後に追加。

```html
<button class="lsf-icon" icon="（アイコン）"
    onclick="Dialog.list.reverseImageCreatorDialog.functions.display()">反転時画像を作成</button>
```

- メニュー経由（引数なし `display()`）の場合はダイアログ内のセレクトボックスで元画像を選ぶ。
- このボタンは `refresh()`（[js/ui.js](../js/ui.js)）のメニュー活性制御により、dat 未読込時は自動で `disabled` になる（既存挙動に追従）。

#### 3-3. 読込済み画像が無い場合のガード

メニューから開いた際、`imageFiles.size == 0`（読込済み画像なし）なら
`alertDialog` で「先に画像を読み込んでください。」を表示して開かない
（selectImageDialog が `masterAddons.length==0` をチェックしているのと同様）。

---

### Phase 4: CSS

**対象ファイル:** `css/dialogs/reverseImageCreatorDialog.css`（新規）, `index.html`

#### 4-1. CSS 新規作成

- 色ペアリスト行のレイアウト（flex で `[color][スポイト][プリセット]→[color][スポイト][プリセット][削除]`）。
- スポイト／プリセットボタンの active 状態のスタイル。
- 特殊色プリセットパレット（カテゴリ見出し＋説明＋色見本グリッド。見本は正方形、hover で枠線ハイライト。透過色見本はチェッカー背景で透明と区別）。
- ブロック選択シート（`editImageDialog.css` の `#addon-image-whole-preview` を流用）:
  - `position: relative` 背景画像、`background-color: var(--simutrans-transparent)`。
  - ブロックセル `position: absolute`、対象/対象外でマスクの有無を切替（`.target` クラス等）。
  - hover で枠線ハイライト。
- Before/After プレビュー（`flex` 横並び、`canvas { max-width; image-rendering: pixelated }`）。

#### 4-2. index.html に link 追加

[index.html:28](../index.html#L28)（`formationTemplateDialog.css`）の後に追記:

```html
<link rel="stylesheet" type="text/css" href="css/dialogs/reverseImageCreatorDialog.css">
```

---

## 実装順序

1. **Phase 1**（コアロジック）: `createColorReplacedCanvas` / `registerCanvasAsImage` / `downloadCanvas` / 色変換 / ピクセル取得。単体で node + canvas モック、または手動で動作確認。
2. **Phase 2**（ダイアログ UI）: HTML → functions → ブロック選択 → 色ペア → スポイト → プレビュー → 作成。
3. **Phase 3**（起動経路）: imageListDialog 行ボタン → メニュー項目 → ガード。
4. **Phase 4**（CSS）: 仕上げと見た目調整。

> Phase 1 と Phase 2 の UI 骨格を先に通し、最小構成（色ペア1組・全ブロック対象・プレビューなし）で
> 「作成→メモリ登録→ダウンロード→editImageDialog で反転指定」まで一気通貫を確認してから、
> ブロック選択／スポイト／複数ペア／プレビューを足していくと安全。

---

## 影響範囲チェックリスト

- [ ] 既存機能への副作用がないか（新規追加が主。imageListDialog の行とメニューに項目追加のみ）。
- [ ] `appendImageToImagesList` に Blob を渡して正しく登録されるか（File と同様に動くこと）。
- [ ] 作成画像が `imageFiles`/`imageFileNames` に登録され、editImageDialog の画像名セレクトに出るか。
- [ ] 作成後 `refresh()` で各所のプレビュー・画像名候補が更新されるか。
- [ ] ファイル名の既存衝突時に上書き確認が出るか。
- [ ] 透明ピクセルが置換されないか（透過部分の色化けがないこと）。
- [ ] 大きいスプライトシートでプレビュー更新が極端に重くならないか（デバウンス・更新範囲）。
- [ ] dat 未読込・画像未読込時にメニュー項目が無効化／ガードされるか。
- [ ] スポイトでブロックグリッドのスケール換算が正しく実ピクセル色を拾えるか。
- [ ] 特殊色プリセットがカテゴリ別に表示され、`from` / `to` 双方に正しく反映されるか。
- [ ] 透過色プリセット `#E7FFFF` が既存の透過キーカラー `RGB(231,255,255)` と一致しているか。

---

## 保留事項・将来拡張

- **色の許容誤差(tolerance)**: JPEG 由来のにじみや複数階調の発光色に対し、近似色をまとめて置換する誤差指定。今回は完全一致のみ。
- **ユーザー定義プリセットの追加・保存**: 内蔵の特殊色プリセット（透過色／プレイヤーカラー／発光色）に加え、ユーザー独自色を登録・保存（localStorage 等）できるようにする。今回は内蔵プリセットまで対応。
- **複数画像の一括処理**: 複数スプライトシートへ同じ色ペアを一括適用。今回は1枚ずつ。
- **左右反転・回転などの幾何変換**: 本機能は色置換のみ。反転画像は「アドオン正方向と逆向き」で別途用意される前提（既存仕様どおり）。
- **作成と同時に freightimage[1] へ自動割当**: 作成→指定を1ステップにする導線。今回は作成までで、指定は既存 editImageDialog に委ねる。

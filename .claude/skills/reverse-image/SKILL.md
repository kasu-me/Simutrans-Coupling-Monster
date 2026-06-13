---
name: reverse-image
description: 編成反転時用画像(FreightImage[1] / OTRP編成反転機能)の読み書き・編集・プレビューを扱う際に使用する。
disable-model-invocation: false
---

# 編成反転時用画像機能 スキルドキュメント

## 概要

Simutrans OTRP Patch の「編成反転時用画像 (Image for Reversing)」機能に対応する。
編成が反転走行する際、前照灯と尾灯の切り替えなどのために通常時と異なる画像を表示する仕組み。
このアプリでは反転時画像 (`FreightImage[1]`) の **読み込み・編集・出力・プレビュー** に対応する。

仕様: https://github.com/teamhimeh/simutrans/wiki/編成反転時用画像について-Image-for-Reversing

---

## Simutrans側の仕様

### dat記述例

```
freightimagetype[0]=Passagiere      # index0 = 積載種(freight と同じ値)
freightimagetype[1]=Reverse         # index1 = 反転時(固定値 "Reverse")

EmptyImage[s]=image.0.0             # 通常(空車)画像
FreightImage[0][s]=image.0.0        # 正方向画像 = EmptyImage と同一にする
FreightImage[1][s]=image.1.0        # 反転時画像
FreightImage[1][e]=image.1.1
```

### 重要な仕様ポイント

- `FreightImage[0][方向]` は **EmptyImage[方向] と同一**にする（「積載画像と反転画像の両立は不可」のため、正方向の見た目＝空車の見た目）。
- `FreightImage[1][方向]` の方向は「アドオン正方向（反転走行時と逆向き）」で指定する。
- 表示には `good.Reverse.pak` の併用が必要（ツール側の責務外だが、編集ダイアログに注意書きを表示）。
- 従来 pak との互換性あり（未記述なら通常動作）。
- v52以降の拡張: `freightimagetype[2]=No_Electric` / `freightimagetype[3]=Reverse_No_Electric`（非電化区間用、パンタ下げ表現）。**本アプリでは編集非対応だが、データはラウンドトリップ保全する。**

---

## このアプリでの実装

### データモデル（要）

- アドオンが保持する反転データは **`freightimage[1][dir]` プロパティのみ**（編集対象のコアデータ）。
- 「反転画像あり」の判定 = `freightimage[1][dir]` が1つでも存在すること。
- `freightimagetype[0]/[1]` と `freightimage[0][dir]` は **保存時に自動生成**（編集時には保持しない）。
  - `freightimage[0][dir] = emptyimage[dir]`
  - `freightimagetype[0] = addon.freight ?? "Passagiere"`
  - `freightimagetype[1] = "Reverse"`
- 読み込み時、`freightimage[0]` / `freightimagetype[0]` / `freightimagetype[1]` は破棄（再生成するため）。
- `index>=2`（No_Electric等）の `freightimagetype[n]` / `freightimage[n][dir]` は raw プロパティとして保持・再出力する。

### 定数・ヘルパー（[js/constants.js](js/constants.js)）

| 名前 | 内容 |
|------|------|
| `FREIGHTIMAGE` | `"freightimage"` |
| `FREIGHTIMAGETYPE` | `"freightimagetype"` |
| `REVERSE_IMAGE_TYPE_INDEX` | `1`（反転時画像のインデックス） |
| `getFreightImageKey(typeIndex, dir)` | `"freightimage[1][s]"` 形式のキーを生成 |
| `REVERSE_FREIGHTIMAGE_DIRECTIONS` | `freightimage[1][s]` … 8方向分のキー配列 |

### データ層（[js/main.js](js/main.js)）

| 関数 | 処理 |
|------|------|
| `loadDatFile` 内のパース | 正規表現 `/^freightimage\[(\d+)\]\[(\w+)\]$/` と `/^freightimagetype\[(\d+)\]$/` で判定。index0は破棄、1は保持、>=2は保全。`freightimagetype` は `freightimage` に前方一致するため **先に判定する**。 |
| `writeDat` | 汎用ループで `freightimage*` / `freightimagetype*` をスキップし、`generateReverseImageDat(addon)` の結果を constraint の直前に連結。 |
| `generateReverseImageDat(addon)` | 反転画像があれば `freightimagetype[0/1]` + `freightimage[0]`(=emptyimage) + `freightimage[1]` + 保全分(>=2) を生成。なければ保全分のみ。 |
| `changeReverseImage(addon, fileName)` | 設定済み方向の反転画像のファイル名のみ変更（位置 y/x は維持）。 |
| `getReverseDisplayImageKey(addon)` | 反転画像があればそのキー、なければ通常画像キー(s方向)を返す。 |
| `getFormationImageData(addon, useReverse)` | 編成表示用の画像データ `[name, y, x]` を取得。 |

### UI（[js/defineDialogs.js](js/defineDialogs.js)）

#### 画像指定ダイアログ (editImageDialog)

- 「通常画像 / 反転時画像」の切替ラジオ (`#image-type-selector`)、注意書き (`#reverse-image-note`)、「反転画像を全削除」ボタン。
- `functions.editingImageType`（`"empty"` / `"reverse"`）と `functions.getEditingImageKey(dir)` でモード分岐。クリック・shift一括設定・ファイル名変更・全削除すべてこのキー経由。
- 反転画像が未設定の方向は、基準スプライトシートとして emptyimage のファイルを表示（`functions.reverseSheetOverride` で別シートに切替可能）。プレビューボックスは未設定なら noimage 表示。
- CSS: [css/dialogs/editImageDialog.css](css/dialogs/editImageDialog.css)

#### 連結プレビュー (couplingPreviewDialog) / 編成撮影 (formatedAddonsImageDialog)

- それぞれ「反転表示」「反転して撮影」チェックボックス (`#preview-reverse-toggle` / `#screenshot-reverse-toggle`)。
- **車両順序は変えず、各車両の画像のみ反転画像に切り替える**（反転画像自体が反転後の見た目を表現するため、順序を逆にすると二重反転になり誤り）。
- 撮影ダイアログは連結プレビューのトグル状態を引き継ぐ（両者の見た目が食い違わないように）。
- `setAddonPreviewImageByDirection(target, addon, dir, imageKey)` の第4引数 `imageKey` に反転キーを渡して画像を切替（[js/ui.js](js/ui.js)）。

### UIフィルタ（反転画像を汎用UIから除外）

- プロパティ表 ([js/ui.js](js/ui.js) `refresh`)、プロパティ追加ダイアログ、車両コピーダイアログの「対象プロパティ」収集で `prop.startsWith(FREIGHTIMAGE)` を除外（`freightimagetype` も前方一致で同時に除外される）。
- 車両コピーの「画像指定」チェックでは emptyimage と同様に freightimage もコピー対象。

---

## 注意点・落とし穴

1. **`freightimagetype` は `freightimage` に前方一致する**。`startsWith(FREIGHTIMAGE)` は両方にマッチするので、個別判定が必要な箇所では正規表現を使い、`freightimagetype` を先に判定する。
2. **`freightimage[0]` を手動保存しない**。emptyimage 編集後にズレるのを防ぐため、必ず writeDat で emptyimage から再生成する設計。
3. プレビュー・撮影で **順序を反転しない**（過去に順序反転を実装したが、二重反転になるため撤去した経緯あり）。
4. No_Electric (`index>=2`) は編集UIを持たないが、`freightimage[1]` が存在すれば writeDat で `freightimagetype[0/1]` と `freightimage[0]` が再生成され、保全した `index>=2` と合わせて整合の取れた dat に復元される。
5. データ層の検証は、ブラウザAPIをモックして `constants.js` / `main.js` を `vm` で評価する node テストが有効（`vm` の `let` グローバルはコンテキスト内で代入する必要がある点に注意）。

---

## 関連

- 計画書: [docs/plan-reverse-formation.md](docs/plan-reverse-formation.md)
- 同じく OTRP 連携機能: 編成テンプレート（`formation-template` スキル）。連結プレビューダイアログを共有する。

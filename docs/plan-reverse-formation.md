# 編成反転機能 実装計画

参照仕様: https://github.com/teamhimeh/simutrans/wiki/編成反転時用画像について-Image-for-Reversing

---

## 仕様まとめ

### dat形式の新キー（仕様ページの実例で確認済み）

```
freightimagetype[0]=Passagiere      # index0 = 積載種（freight と同じ値）
freightimagetype[1]=Reverse         # index1 = 反転時（固定値 "Reverse"）

EmptyImage[S]=image.0.0             # 通常（空車）画像
...
FreightImage[0][S]=image.0.0        # 正方向画像 ＝ EmptyImage と同一にする
FreightImage[1][S]=image.1.0        # 反転時画像
FreightImage[1][E]=image.1.1
```

**重要な確認結果:**
- `FreightImage[0][方向]` は **EmptyImage[方向] と同一**にする必要がある
  （「積載画像と反転画像の両立は不可」のため、正方向の見た目＝空車の見た目）
- そのため `freightimagetype[0]/[1]` と `FreightImage[0]` は、ユーザに編集させず
  **保存時に EmptyImage から自動生成**するのが最も整合性が高い
- `FreightImage[1][方向]` の方向は「アドオン正方向（反転走行時と逆向き）」で指定する
- `good.Reverse.pak` を併用しないと画像指定が反映されない（ツール側の責務外だが注意書きを表示）
- 従来 pakファイルとの互換性あり（未記述なら通常動作）

### v52以降の拡張（非電化区間）

```
freightimagetype[2]=No_Electric
freightimagetype[3]=Reverse_No_Electric
FreightImage[2][s]=image.2.0
FreightImage[3][s]=image.3.0
```

---

## 現状コードの把握

| 箇所 | 現状 |
|---|---|
| `constants.js` | `FREIGHTIMAGE = "freightimage"` 定義済み。`FREIGHTIMAGE_DIRECTIONS` は `freightimage[s]` 形式で定義されているが未使用かつ形式も誤り |
| `main.js loadDatFile` | `freightimage` / `freightimagetype` 行は `continue` でスキップ（保存されない） |
| `main.js writeDat` | freightimage/freightimagetype は出力されない |
| `ui.js refresh()` | `emptyimage` はプロパティテーブルから除外済み。freightimage は現状スキップされているため問題ないが、今後は明示的に除外が必要 |
| `defineDialogs.js copyCarDialog` | `emptyimage` は "画像指定" コピーの対象。freightimage は未対応 |

---

## 実装範囲と方針

反転時画像 (`FreightImage[1]`) の読み書き・編集・プレビューに対応する。

**データモデルの基本方針（要）:**

- アドオンが保持する反転データは `freightimage[1][dir]` プロパティのみ（コアデータ）。
- 「反転画像あり」の判定 = `freightimage[1][dir]` プロパティが1つでも存在すること。
- `freightimagetype[0]/[1]` と `freightimage[0][dir]` は **保存時(writeDat)に自動生成**する
  （`freightimage[0][dir] = emptyimage[dir]`、`freightimagetype[1]=Reverse`）。
  → EmptyImage 編集後も常に整合し、編集時の同期処理が不要になる。
- 読み込み時、`freightimage[0]` / `freightimagetype[0]` / `freightimagetype[1]` は
  永続保存しない（保存時に再生成するため）。
- v52 以降の No_Electric 対応（`freightimagetype[n>=2]` / `freightimage[n>=2][dir]`）は
  **編集対象外だが、ラウンドトリップ保全のため raw プロパティとして保持・再出力**する
  （現状コードは freightimage を全て破棄しているため、これでも純粋な改善）。

---

## フェーズ別実装計画

---

### Phase 1: データ層

**対象ファイル:** `js/constants.js`, `js/main.js`

#### 1-1. constants.js

- `FREIGHTIMAGETYPE = "freightimagetype"` を追加
- `FREIGHTIMAGE_DIRECTIONS` を削除（誤形式・未使用）
- 反転時用のキー生成ヘルパーを追加:
  ```js
  // 例: getFreightImageKey(1, "s") → "freightimage[1][s]"
  function getFreightImageKey(typeIndex, direction) {
      return `${FREIGHTIMAGE}[${typeIndex}][${direction}]`;
  }
  ```
- `REVERSE_IMAGE_TYPE_INDEX = 1` 定数追加（freightimage[1] が反転時）
- `REVERSE_FREIGHTIMAGE_DIRECTIONS = DIRECTIONS.map(d => getFreightImageKey(1, d))`

#### 1-2. main.js — loadDatFile

現在は下記でスキップしている：

```js
if (propName.startsWith(FREIGHTIMAGE)) {
    continue;
}
```

これを以下のように変更:

- `freightimage[n][dir]=filename.y.x` の形式を正規表現でパース
- ファイル名を `imageFileNames` に追加
- index=1 のものだけ `addon["freightimage[1][dir]"]` として格納（編集対象のコアデータ）
- index=0 は **格納しない**（保存時に EmptyImage から再生成するため破棄）
- index>=2（No_Electric）は raw プロパティとして格納（保全のみ）
- `freightimagetype[0]/[1]` は **格納しない**（再生成）。`freightimagetype[n>=2]` は raw 保持

パースロジック:

```js
// freightimagetype[n] の判定（freightimage より先に判定する点に注意）
const freightImageTypeMatch = propName.match(/^freightimagetype\[(\d+)\]$/);
if (freightImageTypeMatch) {
    const typeIndex = Number(freightImageTypeMatch[1]);
    // 0,1 は再生成するため破棄。2以上(No_Electric)のみ保全
    if (typeIndex >= 2) { tmpAddons.at(-1)[propName] = val; }
    continue;
}
// freightimage[n][dir] の判定
const freightImageMatch = propName.match(/^freightimage\[(\d+)\]\[(\w+)\]$/);
if (freightImageMatch) {
    const typeIndex = Number(freightImageMatch[1]);
    if (typeIndex == 0) { continue; }            // 0は再生成するため破棄
    imageFileNames.add(val.split(".")[0]);        // 1,>=2 は画像名を登録
    tmpAddons.at(-1)[propName] = val;             // 1=反転コア / >=2=保全
    continue;
}
```

> 注: 現状の `if (propName.startsWith(FREIGHTIMAGE)) { continue; }` は
> `freightimagetype` にも前方一致でマッチしてしまうため、上記の正規表現判定に置き換える。

#### 1-3. main.js — writeDat（反転画像ブロックを自動生成）

汎用ループ（`for (let prop in addon)`）では `freightimage*` / `freightimagetype*` を
**スキップ**し、専用ブロックで生成・出力する。

```js
// 反転画像ブロックを生成（反転画像が1つでもあれば出力）
function generateReverseImageDat(addon) {
    const reverseDirs = DIRECTIONS.filter(d => addon[getFreightImageKey(1, d)]);
    if (reverseDirs.length == 0) {
        // 反転画像なし → No_Electric等のrawのみ保全出力
        return generateRawFreightDat(addon);
    }
    let s = "";
    s += `freightimagetype[0]=${addon.freight ?? "Passagiere"}\n`;
    s += `freightimagetype[1]=Reverse\n`;
    s += generateRawFreightImageTypes(addon);  // n>=2 の保全分
    // FreightImage[0] = EmptyImage（全8方向）
    DIRECTIONS.forEach((d, i) => {
        s += `FreightImage[0][${d}]=${addon[EMPTYIMAGE_DIRECTIONS[i]]}\n`;
    });
    // FreightImage[1] = 反転画像（設定済み方向のみ）
    reverseDirs.forEach(d => {
        s += `FreightImage[1][${d}]=${addon[getFreightImageKey(1, d)]}\n`;
    });
    s += generateRawFreightImages(addon);      // n>=2 の保全分
    return s;
}
```

各 addon の出力末尾（constraint の直前）にこのブロックを連結する。

#### 1-4. main.js — addImageFileNameToMasterFromDat

freightimage の内包表記形式は現状不要（通常は1方向ずつ指定）のため対応保留。

---

### Phase 2: UI層のフィルタリング

**対象ファイル:** `js/ui.js`, `js/defineDialogs.js`

#### 2-1. ui.js — refresh()

プロパティテーブルから freightimage / freightimagetype を除外:

```js
// 変更前
if (prop == "name" || prop == CONSTRAINT || prop.startsWith(EMPTYIMAGE)) { continue }

// 変更後
if (prop == "name" || prop == CONSTRAINT
    || prop.startsWith(EMPTYIMAGE)
    || prop.startsWith(FREIGHTIMAGE)
    || prop.startsWith(FREIGHTIMAGETYPE)) { continue }
```

#### 2-2. defineDialogs.js — copyCarDialog

車両コピー時、"画像指定" オプションで freightimage[1] もコピー対象にする:

```js
// 変更前
} else if (prop.startsWith(EMPTYIMAGE)) {
    if (copyProperties.includes("images")) {
        newAddon[prop] = addon[prop];
    }
}

// 変更後
} else if (prop.startsWith(EMPTYIMAGE) || prop.startsWith(FREIGHTIMAGE) || prop.startsWith(FREIGHTIMAGETYPE)) {
    if (copyProperties.includes("images")) {
        newAddon[prop] = addon[prop];
    }
}
```

同様に、copyCarDialog の `properties` 収集ループでも freightimage / freightimagetype を除外する:

```js
// 変更前
if (prop != CONSTRAINT && !prop.startsWith(EMPTYIMAGE)) {
    properties.add(prop);
}

// 変更後
if (prop != CONSTRAINT && !prop.startsWith(EMPTYIMAGE)
    && !prop.startsWith(FREIGHTIMAGE) && !prop.startsWith(FREIGHTIMAGETYPE)) {
    properties.add(prop);
}
```

---

### Phase 3: 画像編集UI（反転時画像の設定）

**対象ファイル:** `js/defineDialogs.js`（editImageDialog セクション）

#### 3-1. editImageDialog にモード切替を追加

画像指定ダイアログに「通常画像 / 反転時画像」を切り替えるラジオボタンまたはタブを追加。

HTML 追加イメージ:
```html
<div id="image-type-selector">
    <label>
        <input type="radio" name="image-type" value="empty" checked> 通常画像 (EmptyImage)
    </label>
    <label>
        <input type="radio" name="image-type" value="reverse"> 反転時画像 (FreightImage[1])
    </label>
</div>
<div id="reverse-image-note" style="display:none">
    ※ 反転時画像が未設定の場合は通常画像が使用されます
</div>
```

#### 3-2. 編集ロジックの切り替え

editImageDialog.functions に `editingImageType` プロパティを追加 (`"empty"` or `"reverse"`)。

現在の `EMPTYIMAGE[dir]` を直接書いている箇所をモードに応じて切り替え:

```js
// キー取得のヘルパー
getEditingImageKey: function(direction) {
    if (this.editingImageType === "reverse") {
        return getFreightImageKey(REVERSE_IMAGE_TYPE_INDEX, direction);
    }
    return `${EMPTYIMAGE}[${direction}]`;
}
```

変更が必要な箇所:
- `clickPositionPointerCursor` のクリック時書き込み先
- `refresh()` の画像データ読み取り元
- Shift+クリックの一括設定

#### 3-3. 反転時画像の初期値・表示

反転時画像モードに切り替えた際:
- 未設定（`undefined`）の方向は「noimage」を表示
- 全体プレビュー上のクリックで `freightimage[1][dir]` を直接設定
- shift+クリックで1列を全方向に一括設定（emptyimage と同じ操作感）

#### 3-4. freightimagetype / freightimage[0] の扱い

**編集時には設定しない。** Phase 1-3 の writeDat 自動生成に一任する。
- `freightimagetype[0]` = `addon.freight ?? "Passagiere"`（保存時生成）
- `freightimagetype[1]` = `"Reverse"`（保存時生成）
- `freightimage[0][dir]` = `emptyimage[dir]`（保存時生成）

→ 編集UIは `freightimage[1][dir]` の読み書きのみに専念すればよい。

#### 3-5. 反転画像の全消去

反転画像モードに「この車両の反転画像を全削除」ボタンを設け、
全 `freightimage[1][dir]` プロパティを delete できるようにする（反転無効化）。

---

### Phase 4: 連結プレビュー・撮影の反転表示

**対象ファイル:** `js/defineDialogs.js`（couplingPreviewDialog / formatedAddonsImageDialog セクション）

> **重要（実装後の修正）:** 反転画像 (`FreightImage[1]`) 自体が「反転後の見た目」を
> 表現しているため、**車両の順序は変更しない**。順序を逆にすると二重反転になり誤りとなる。
> 連結プレビュー・撮影とも「順序は維持したまま、各車両の画像のみ反転画像に切替」とする。

#### 4-1. couplingPreviewDialog に反転表示トグルを追加

「反転表示」チェックボックスを追加。ON にすると:
- **編成の順序は維持**（順序逆転は行わない）
- 各車両の画像を `freightimage[1][s]` から取得（未設定なら `emptyimage[s]` で代替）

#### 4-2. 表示用ヘルパー（main.js）

順序を変えず画像キーのみ切り替えるためのヘルパーを用意:

```js
// 反転画像があればそのキー、なければ通常画像キー(s方向)
function getReverseDisplayImageKey(addon) { ... }
// 編成表示用の画像データ[name,y,x]を取得
function getFormationImageData(addon, useReverse) { ... }
```

方向の反転マッピングは不要（プレビューは s 方向固定、反転画像が見た目を表現するため）。

#### 4-3. setAddonPreviewImageByDirection の拡張

第4引数 `imageKey` を追加し、未指定時は `emptyimage[dir]` を参照。
反転表示時は `getReverseDisplayImageKey(car)` を渡す。

#### 4-4. formatedAddonsImageDialog（編成撮影）の反転対応

撮影ダイアログに「反転して撮影」チェックボックスを追加（連結プレビューの状態を引き継ぐ）。ON にすると:
- **描画順序は通常時と同じ**（順序逆転は行わない）
- 各車両の画像を `getFormationImageData(car, true)` で取得（反転画像、未設定なら通常画像）

---

## 実装順序

1. Phase 1 (データ層): constants.js → main.js loadDatFile → writeDat 確認
2. Phase 2 (UIフィルタ): ui.js → copyCarDialog
3. Phase 3 (画像編集UI): editImageDialog のモード切替
4. Phase 4 (プレビュー反転): couplingPreviewDialog → formatedAddonsImageDialog

---

## 影響範囲チェックリスト

- [ ] `FREIGHTIMAGE_DIRECTIONS` を削除しても問題ないか（参照箇所なし → 削除可）
- [ ] 既存 dat を読み込んだ場合に freightimage が正しくパースされるか
- [ ] freightimage なし(旧 dat)でも正常動作するか
- [ ] writeDat で freightimage が正しい順序で出力されるか
- [ ] コピー時に freightimage もコピーされるか
- [ ] プレビューで freightimage 未設定の車両が正常表示されるか

---

## 保留事項

- `freightimage[0]`（積載時画像）対応: 今回スコープ外
- v52以降の No_Electric / Reverse_No_Electric: 今回スコープ外（Phase 1 のパース処理は対応可能にしておく）
- 新規車両追加ダイアログへの反転画像設定 UI: 今回スコープ外

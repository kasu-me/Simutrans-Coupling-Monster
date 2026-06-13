---
name: formation-template
description: 編成テンプレート機能の編集を行う際に使用する。
disable-model-invocation: false
---

# 編成テンプレート機能 スキルドキュメント

## 概要

編成テンプレート機能は、Simutrans (OTRP v55.3以降) の「車庫で複数車両をまとめて購入できる」機能向けのテンプレートファイルを生成するツールです。  
このアプリでは「連結プレビュー」ダイアログで組んだ編成をテンプレートとして登録し、`.tab` ファイル形式でクリップボードに出力します。

---

## Simutrans側の仕様

### テンプレートファイルの配置

| 場所 | パス |
|------|------|
| 標準 | `pak/convoy_template/` |
| addons分離時 | `addons/<pak名>/convoy_template/` |
| 翻訳ファイル | `text/` フォルダ内 |

### ファイルフォーマット

```
name=テンプレート名
vehicle[0]=車両内部名
vehicle[1]=車両内部名
vehicle[2]=車両内部名
-
name=別のテンプレート名
vehicle[0]=車両内部名
vehicle[1]=車両内部名
```

- `-` 一文字の行でテンプレートを区切る
- `name` はテンプレート名（翻訳対応。重複可）
- `vehicle[N]` は 0 始まりの連番で編成順序を指定
- 内部名はpak翻訳前の識別子（datファイルの `name=` の値）を使用
- 存在しない車両名は自動的に除外される

### Simutrans内での動作

- 車庫ウィンドウの「テンプレ」タブで選択・購入できる
- 「新しい編成」: テンプレート名が編成名になる
- 既存編成への追加: 「追加」または「先頭へ」を選択可能
- 「旧型を表示」: 引退車両を含むテンプレートを表示
- 「全てを表示」: 連結制限を無視したテンプレートを購入可能
- 検索・ソート機能あり（出力・重量等は非対応）
- ネットワークモード対応（サーバー・クライアント間の同期不要）
- テンプレートファイルに著作権は発生しない

### 制約

- 両端の車両が先頭車である必要はない（Simutrans側が制限を適用）
- pakファイル内の連結制限が適用される
- 複数の乗り物種別（道路＋線路など）が混在するテンプレートは読み込み不可
- `vehicle[N]` の番号が不連続・不適切な場合はテンプレート表示が異常になる可能性あり

### Ctrl+「編成をコピー」 機能（Simutrans側）

Simutrans内で編成を組んだ後、Ctrl+「編成をコピー」 を押すと `vehicle[0]=～` の部分がクリップボードに自動生成される。手作業なしにテンプレートの雛形を作れる。

---

## このアプリでの実装

### ダイアログ構造

```
メニュー「連結」
  └─ 連結プレビュー・撮影・コスト計算・編成テンプレート作成
       └─ couplingPreviewDialog（連結プレビュー）
            └─ ボタン「編成テンプレートに追加」
                 └─ formationTemplateDialog（編成テンプレート）
```

### couplingPreviewDialog との連携

`couplingPreviewDialog` は `isOverlay=false` のダイアログ。  
「編成テンプレートに追加」ボタン ([js/defineDialogs.js:997](js/defineDialogs.js#L997)) は以下の条件で無効化される：

```js
button.disabled = formation.length == 0;
```

編成が空のときはボタンが押せない。

### formationTemplateDialog の実装詳細

**ファイル:** [js/defineDialogs.js:1084–1143](js/defineDialogs.js#L1084-L1143)  
**CSS:** [css/dialogs/formationTemplateDialog.css](css/dialogs/formationTemplateDialog.css)  
**種別:** `isOverlay=true`（連結プレビューダイアログに重なって表示）

#### 状態

```js
Dialog.list.formationTemplateDialog.functions.templates
// 型: Array<{ name: string|null, formation: addon[] }>
// ダイアログを閉じても保持される（セッション中は永続）
```

#### 主要メソッド

| メソッド | 処理 |
|----------|------|
| `display()` | `couplingPreviewDialog.functions.currentFormation` のコピーを `templates` に追加し、ダイアログを開く |
| `refresh()` | `templates` を再描画。各テンプレートに名前入力・削除ボタン・車両プレビューを生成 |
| `generateFormationTemplate()` | `templates` を Simutrans の `.tab` フォーマットに変換して返す |

#### generateFormationTemplate の出力フォーマット

```js
strs.push(`name=${template.name}\n${template.formation.map((car, i) => `vehicle[${i}]=${car.name}`).join("\n")}`);
return strs.join("\n-\n");
```

→ テンプレート間の区切りは `\n-\n`（Simutrans仕様に準拠）

#### ボタン

| ボタン | 処理 |
|--------|------|
| クリップボードにコピー | `generateFormationTemplate()` の結果を `navigator.clipboard.writeText()` でコピーし、Messageトーストを表示 |
| クリア | `templates = []` にして `refresh()` |
| 閉じる | `off()` でダイアログを閉じる（templatesは保持される） |

#### 車両プレビューの末尾クリック

各テンプレートの末尾の車両をクリックすると、その車両が編成から削除される（`formation.pop()`）。削除後は `couplingPreviewDialog.functions.refresh(true)` も呼ばれる。

### UIフロー（操作手順）

1. メニューの「連結」→「連結プレビュー・撮影・コスト計算・編成テンプレート作成」を開く
2. 連結プレビューで編成を組む（連結候補から車両をクリックして追加）
3. 「編成テンプレートに追加」ボタンを押す
4. formationTemplateDialogが開き、現在の編成が新規テンプレートとして追加される
5. テンプレート名を入力する
6. 必要に応じて手順1〜5を繰り返して複数テンプレートを蓄積
7. 「クリップボードにコピー」でSimutransのconvoy_template形式のテキストをコピー
8. コピーしたテキストを `pak/convoy_template/*.tab` に貼り付けて保存

### 注意点・既知の挙動

- テンプレート名が未入力の場合でも `name=null` として出力される（Simutrans側で問題が生じる可能性がある）
- `templates` 配列はセッション中永続だが、ページリロードで消える
- テンプレートの車両順序はcouplingPreviewDialog上で組んだ順序そのまま（`vehicle[0]`から連番で出力）
- 末尾の車両クリックで削除できるが、途中の車両は削除できない（連結プレビュー側での再構成が必要）

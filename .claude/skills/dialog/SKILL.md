---
name: dialog
description: Dialogクラスを使用してダイアログを作成・操作する際に使用する。
disable-model-invocation: false
---

# Dialogクラス利用ガイドライン

このスキルは `Dialog` クラス（`js/dialog.js`）を使ってダイアログを実装・修正するときに読む。

## コンストラクタのシグネチャ

```js
new Dialog(id, title, htmlContent, buttons, functions, isOverlay)
```

| 引数 | 型 | 説明 |
|------|----|------|
| `id` | string | `Dialog.list[id]` で参照するキー。HTML の id にもなる |
| `title` | string | タイトルバーの文字列。`""` を渡すとタイトルバー非表示 |
| `htmlContent` | string | `.dialog-main-message` の innerHTML |
| `buttons` | array | ボタン定義オブジェクトの配列（後述） |
| `functions` | object | カスタム関数群。`display` を定義しない場合は自動で `this.on()` が設定される |
| `isOverlay` | boolean | `true` = 重ねがけ表示、`false` = 他ダイアログを全て閉じて表示 |

## ボタン定義オブジェクト

```js
{ content: "ラベル", event: () => { /* 処理 */ }, icon: "アイコン名", class: "追加クラス" }
```

- `content` — ボタンのラベル（innerHTML）
- `event` — 文字列なら `onclick` 属性に、関数なら `addEventListener` で登録
- `icon` — `icon=""` 属性と `.lsf-icon` クラスが付く（ligatureSymbols フォント）
- `class` — `classList.add()` で追加するクラス

## `isOverlay` の使い分け

| `isOverlay` | 動作 | 用途 |
|-------------|------|------|
| `false` | `Dialog.offAll()` で他を全て閉じてから表示 | メイン操作ダイアログ（addCar、calcCost など） |
| `true` | 現在のダイアログの上に重ねて表示 | alert、confirm、info、hello（起動時） |

## 定義場所のルール

- **汎用ダイアログ**（alertDialog、confirmDialog、infoDialog）→ `js/defineGeneralDialogs.js`
- **機能固有ダイアログ**（addCar、couplingPreview、formationTemplate など）→ `js/defineDialogs.js`
- 全ダイアログは `window.addEventListener("load", ...)` の中でインスタンス化する

## `functions` の設計パターン

### 基本パターン（display をカスタムする）

```js
new Dialog("myDialog", "タイトル", htmlContent, buttons, {
    display: function (arg) {
        // DOM の初期化・値のセット
        gebi("my-input").value = "";
        Dialog.list.myDialog.on();  // 最後に on() を呼ぶ
    }
}, false);
```

### display を省略する場合

`functions` に `display` がなければ自動で `() => this.on()` が設定される。
引数なしで開くだけのシンプルなダイアログに使う。

### コールバックを持つパターン（confirm 型）

```js
new Dialog("confirmDialog", ..., {
    display: function (message, callback, interruption) {
        Dialog.list.confirmDialog.functions.callback = callback || function () {};
        Dialog.list.confirmDialog.functions.interruption = interruption || function () {};
        Dialog.list.confirmDialog.on();
    },
    callback: function () {},
    interruption: function () {}
}, true);
```

## 開閉の操作

```js
// 開く（display 経由が推奨。初回は位置をリセットしてくれる）
Dialog.list.myDialog.functions.display();

// 閉じる
Dialog.list.myDialog.off();

// 全ダイアログを閉じる
Dialog.offAll();

// 状態確認
Dialog.list.myDialog.isActive  // boolean
```

## よくある実装ミス

1. **`on()` を呼ばずに終わる** — `display` のカスタム実装では必ず末尾に `Dialog.list.myDialog.on()` を呼ぶ。
2. **`window load` の外で `new Dialog()`** — DOMが未完成のためエラーになる。必ず `window load` 内に置く。
3. **overlay ダイアログを `offAll()` で閉じようとする** — `offAll()` は非 overlay のみ対象。overlay は個別に `.off()` する。
4. **ボタンの `event` に文字列で複雑な処理を書く** — 文字列は `onclick` 属性になり XSS リスクがある。関数を渡す。
5. **`isOverlay: false` のダイアログを重ねる** — 他ダイアログが全て閉じられる。重ねたいなら `isOverlay: true` にする。

## CSS のファイル配置

- ダイアログ共通スタイル → `css/dialog.css`
- ダイアログ個別スタイル → `css/dialogs/<dialog-id>.css`（ファイルを追加したら `index.html` に `<link>` タグを追加する）

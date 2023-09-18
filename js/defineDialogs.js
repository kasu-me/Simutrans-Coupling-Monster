window.addEventListener("load", function () {

	new Dialog("openDatFileDialog", "DATファイルを開く", `
		<div id="dropArea" class="filefield">
			<p>ここにdatファイルをドラッグ＆ドロップ (複数ファイル可)</p>
			<p>pngファイルとdatファイルをまとめてドラッグ＆ドロップすると画像の読み込みまで行います</p>
		</div>
		`, [{ "content": "キャンセル", "event": `refresh();Dialog.list.openDatFileDialog.off();`, "icon": "close" }], {
		display: function () {
			Dialog.list.openDatFileDialog.on();
		}
	}, true);

	new Dialog("selectImageDialog", "画像指定", `
		<p>
		<span class="selectbox-fluctuation-button" style="margin-right:1.5em;">
		<select id="imageSelectBox">
		</select>
		</span>
		<button class="lsf-icon" icon="image" onclick="gebi('image-file-input').click()">画像を指定する</button>
		</p>
		<p>以下に複数ファイルをドラッグ＆ドロップで一括投入(datファイルに記述されている画像ファイル名と同じ名前のファイルである必要があります)</p>
		<div id="selected-image-preview">
		</div>
		<input type="file" id="image-file-input" accept="image/*">
		`, [{ "content": "完了", "event": `Dialog.list.selectImageDialog.off();`, "icon": "check" }], {
		display: function (x) {
			if (masterAddons.length == 0) {
				Dialog.list.alertDialog.functions.display("先にdatファイルを読み込んでください。");
			} else {
				Dialog.list.selectImageDialog.on();
				updateViewSelectImageDialogPreviewingImage();
				if (x != undefined) {
					let selectBox = document.getElementById("imageSelectBox");
					selectBox.value = x;
					selectBox.dispatchEvent(new Event("change"));
				}
			}
		}
	}, true);

	new Dialog("previewDatDialog", "datプレビュー", `
		<div id="dat-preview" class="dialog-preview"></div>
		`, [{ "content": "保存", "event": `saveDat();`, "icon": "download" }, { "content": "閉じる", "event": `Dialog.list.previewDatDialog.off();`, "icon": "close" }], {
		display: function (datText) {
			document.getElementById("dat-preview").innerHTML = datText.replace(/\n/g, "<br>");
			Dialog.list.previewDatDialog.on();
		}
	});

	new Dialog("helpDialog", "Coupling Monsterについて", `
		<div class="dialog-preview">
			<h2>このアプリは何？</h2>
			<p>フリー輸送シミュレーションゲーム「Simutrans」のアドオン製作を支援するWebアプリケーションです。</p>
			<p>本アプリでは、Simutransの鉄道車両アドオン製作において最も面倒なことの一つ、<strong>連結設定</strong>を支援します。本アプリで設定した内容をdatとして出力することはもちろんのこと、既存のdatファイルを読み込んで編集することも可能です。</p>
			<p>また、メインの機能は連結に関する設定を行うことですが、簡易的ながらそれ以外のプロパティについて編集することが可能です。</p>
			<p>本アプリはサーバとの通信は一切行っておらず、本アプリで製作したデータは皆さんのPC内で完結しています。バックアップ等はご自身の責任において行っていただくようお願いいたします。</p>
			<h2>推奨環境</h2>
			<p>PCの最新版GoogleChromeでのご利用を推奨します。スマートフォン等のタッチデバイスでの動作の保証はいたしかねます。</p>
			<h2>謝辞</h2>
			<ul>
			<li>ボタン等の各種アイコンに「<a href="https://kudakurage.com/ligature_symbols/" target="_blank">Ligature Symbols</a>」を利用させていただきました。</li>
			</ul>
			<p>御礼申し上げます。</p>
			<h2>お問い合わせ</h2>
			<p>バグ報告･ご意見･ご要望･ご質問は<a href="https://twitter.com/KasumiTrans" target="_blank">Twitter</a>または<a href="mailto:morooka@kasu.me" target="_blank">メール</a>までお願いいたします。</p>
			<!--<p>変更履歴は<a href="https://github.com/kasu-me/formation-manager" target="_blank">GitHub</a>をご覧ください。</p>-->
			<p>© 2023 M_Kasumi</p>
		</div>
		`, [{ "content": "閉じる", "event": `Dialog.list.helpDialog.off(); `, "icon": "close" }], {});



	//アラート:alrt
	new Dialog("alertDialog", "警告", `< img src = "./js/img/alert.svg" class="dialog-icon" > <div id="alrt-main"></div>`, [{ "content": "OK", "event": `Dialog.list.alertDialog.off()`, "icon": "check" }], {
		display: function (message) {
			document.getElementById("alrt-main").innerHTML = message;
			Dialog.list.alertDialog.on();
			Dialog.list.alertDialog.buttons.querySelector("button[icon='check']").focus();
		}
	}, true);

	//確認:cnfm
	new Dialog("confirmDialog", "確認", `< img src = "./js/img/confirm.svg" class="dialog-icon" > <div id="cnfm-main"></div>`, [{ "content": "OK", "event": `Dialog.list.confirmDialog.functions.callback(); Dialog.list.confirmDialog.off()`, "icon": "check" }, { "content": "NO", "event": `Dialog.list.confirmDialog.off(); Dialog.list.confirmDialog.functions.interruption(); `, "icon": "close" }], {
		display: function (message, callback, interruption) {
			document.getElementById("cnfm-main").innerHTML = message;
			Dialog.list.confirmDialog.functions.callback = callback || function () { };
			Dialog.list.confirmDialog.functions.interruption = interruption || function () { };
			Dialog.list.confirmDialog.on();
			Dialog.list.confirmDialog.buttons.querySelector("button[icon='check']").focus();
		},
		callback: function () { },
		interruption: function () { }
	}, true);

	//情報:info
	new Dialog("infoDialog", "情報", `< img src = "./js/img/info.svg" class="dialog-icon" > <div id="info-main"></div>`, [{ "content": "OK", "event": `Dialog.list.infoDialog.off()`, "icon": "close" }], {
		display: function (message) {
			document.getElementById("info-main").innerHTML = message;
			Dialog.list.infoDialog.on();
			Dialog.list.infoDialog.buttons.querySelector("button[icon='check']").focus();
		}
	}, true);



});
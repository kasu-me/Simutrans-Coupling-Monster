window.addEventListener("load", function () {

	new Dialog("openDatFileDialog", "DATファイルを開く", `
		<div id="dat-file-drop-area" class="filefield">
			<p>ここにdatファイルをドラッグ＆ドロップ (複数ファイル可)</p>
			<p>dat,png,tabファイルをまとめてドラッグ＆ドロップすると全ての読み込みを行います</p>
		</div>
		`, [{ "content": "キャンセル", "event": `refresh();Dialog.list.openDatFileDialog.off();`, "icon": "close" }], {
		display: function () {
			Dialog.list.openDatFileDialog.on();
		}
	}, true);

	new Dialog("selectImageDialog", "画像ファイル指定", `
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
					let selectBox = gebi("imageSelectBox");
					selectBox.value = x;
					selectBox.dispatchEvent(new Event("change"));
				}
			}
		}
	}, true);

	new Dialog("openJaTabFileDialog", "日本語化ファイル指定", `
		<div id="jatab-file-drop-area" class="filefield">
			<p>ここにja.tabファイルをドラッグ＆ドロップ (複数ファイル可)</p>
		</div>
		`, [{ "content": "完了", "event": `Dialog.list.openJaTabFileDialog.off();`, "icon": "check" }], {
		display: function (x) {
			if (masterAddons.length == 0) {
				Dialog.list.alertDialog.functions.display("先にdatファイルを読み込んでください。");
			} else {
				Dialog.list.openJaTabFileDialog.on();
			}
		}
	}, true);


	new Dialog("previewDialog", "プレビュー", `
		<div id="dat-preview" class="dialog-preview"></div>
		`, [{ "content": "保存", "event": `saveFile(Dialog.list.previewDialog.functions.type);`, "icon": "download" }, { "content": "閉じる", "event": `Dialog.list.previewDialog.off();`, "icon": "close" }], {
		type: "",
		display: function (datText, type) {
			Dialog.list.previewDialog.functions.type = type;
			gebi("dat-preview").innerHTML = datText.replace(/\n/g, "<br>");
			Dialog.list.previewDialog.dialogTitle.innerHTML = `${type}プレビュー`;
			Dialog.list.previewDialog.on();
		}
	}, true);

	let directionSelectBox = "";
	DIRECTIONS.forEach((dir) => {
		directionSelectBox += `<option value="${dir}">${dir}</option>`;
	})

	new Dialog("editImageDialog", "車両と画像の対応", `
		<table class="input-area">
			<tr>
				<td>車両名</td>
				<td>
					<span class="selectbox-fluctuation-button">
						<select id="preview-addon-name"></select>
					</span>
				</td>
			</tr>
			<tr>
				<td>日本語名</td>
				<td id="display-japanese-name">
				</td>
			</tr>
			<tr>
				<td>方角</td>
				<td>
					<span class="selectbox-fluctuation-button">
						<select id="direction-selectbox">${directionSelectBox}</select>
					</span>
				</td>
			</tr>
			<tr>
				<td>画像名</td>
				<td>
				<span class="selectbox-fluctuation-button">
					<select id="addon-image-file-name" disabled></select>
				</span>
			</tr>
		</table>
		<div id="addon-image-preview"></div>
		<div id="addon-image-whole-preview">
			<div class="addon-image-whole-preview-position-pointer" id="position-pointer"></div>
			<div class="addon-image-whole-preview-position-pointer cursor" id="position-pointer-cursor"></div>
		</div>
		<button id="open-select-image-dialog-button" class="lsf-icon" icon="image">画像ファイルを指定</button>
		<div id="addon-image-positions"></div>
		`, [{ "content": "閉じる", "event": `Dialog.list.editImageDialog.off();`, "icon": "close" }], {
		editingAddon: null,
		imageDisplaySizeRatio: 1,
		editingAddonMainImageData: null,
		selectedDirection: -1,
		display: function () {
			//編集中アドオンセット
			Dialog.list.editImageDialog.functions.editingAddon = getEditingAddon();

			//アドオン名セレクトボックスセット
			let previewAddonNameSelectBox = gebi("preview-addon-name");
			setAddonNamesToSelectBox(previewAddonNameSelectBox);
			previewAddonNameSelectBox.value = Dialog.list.editImageDialog.functions.editingAddon.name;

			gebi("direction-selectbox").selectedIndex = 0;

			//画像ファイル名セレクトボックスセット
			setImageNamesToSelectBox(gebi("addon-image-file-name"));

			Dialog.list.editImageDialog.functions.refresh();

			Dialog.list.editImageDialog.on();
		},
		showPositionPointerCursor: function (e) {
			let addonWholeImageArea = gebi("addon-image-whole-preview");
			let positionPointerCursor = gebi("position-pointer-cursor");
			let addonImagePositionsArea = gebi("addon-image-positions");
			positionPointerCursor.classList.add("on");
			addonWholeImageArea.addEventListener("mouseleave", (e) => {
				positionPointerCursor.classList.remove("on");
				addonImagePositionsArea.innerHTML = `x:${Dialog.list.editImageDialog.functions.editingAddonMainImageData[2]}, y:${Dialog.list.editImageDialog.functions.editingAddonMainImageData[1]}`;
			}, { once: true });
		},
		movePositionPointerCursor: function (e) {
			let addonWholeImageArea = gebi("addon-image-whole-preview");
			let positionPointerCursor = gebi("position-pointer-cursor");
			let addonImagePositionsArea = gebi("addon-image-positions");
			let x = Math.floor((e.clientX - addonWholeImageArea.getBoundingClientRect().left) / PAK_TYPE / Dialog.list.editImageDialog.functions.imageDisplaySizeRatio);
			let y = Math.floor((e.clientY - addonWholeImageArea.getBoundingClientRect().top) / PAK_TYPE / Dialog.list.editImageDialog.functions.imageDisplaySizeRatio);
			if (x >= 0 && y >= 0) {
				positionPointerCursor.classList.add("on");
				positionPointerCursor.style.left = `${x * PAK_TYPE * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				positionPointerCursor.style.top = `${y * PAK_TYPE * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				addonImagePositionsArea.innerHTML = `x:${Dialog.list.editImageDialog.functions.editingAddonMainImageData[2]}, y:${Dialog.list.editImageDialog.functions.editingAddonMainImageData[1]} => x:${x}, y:${y}`;
			} else {
				positionPointerCursor.classList.remove("on");
			}
		},
		clickPositionPointerCursor: function (e) {
			let addonWholeImageArea = gebi("addon-image-whole-preview");
			let x = Math.floor((e.clientX - addonWholeImageArea.getBoundingClientRect().left) / PAK_TYPE / Dialog.list.editImageDialog.functions.imageDisplaySizeRatio);
			let y = Math.floor((e.clientY - addonWholeImageArea.getBoundingClientRect().top) / PAK_TYPE / Dialog.list.editImageDialog.functions.imageDisplaySizeRatio);
			Dialog.list.editImageDialog.functions.editingAddon[`${EMPTYIMAGE}[${Dialog.list.editImageDialog.functions.selectedDirection}]`] = `${Dialog.list.editImageDialog.functions.editingAddonMainImageData[0]}.${y}.${x}`;
			Dialog.list.editImageDialog.functions.refresh();
		},
		refresh: function () {
			refresh();

			//イベントリセット
			let addonWholeImageArea = gebi("addon-image-whole-preview");
			addonWholeImageArea.removeEventListener("mouseenter", Dialog.list.editImageDialog.functions.showPositionPointerCursor);
			addonWholeImageArea.removeEventListener("mousemove", Dialog.list.editImageDialog.functions.movePositionPointerCursor);
			addonWholeImageArea.removeEventListener("click", Dialog.list.editImageDialog.functions.clickPositionPointerCursor);

			//日本語名をセット
			let japaneseName = gebi("display-japanese-name");
			japaneseName.innerHTML = getJapaneseNameFromAddon(Dialog.list.editImageDialog.functions.editingAddon, "(未設定)")

			//セレクトボックスに方向をセット
			let selectBox = gebi("direction-selectbox");
			Dialog.list.editImageDialog.functions.selectedDirection = selectBox.value;

			//その方角に指定されている画像ファイル名をセット
			Dialog.list.editImageDialog.functions.editingAddonMainImageData = getImageNameAndPositionsFromAddonByDirection(Dialog.list.editImageDialog.functions.editingAddon, Dialog.list.editImageDialog.functions.selectedDirection);
			let addonImageFileNameArea = gebi("addon-image-file-name");
			addonImageFileNameArea.value = Dialog.list.editImageDialog.functions.editingAddonMainImageData[0];

			//その方角に指定されている画像プレビューをセット
			let addonImageArea = gebi("addon-image-preview");
			addonImageArea.innerHTML = "";
			setAddonPreviewImageByDirection(addonImageArea, Dialog.list.editImageDialog.functions.editingAddon, Dialog.list.editImageDialog.functions.selectedDirection);

			//全体内での位置表示用の全体画像
			gebi("open-select-image-dialog-button").onclick = () => {
				Dialog.list.selectImageDialog.functions.display(Dialog.list.editImageDialog.functions.editingAddonMainImageData[0]);
			}
			let image = imageFiles.get(Dialog.list.editImageDialog.functions.editingAddonMainImageData[0]);
			let positionPointerCursor = gebi("position-pointer-cursor");
			let positionPointer = gebi("position-pointer");
			if (image != undefined) {
				addonWholeImageArea.classList.add("on");

				addonWholeImageArea.style.backgroundImage = `url(${image.src})`;
				Dialog.list.editImageDialog.functions.imageDisplaySizeRatio = 600 / image.width;
				addonWholeImageArea.style.height = `${image.height * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;

				//全体内での位置選択
				positionPointerCursor.style.width = `${PAK_TYPE * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				positionPointerCursor.style.height = `${PAK_TYPE * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				addonWholeImageArea.appendChild(positionPointerCursor);
				addonWholeImageArea.addEventListener("mouseenter", Dialog.list.editImageDialog.functions.showPositionPointerCursor);
				addonWholeImageArea.addEventListener("mousemove", Dialog.list.editImageDialog.functions.movePositionPointerCursor);
				addonWholeImageArea.addEventListener("click", Dialog.list.editImageDialog.functions.clickPositionPointerCursor);

				//全体内での現在位置表示
				positionPointer.classList.add("on");
				positionPointer.style.width = `${PAK_TYPE * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				positionPointer.style.height = `${PAK_TYPE * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				positionPointer.style.top = `${PAK_TYPE * Dialog.list.editImageDialog.functions.editingAddonMainImageData[1] * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				positionPointer.style.left = `${PAK_TYPE * Dialog.list.editImageDialog.functions.editingAddonMainImageData[2] * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				addonWholeImageArea.appendChild(positionPointer);
			} else {
				//画像が存在しない場合
				addonWholeImageArea.classList.remove("on");
				positionPointerCursor.classList.remove("on");
			}

			//その方角に指定されているdatファイルの記述
			let addonImagePositionsArea = gebi("addon-image-positions");
			addonImagePositionsArea.innerHTML = `x:${Dialog.list.editImageDialog.functions.editingAddonMainImageData[2]}, y:${Dialog.list.editImageDialog.functions.editingAddonMainImageData[1]}`;
		}
	}, true);
	gebi("direction-selectbox").addEventListener("change", () => {
		Dialog.list.editImageDialog.functions.refresh();
	});
	gebi("preview-addon-name").addEventListener("change", () => {
		gebi("carsSelectBox").value = gebi("preview-addon-name").value;
		gebi("carsSelectBox").dispatchEvent(new Event("change"));
		Dialog.list.editImageDialog.functions.editingAddon = getEditingAddon();
		Dialog.list.editImageDialog.functions.refresh();
	});

	new Dialog("couplingPreviewDialog", "連結プレビュー", `
		<div>
			<p>編成(<span id="preview-current-formation-count"></span>両)</p>
			<div id="preview-current-formation" class="cars-container"></div>
		</div>
		<div>
			<p>連結候補</p>
			<div id="preview-current-candidate" class="cars-container"></div>
		</div>
		`, [{ "content": "撮影", "event": `Dialog.list.formatedAddonsImageDialog.functions.display();`, "icon": "image" }, { "content": "完了", "event": `Dialog.list.couplingPreviewDialog.off();`, "icon": "check" }], {
		currentFormation: [],
		display: function (x) {
			if (masterAddons.length == 0) {
				Dialog.list.alertDialog.functions.display("先にdatファイルを読み込んでください。");
			} else {
				Dialog.list.couplingPreviewDialog.functions.currentFormation = [];
				Dialog.list.couplingPreviewDialog.functions.refresh();
				Dialog.list.couplingPreviewDialog.on();
			}
		},
		refresh: function () {
			let currentArea = gebi("preview-current-formation");
			currentArea.innerHTML = "";
			let candidateArea = gebi("preview-current-candidate");
			candidateArea.innerHTML = "";

			let formation = Dialog.list.couplingPreviewDialog.functions.currentFormation;
			gebi("preview-current-formation-count").innerHTML = formation.length;

			formation.forEach((car, i) => {
				let outer = createOuter(false);
				outer.dataset.addonName = car.name;
				setAddonPreviewImage(outer, car);
				setAddonBalloon(outer, car);
				if (i == formation.length - 1) {
					outer.addEventListener("click", () => {
						gebi("mku-balloon").classList.remove("on");
						formation.pop();
						Dialog.list.couplingPreviewDialog.functions.refresh();
					});
				}
				currentArea.appendChild(outer);
			});
			if (formation.length == 0) {
				//編成エリアのレイアウト崩れ防止用の空車両
				let dummyOuter = createOuter(true);
				currentArea.appendChild(dummyOuter);

				masterAddons.forEach((addon) => {
					if (addon[CONSTRAINT]["prev"].size == 0 || addon[CONSTRAINT]["prev"].size == 1 && [...addon[CONSTRAINT]["prev"].keys()][0] == "none") {
						addImagePreview(candidateArea, formation, addon);
					}
				});
			} else {
				masterAddons.forEach((addon) => {
					if (addon[CONSTRAINT]["prev"].has(formation.at(-1).name)) {
						addImagePreview(candidateArea, formation, addon);
					}
				});
			}
		}
	}, true);
	function createOuter(isDummy) {
		let outer = document.createElement("div");
		outer.classList.add("outer");
		if (isDummy) {
			outer.classList.add("dummy");
		}
		return outer;
	}
	function addImagePreview(area, formation, addon) {
		let outer = createOuter(false);
		outer.dataset.addonName = addon.name;
		setAddonPreviewImage(outer, addon);
		outer.addEventListener("click", () => {
			gebi("mku-balloon").classList.remove("on");
			formation.push(addon);
			Dialog.list.couplingPreviewDialog.functions.refresh();
		});
		setAddonBalloon(outer, addon);
		area.appendChild(outer);
	}

	new Dialog("formatedAddonsImageDialog", "編成画像撮影", `<p><input type="range" min="0" max="${PAK_TYPE}" value="48" id="formated-addons-space-range" oninput="gebi('formated-addons-space').value=this.value;Dialog.list.formatedAddonsImageDialog.functions.refresh();"><input type="number" min="0" max="${PAK_TYPE}" value="48" id="formated-addons-space" oninput="gebi('formated-addons-space-range').value=this.value;Dialog.list.formatedAddonsImageDialog.functions.refresh();"></p><canvas id="formated-addons-image"></canvas>`, [{ "content": "クリップボードにコピー", "event": `Dialog.list.formatedAddonsImageDialog.functions.copyToClipboard();`, "icon": "copy" }, { "content": "保存", "event": `Dialog.list.formatedAddonsImageDialog.functions.saveAsFile();`, "icon": "download" }, { "content": "閉じる", "event": `Dialog.list.formatedAddonsImageDialog.off();`, "icon": "close" }], {
		display: function () {
			let length = Number(Dialog.list.couplingPreviewDialog.functions.currentFormation[0].length);
			let space = 4 * length;
			gebi("formated-addons-space").value = space;
			gebi("formated-addons-space-range").value = space;

			Dialog.list.formatedAddonsImageDialog.functions.refresh();
			Dialog.list.formatedAddonsImageDialog.on();
		},
		refresh: function () {
			let formation = Dialog.list.couplingPreviewDialog.functions.currentFormation;
			let canvas = document.createElement("canvas");
			canvas.width = PAK_TYPE * 10;
			canvas.height = PAK_TYPE * 10;
			let ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			//車両画像を背景透過して読み込み
			let imgWidth = gebi("formated-addons-space").value;
			let formationCount = formation.length;
			[...formation].reverse().forEach((car, i) => {
				let [imgName, imgPositionY, imgPositionX] = getImageNameAndPositionsFromAddon(car);
				let img = getTransparentImage(imgName, imgPositionY, imgPositionX);
				ctx.drawImage(img, (formationCount - 1 - i) * imgWidth, (i) * Math.floor(imgWidth / 2));
			});
			trimCanvas(canvas, gebi("formated-addons-image"));
		},
		copyToClipboard: function () {
			let canvas = gebi("formated-addons-image");
			canvas.toBlob(async (blob) => {
				const clipBoardItem = new ClipboardItem({
					'image/png': blob
				});
				await navigator.clipboard.write([clipBoardItem]);
				new Message("クリップボードにコピーしました。", ["file-saved"], 3000, true, true);
			});
		},
		saveAsFile: function () {
			let canvas = gebi("formated-addons-image");
			let link = document.createElement("a");
			link.href = canvas.toDataURL();
			link.download = `formated.png`;
			link.click();
		}
	}, true);
	function getTransparentImage(imgName, imgPositionY, imgPositionX) {
		let canvas = document.createElement("canvas");
		canvas.width = PAK_TYPE;
		canvas.height = PAK_TYPE;
		let ctx = canvas.getContext("2d");
		ctx.drawImage(imageFiles.get(imgName), PAK_TYPE * imgPositionX, PAK_TYPE * imgPositionY, PAK_TYPE, PAK_TYPE, 0, 0, PAK_TYPE, PAK_TYPE);
		let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let [r, g, b] = [231, 255, 255];
		for (var i = 0; i < (imageData.width * imageData.height); i++) {
			if ((imageData.data[i * 4] == r) &&
				(imageData.data[i * 4 + 1] == g) &&
				(imageData.data[i * 4 + 2] == b)) {
				imageData.data[i * 4 + 3] = 0;
			}
		}
		ctx.putImageData(imageData, 0, 0);
		return canvas;
	}
	function trimCanvas(sourceCanvas, targetCanvas) {
		let sourceCtx = sourceCanvas.getContext("2d");
		let imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
		let top = sourceCanvas.height;
		let left = sourceCanvas.width;
		let bottom = 0;
		let right = 0;
		let isFirstTimeInRow = true;
		let row = -1;
		for (var i = 0; i < (imageData.width * imageData.height); i++) {
			//新しい行の場合
			if (i % imageData.width == 0) {
				isFirstTimeInRow = true;
				row++;
			}
			let isTransparent = imageData.data[i * 4 + 3] == 0;
			//最初の不透明ピクセルの場合
			if (isFirstTimeInRow && !isTransparent) {
				isFirstTimeInRow = false;
			}
			//不透明ピクセルの場合
			if (!isTransparent) {
				top = Math.min(top, row);
				left = Math.min(left, i % imageData.width);
				bottom = Math.max(bottom, row + 1);
				right = Math.max(right, i % imageData.width + 1);
			}
		}
		let height = bottom - top;
		let width = right - left;
		targetCanvas.height = height;
		targetCanvas.width = width;
		let targetCtx = targetCanvas.getContext("2d");
		targetCtx.clearRect(0, 0, width, height);
		targetCtx.drawImage(sourceCanvas, left, top, width, height, 0, 0, width, height);
	}

	new Dialog("helpDialog", "Coupling Monster について", `<div class="dialog-preview">
			<h2>このアプリは何？</h2>
			<p>フリー輸送シミュレーションゲーム「Simutrans」のアドオン製作を支援するWebアプリケーションです。</p>
			<p>本アプリでは、Simutransの鉄道車両アドオン製作において最も面倒なことの一つ、<strong>連結設定</strong>を支援します。本アプリで設定した内容をdatとして出力することはもちろんのこと、既存のdatファイルを読み込んで編集することも可能です。</p>
			<p>また、メインの機能は連結に関する設定を行うことですが、それ以外のプロパティについても簡易的ながら編集することが可能です。</p>
			<p>このほか、ja.tabを読み込むことで、日本語化後の車両名を確認しながら作業をしたり、日本語名を編集したりすることも可能です。</p>
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
			<p>変更履歴は<a href="https://github.com/kasu-me/Simutrans-Coupling-Monster" target="_blank">GitHub</a>をご覧ください。</p>
			<p style="margin-bottom:2em;">© 2023 M_Kasumi</p>
		</div >
	`, [{ "content": "閉じる", "event": `Dialog.list.helpDialog.off(); `, "icon": "close" }], {}, true);
});
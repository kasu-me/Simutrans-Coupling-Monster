window.addEventListener("load", function () {

	new Dialog("helloDialog", "おはよう", `
		<div id="hello-menu">
			<div class="hello-menu-container" onclick="Dialog.list.openDatFileDialog.functions.display()">
				<div><img src="img/button_open.png"></div>
				<p class="title">既存のファイルを開く</p>
				<p>PC上のdat･png･ja.tabを読み込んで編集します</p>
			</div>
			<div class="hello-menu-container" onclick="Dialog.list.helloDialog.off();Dialog.list.addCarDialog.functions.display()">
				<div><img src="img/button_new.png"></div>
				<p class="title">新規アドオン作成</p>
				<p>ブラウザ上でアドオンを製作します</p>
			</div>
		</div>
	`, [], {}, true);


	new Dialog("addCarDialog", "車両を作成：基本情報の入力", `
		<table class="input-area">
			<tr>
				<td>
					名前
				</td>
				<td>
					<input id="new-car-name">
				</td>
			</tr>
			<tr>
				<td>
					画像
				</td>
				<td>
					<select id="how-to-load-image">
						<option value="0">新規ファイルを読み込み</option>
						<option value="1">読込済みのファイルから指定</option>
					<select>
				</td>
			</tr>
			<tr>
				<td>
					画像ファイル
				</td>
				<td id="add-car-dialog-image-file">
					<div><select id="new-car-img-file-name-existing"></select></div>
					<div><button class="lsf-icon" icon="image" onclick="gebi('new-car-img-file').click()">ファイルを選択する</button>
					<span id="new-car-img-file-name-preview">ファイルを選択してください</span></div>
				</td>
			</tr>
			<tr>
				<td>
					車両長
				</td>
				<td>
					<input id="new-car-length" type="number" min="1" value="12">
				</td>
			</tr>
		</table>
		<input id="new-car-img-file" type="file" accept=".png">
		<p><label for="auto-insert-property" class="mku-checkbox-container"><input id="auto-insert-property" type="checkbox" checked></label><label for="auto-insert-property">主要なプロパティの入力欄を自動で用意</label></span></p>
	`, [{ "content": "車両作成", "event": `Dialog.list.addCarDialog.functions.addCar();`, "icon": "check" }, { "content": "キャンセル", "event": `Dialog.list.addCarDialog.off();`, "icon": "close" }], {
		display: function () {
			[gebi("new-car-name"), gebi("new-car-img-file"), gebi("new-car-length")].forEach(input => input.value = "");
			gebi("new-car-img-file").dispatchEvent(new Event("change"));
			gebi("new-car-img-file-name-preview").innerText = "ファイルを選択してください";
			setImageNamesToSelectBox(gebi("new-car-img-file-name-existing"));
			Dialog.list.addCarDialog.on();
		},
		addCar: function () {
			if (gebi("new-car-name").value == "" || gebi("new-car-length").value == "") {
				Dialog.list.alertDialog.functions.display("入力されていない項目があります。");
				return;
			} else {
				loader.start();
				let isFileSelected = gebi("new-car-img-file").files.length > 0;
				let fileName;
				if (isFileSelected && gebi("how-to-load-image").value == "0") {
					fileName = removeExtention(gebi("new-car-img-file").files[0].name);
				} else if (gebi("how-to-load-image").value == "1") {
					fileName = gebi("new-car-img-file-name-existing").value
				} else {
					loader.finish();
					Dialog.list.alertDialog.functions.display("画像ファイルの指定を見直してください。");
					return;
				}
				if (fileName.trim() == "") {
					loader.finish();
					Dialog.list.alertDialog.functions.display("画像ファイルの指定を見直してください。");
					return;
				}
				let promises = [];
				if (isFileSelected) {
					promises.push(appendImageToImagesList(fileName, gebi("new-car-img-file").files[0]));
				}
				Promise.all(promises).then(() => {
					if (addCarToMaster(gebi("new-car-name").value, fileName, 0, gebi("new-car-length").value)) {
						if (gebi("auto-insert-property").checked) {
							masterAddons.at(-1).copyright = "";
							masterAddons.at(-1).waytype = "track";
							masterAddons.at(-1).engine_type = "";
							masterAddons.at(-1).freight = "";
							masterAddons.at(-1).speed = "";
							masterAddons.at(-1).payload = "";
							masterAddons.at(-1).weight = "";
							masterAddons.at(-1).power = "";
							masterAddons.at(-1).intro_year = "";
							masterAddons.at(-1).intro_month = "";
						} else {
							Dialog.list.addCarPropertyDialog.functions.display();
						}
						refresh();
						Dialog.list.addCarDialog.off();
						let selectBox = gebi("carsSelectBox")
						selectBox.selectedIndex = selectBox.length - 1;
						selectBox.dispatchEvent(new Event("change"));
					} else {
						Dialog.list.alertDialog.functions.display("重複した名前の車両が存在するため追加できません。別の名前でお試しください。");
					}
					loader.finish();
				});
			}
		}
	}, true);
	gebi("new-car-img-file").addEventListener("change", () => {
		if (gebi("new-car-img-file").files.length > 0) {
			gebi("new-car-img-file-name-preview").innerText = gebi("new-car-img-file").files[0].name;
			gebi("new-car-img-file-name-existing").disabled = true;
		} else {
			gebi("new-car-img-file-name-preview").innerText = "ファイルを選択してください";
			gebi("new-car-img-file-name-existing").disabled = false;
		}
	});
	gebi("how-to-load-image").addEventListener("change", () => {
		let imageMethods = gebi("add-car-dialog-image-file").querySelectorAll("div");
		if (gebi("how-to-load-image").value == "0") {
			imageMethods[0].style.display = "none";
			imageMethods[1].style.display = "block";
		} else {
			imageMethods[0].style.display = "block";
			imageMethods[1].style.display = "none";
		}
	});
	gebi("how-to-load-image").dispatchEvent(new Event("change"));

	new Dialog("openDatFileDialog", "総合読み込み", `
		<div id="dat-file-drop-area" class="filefield">
			<p>dat,png,tabファイルをまとめてドラッグ＆ドロップすると全ての読み込みを行います</p>
			<p>最低でも1件のdatファイルと1件の有効な車両が含まれている必要があります</p>
			<p id="overwrite-warn">既に読み込まれているデータがある場合、重複する内容は上書きされます</p>
		</div>
		`, [{ "content": "キャンセル", "event": `refresh();Dialog.list.openDatFileDialog.off();`, "icon": "close" }], {
		display: function () {
			if (masterAddons.length > 0) {
				gebi("overwrite-warn").style.display = "block";
			} else {
				gebi("overwrite-warn").style.display = "none";
			}
			Dialog.list.openDatFileDialog.on();
		}
	}, true);

	new Dialog("selectImageDialog", "ファイルから画像を読み込み", `
		<p>
		<span class="selectbox-fluctuation-button" style="margin-right:0.75em;">
		<select id="imageSelectBox">
		</select>
		</span>
		<button class="lsf-icon" icon="image" onclick="gebi('image-file-input').click()">ファイルを選択する</button>
		</p>
		<p>以下に複数ファイルをドラッグ＆ドロップで一括投入(datファイルに記述されている画像ファイル名と同じ名前のファイルである必要があります)</p>
		<div id="selected-image-preview">
		</div>
		<input type="file" id="image-file-input" accept=".png">
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

	new Dialog("openJaTabFileDialog", "日本語化ファイルを読み込み", `
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
		`, [{ "content": "クリップボードにコピー", "event": `navigator.clipboard.writeText(gebi("dat-preview").innerText).then(()=>{new Message('クリップボードにコピーしました。', ['normal-message'], 3000, true, true);})`, "icon": "tabs" }, { "content": "保存", "event": `saveFile(Dialog.list.previewDialog.functions.type);`, "icon": "download" }, { "content": "閉じる", "event": `Dialog.list.previewDialog.off();`, "icon": "close" }], {
		type: "",
		display: function (datText, type) {
			Dialog.list.previewDialog.functions.type = type;
			gebi("dat-preview").innerHTML = datText.replace(/\n/g, "<br>");
			Dialog.list.previewDialog.dialogTitle.innerHTML = `${type}プレビュー`;
			Dialog.list.previewDialog.on();
		}
	}, true);

	let directionSelectBox = "";
	DIRECTIONS.forEach((dir, i) => {
		directionSelectBox += `<option value="${dir}">${dir}</option>`;
	})

	new Dialog("carListDialog", "車両リスト", `
		<div id="car-list-table-container"></div>
	`, [{ "content": "車両追加", "event": `Dialog.list.addCarDialog.functions.display();`, "icon": "add" }, { "content": "一括操作", "event": `Dialog.list.carListDialog.functions.ikkatsuSousa();`, "icon": "wrench", "id": "car-list-ikkatsu-sousa" }, { "content": "閉じる", "event": `Dialog.list.carListDialog.off();`, "icon": "close" }], {
		display: function () {
			let tableContainer = gebi("car-list-table-container");
			tableContainer.classList.add("list-table-container");
			tableContainer.innerHTML = "";
			let table = new Table();
			table.setAttributes({ "class": "row-hover-hilight horizontal-stripes" });
			table.addRow();
			table.addCell("<input type='checkbox'>");
			table.addCell("番号");
			table.addCell("車両名");
			table.addCell("日本語名");
			table.addCell("操作");
			masterAddons.forEach((addon, i) => {
				table.addRow();
				table.addCell(`<input type="checkbox" class="row-selector" value="${addon.name}">`);
				table.addCell(`${i}`);
				table.addCell(...reduceText(addon.name, 40));
				table.addCell(...reduceText(getJapaneseNameFromAddon(addon, "-"), 35));
				table.addCell(`<button class="lsf mku-balloon" mku-balloon-message="車両を開く" onclick="Dialog.list.carListDialog.functions.open(${i})">search</button><button class="lsf mku-balloon" mku-balloon-message="車両を削除" onclick="Dialog.list.carListDialog.functions.delete(${i})">delete</button>`);
			});
			tableContainer.innerHTML = table.generateTable();
			setTableCheckboxEvents(tableContainer, [gebi("car-list-ikkatsu-sousa")]);
			TableSort.addSortButtonToTable(tableContainer);
			Dialog.list.carListDialog.on();
		},
		ikkatsuSousa: function () {
			Dialog.list.ikkatsuSousaDialog.functions.display(Array.from(gebi("car-list-table-container").querySelectorAll(".row-selector:checked")).map(checkbox => getObjectByItsName(masterAddons, checkbox.value)));
		},
		open: function (id) {
			gebi("carsSelectBox").selectedIndex = id;
			gebi("carsSelectBox").dispatchEvent(new Event("change"));
			Dialog.list.carListDialog.off();
		},
		delete: function (id) {
			Dialog.list.confirmDialog.functions.display(`車両を削除してもよろしいですか？`, () => {
				deleteCarFromMasterById(id);
				setAddonNamesToSelectBox(gebi("carsSelectBox"));
				setImageNamesToSelectBox(gebi("imageSelectBox"));
				refresh();
				new Message(`車両を削除しました。`, ["normal-message"], 3000, true, true);
			});
		}
	}, true);
	new Dialog("imageListDialog", "画像ファイルリスト", `
		<div id="image-list-table-container"></div>
	`, [{ "content": "閉じる", "event": `Dialog.list.imageListDialog.off();`, "icon": "close" }], {
		display: function () {
			let tableContainer = gebi("image-list-table-container");
			tableContainer.classList.add("list-table-container");
			tableContainer.innerHTML = "";
			let table = new Table();
			table.setAttributes({ "class": "row-hover-hilight horizontal-stripes" });
			table.addRow();
			table.addCell("<input type='checkbox'>");
			table.addCell("番号");
			table.addCell("datに記述されている画像ファイル名");
			table.addCell("画像読込済");
			table.addCell("操作");
			let i = 0;
			imageFileNames.forEach((fileName) => {
				table.addRow();
				table.addCell(`<input type="checkbox" class="row-selector" value="${i}">`);
				table.addCell(`${i}`);
				table.addCell(`${fileName}`);
				if (imageFiles.has(fileName)) {
					table.addCell(`○`, { "class": "text-center" });
					table.addCell(`<button class="lsf mku-balloon" mku-balloon-message="画像を見る" onclick="Dialog.list.imageListDialog.functions.open('${fileName}')">eye</button>`);
				} else {
					table.addCell(`×`, { "class": "text-center" });
					table.addCell(`<button class="lsf mku-balloon" mku-balloon-message="ファイルから画像を読み込み" onclick="Dialog.list.selectImageDialog.functions.display('${fileName}')">image</button>`);
				}
				i++;
			});
			tableContainer.innerHTML = table.generateTable();
			setTableCheckboxEvents(tableContainer, []);
			TableSort.addSortButtonToTable(tableContainer);
			Dialog.list.imageListDialog.on();
		},
		open: function (imageFileName) {
			Dialog.list.imagePreviewDialog.functions.display(imageFileName);
		}
	}, true);
	new Dialog("imagePreviewDialog", "画像ファイルプレビュー", `
		<div id="image-preview-dialog-image-preview-container"></div>
	`, [{ "content": "閉じる", "event": `Dialog.list.imagePreviewDialog.off();`, "icon": "close" }], {
		display: function (imageFileName) {
			gebi("imagePreviewDialog").querySelector(".dialog-title").innerHTML = imageFileName;
			let container = gebi("image-preview-dialog-image-preview-container");
			container.innerHTML = "";
			let image = imageFiles.get(imageFileName);
			container.appendChild(image);
			Dialog.list.imagePreviewDialog.on();
		}
	}, true);
	//一覧ダイアログにクラス付与
	[gebi("imageListDialog"), gebi("carListDialog")].forEach((dialog) => {
		dialog.classList.add("list-dialog");
	});
	//テキストの短縮
	function reduceText(text, maxChar) {
		let result = [text.substr(0, maxChar)];
		if (text == "-") { result.push({ "class": "text-center" }); }
		if (text.length > maxChar) {
			result[0] += "…"
			result.push({ "class": "mku-balloon", "mku-balloon-message": text })
		}
		return result;
	}

	new Dialog("ikkatsuSousaDialog", "<span id='ikkatsu-car-count'></span>両の車両に一括操作", `
		<ul class="dialog-buttons-list">
			<li><button onclick="Dialog.list.ikkatsuSousaDialog.functions.editProp()" class="lsf-icon dialog-main-button" icon="pen">プロパティ投入</button></li>
			<li><button onclick="Dialog.list.copyCarDialog.functions.display()" class="lsf-icon dialog-main-button" icon="tabs">車両コピー</button></li>
			<!--<li><button onclick="Dialog.list.ikkatsuSousaDialog.functions.editProp()" class="lsf-icon dialog-main-button" icon="sync">プロパティ置換</button></li>-->
			<li><button onclick="Dialog.list.ikkatsuSousaDialog.functions.delete()" class="lsf-icon dialog-main-button" icon="delete">削除</button></li>
		</ul>
	`, [{ "content": "閉じる", "event": `Dialog.list.ikkatsuSousaDialog.off();`, "icon": "close" }], {
		addons: [],
		display: function (x) {
			gebi("ikkatsu-car-count").innerText = x.length;
			Dialog.list.ikkatsuSousaDialog.functions.addons = x;
			Dialog.list.ikkatsuSousaDialog.on();
		},
		editProp: function () {
			Dialog.list.addCarPropertyDialog.functions.display(Dialog.list.ikkatsuSousaDialog.functions.addons);
		},
		delete: function () {
			let addons = Dialog.list.ikkatsuSousaDialog.functions.addons;
			Dialog.list.confirmDialog.functions.display(`${addons.length}両の車両を削除してもよろしいですか？`, () => {
				addons.forEach(deleteCarFromMaster);
				setAddonNamesToSelectBox(gebi("carsSelectBox"));
				setImageNamesToSelectBox(gebi("imageSelectBox"));
				refresh();
				Dialog.list.ikkatsuSousaDialog.off();
				new Message(`${addons.length}両の車両を削除しました。`, ["normal-message"], 3000, true, true);
			});
		}
	}, true);

	new Dialog("copyCarDialog", "<span id='ikkatsu-copy-car-count'></span>両の車両をコピー", `

	<div class="properties-container">
		<div>
			対象プロパティ
		</div>
		<div id="copy-taishou-properties">
		</div>
	</div>
	<div class="list-container">
		<div>
			<input id="copy-replace-pattern" placeholder="検索(正規表現可)">
		</div>
		<div>
			→
		</div>
		<div>
			<input id="copy-replace-replacement" placeholder="置換">
		</div>
	</div>
	<div class="list-container" id="copy-addon-names-list-container">
		<div id="copy-origin-addon-names">
			<ul id="copy-origin-addon-names-list"></ul>
		</div>
		<div>
			→
		</div>
		<div id="copy-preview-addon-names">
			<ul id="copy-preview-addon-names-list"></ul>
		</div>
	</div>

	`, [{ "content": "コピー", "event": `Dialog.list.copyCarDialog.functions.copy();`, "icon": "tabs" }, { "content": "閉じる", "event": `Dialog.list.copyCarDialog.off();`, "icon": "close" }], {
		display: function () {
			//対象アドオン
			let addons = Dialog.list.ikkatsuSousaDialog.functions.addons;

			//対象プロパティ
			let properties = new Set();

			let ul = gebi("copy-origin-addon-names-list");
			ul.innerHTML = "";
			addons.forEach((addon) => {
				let li = document.createElement("li");
				li.innerText = addon.name;
				ul.appendChild(li);
				for (let prop in addon) {
					if (prop != CONSTRAINT && !prop.startsWith(EMPTYIMAGE)) {
						properties.add(prop);
					}
				}
			});

			let createCheckBox = (displayText, value) => {
				let label = document.createElement("label");
				label.setAttribute("for", `copy-prop-chkbox-${value}`);
				let checkbox = document.createElement("input");
				checkbox.setAttribute("type", "checkbox");
				checkbox.checked = true;
				checkbox.id = `copy-prop-chkbox-${value}`;
				checkbox.value = value;
				checkbox.disabled = value == "name" || value == "obj";
				let span = document.createElement("span");
				span.innerHTML = displayText;
				label.appendChild(checkbox);
				label.appendChild(span);
				return label;
			}

			let addCheckBox = (prop) => {
				return createCheckBox(prop, prop);
			}

			let propCheckboxArea = gebi("copy-taishou-properties");
			propCheckboxArea.innerHTML = "";
			propCheckboxArea.appendChild(createCheckBox("連結設定", "constraints"));
			propCheckboxArea.appendChild(createCheckBox("画像指定", "images"));
			properties.forEach((prop) => {
				propCheckboxArea.appendChild(addCheckBox(prop));
			});
			gebi("ikkatsu-copy-car-count").innerText = addons.length;

			Dialog.list.copyCarDialog.functions.refresh();
			Dialog.list.copyCarDialog.on();
		},
		refresh: function () {
			let addons = Dialog.list.ikkatsuSousaDialog.functions.addons;

			let inputs = [gebi("copy-replace-pattern").value.trim(), gebi("copy-replace-replacement").value];

			generateRegExp(inputs);

			let ul = gebi("copy-preview-addon-names-list");
			ul.innerHTML = "";
			addons.forEach((addon) => {
				let li = document.createElement("li");
				li.innerText = addon.name.replace(...inputs);
				if (li.innerText == "") {
					li.innerText = "　";
				}
				ul.appendChild(li);
			});
		},
		copy: function () {
			//汚染しないため配列コピー
			let addons = Array.from(Dialog.list.ikkatsuSousaDialog.functions.addons);

			let inputs = [gebi("copy-replace-pattern").value.trim(), gebi("copy-replace-replacement").value];
			generateRegExp(inputs);

			let tmpAddons = [];
			let failueCount = 0;

			let copyProperties = Array.from(document.querySelectorAll("#copy-taishou-properties input:checked")).map(input => input.value);

			//連結設定を名前のSetに設定しなおす関数
			let setCopiedAddonToConstraint = (addon, newAddon, mode) => {
				let constraints = addon[CONSTRAINT][mode];
				newAddon[CONSTRAINT][mode] = new Set();
				constraints.forEach((constraint) => {
					newAddon[CONSTRAINT][mode].add(constraint.name);
				});
			}

			addons.forEach((addon) => {
				let newName = addon.name.replace(...inputs);
				//名称重複および空文字チェック
				if (getObjectsByItsName(masterAddons, newName).length == 0 && newName.trim() != "") {
					//複製を実施
					let newAddon = {};
					for (let prop in addon) {
						//連結設定を設定しなおし(この段階では名前を文字列で投入する)
						if (prop == CONSTRAINT) {
							newAddon[CONSTRAINT] = { prev: new Set(), next: new Set() };
							if (copyProperties.indexOf("constraints") != -1) {
								setCopiedAddonToConstraint(addon, newAddon, "prev");
								setCopiedAddonToConstraint(addon, newAddon, "next");
							}
						} else if (prop.startsWith(EMPTYIMAGE)) {
							if (copyProperties.indexOf("images") != -1) {
								newAddon[prop] = addon[prop];
							}
						} else {
							if (copyProperties.indexOf(prop) != -1) {
								newAddon[prop] = addon[prop];
							}
						}
					}
					newAddon.name = newName;
					tmpAddons.push(newAddon);
					//候補リストから削除
					let addonIndex = Dialog.list.ikkatsuSousaDialog.functions.addons.indexOf(addon);
					Dialog.list.ikkatsuSousaDialog.functions.addons.splice(addonIndex, 1);
				} else {
					failueCount++;
				}
			});

			//マスタに投入
			masterAddons.push(...tmpAddons);

			//コピーしたアドオンの連結設定を名前からオブジェクトへ変換
			masterAddons.forEach((addon) => {
				convertConstraintsToObject(addon, "prev", inputs);
				convertConstraintsToObject(addon, "next", inputs);
			});

			//表示更新
			setAddonNamesToSelectBox(gebi("carsSelectBox"));
			refresh();

			//成功状況によってリフレッシュ方法を変更
			if (failueCount == 0) {
				Dialog.list.ikkatsuSousaDialog.off();
				Dialog.list.copyCarDialog.off();
			} else {
				gebi("ikkatsu-car-count").innerText = Dialog.list.ikkatsuSousaDialog.functions.addons.length;
				Dialog.list.copyCarDialog.functions.display();
			}

			new Message(`${addons.length - failueCount}両の車両をコピーしました。${failueCount > 0 ? `${failueCount}両の車両はコピーできませんでした。` : ""}`, ["normal-message"], 3000, true, true);
		}
	}, true);
	//正規表現を解釈し、解釈の成否によって挙動を調整する
	function generateRegExp(patInputs) {
		if (patInputs[0] != "") {
			//正規表現を解釈
			try {
				patInputs[0] = new RegExp(patInputs[0], "g");
			} catch (e) {
				//正規表現の解釈に失敗したら文字列をそのまま返す
				patInputs[0] = patInputs[0];
			}
		} else {
			//検索文字列が指定されていない場合は最後尾に_copyをつける
			patInputs[1] = patInputs[1] == "" ? "_copy" : patInputs[1];
			patInputs[0] = new RegExp("$");
		}
	}
	[gebi("copy-replace-pattern"), gebi("copy-replace-replacement")].forEach((input) => {
		input.addEventListener("input", () => {
			Dialog.list.copyCarDialog.functions.refresh();
		});
	});
	gebi("copy-origin-addon-names").addEventListener("scroll", () => {
		gebi("copy-preview-addon-names").scrollTop = gebi("copy-origin-addon-names").scrollTop;
	});
	gebi("copy-preview-addon-names").addEventListener("scroll", () => {
		gebi("copy-origin-addon-names").scrollTop = gebi("copy-preview-addon-names").scrollTop;
	});


	new Dialog("addCarPropertyDialog", "車両にプロパティを追加", `
		<p>対象車両：<span id="adding-new-property-target"></span></p>
		<table class="input-area">
			<tr>
				<td>
					プロパティ名
				</td>
				<td>
					<input id="new-property-property-name">
					<div id="new-property-property-name-suggestion" class="suggestion-box">
					</div>
				</td>
			</tr>
			<tr>
				<td>
					値
				</td>
				<td>
					<input id="new-property-property-value">
					<div id="new-property-value-suggestion" class="suggestion-box">
					</div>
				</td>
			</tr>
		</table>
		<div style="font-size:75%;color: #777;margin-top:0.5em;">※既に存在するプロパティは上書きされます</div>
		<div style="margin-top:0.5em;"><label for="continuously-add-property" class="mku-checkbox-container"><input id="continuously-add-property" type="checkbox" checked="" onchange=""></label><label for="continuously-add-property">連続編集</label></div>
	`, [{ "content": "追加", "event": `Dialog.list.addCarPropertyDialog.functions.addProperty();`, "icon": "check", "id": "new-property-confirm" }, { "content": "キャンセル", "event": `Dialog.list.addCarPropertyDialog.off();`, "icon": "close" }], {
		addons: [],
		addon: null,
		display: function (targetAddons, propName) {
			if (targetAddons != undefined) {
				Dialog.list.addCarPropertyDialog.functions.addons = targetAddons;
				Dialog.list.addCarPropertyDialog.functions.addon = targetAddons[0];
				gebi("adding-new-property-target").innerText = `${Dialog.list.addCarPropertyDialog.functions.addon.name}を含む${targetAddons.length}両の車両`;
			} else {
				Dialog.list.addCarPropertyDialog.functions.addon = getEditingAddon();
				Dialog.list.addCarPropertyDialog.functions.addons = [Dialog.list.addCarPropertyDialog.functions.addon];
				gebi("adding-new-property-target").innerText = Dialog.list.addCarPropertyDialog.functions.addon.name;
			}
			document.querySelectorAll("#addCarPropertyDialog input").forEach(input => {
				input.value = "";
				input.dispatchEvent(new Event("input"));
			});
			valueSuggestionBox.classList.add("unavailable");
			if (propName != undefined) {
				gebi("new-property-property-name").value = propName;
			}
			gebi("new-property-property-name").dispatchEvent(new Event("input"));
			Dialog.list.addCarPropertyDialog.on();
		},
		addProperty: function () {
			let propName = gebi("new-property-property-name").value;
			let propValue = gebi("new-property-property-value").value;
			if (propName == "" || propValue == "") {
				Dialog.list.alertDialog.functions.display("入力されていない項目があります。");
			} else {
				for (let addon of Dialog.list.addCarPropertyDialog.functions.addons) {
					addon[propName] = propValue;
				}
				new Message(`${Dialog.list.addCarPropertyDialog.functions.addons.length}両の車両にプロパティを適用しました。`, ["normal-message"], 3000, true, true);
				refresh();
				if (gebi("continuously-add-property").checked) {
					Dialog.list.addCarPropertyDialog.functions.display(Dialog.list.addCarPropertyDialog.functions.addons);
				} else {
					Dialog.list.addCarPropertyDialog.off();
				}
			}
		}
	}, true);

	let propertySuggestionBox = gebi("new-property-property-name-suggestion");
	let valueSuggestionBox = gebi("new-property-value-suggestion");

	setSuggestionBox(gebi("new-property-property-name"), propertySuggestionBox, FORMULAIC_PHRASE_FOR_DAT_PROP);
	setSuggestionBox(gebi("new-property-property-value"), valueSuggestionBox, {});
	valueSuggestionBox.classList.add("unavailable");

	gebi("new-property-property-name").addEventListener("input", () => {
		let addon = Dialog.list.addCarPropertyDialog.functions.addon;
		let addons = Dialog.list.addCarPropertyDialog.functions.addons;
		let propInput = gebi("new-property-property-name");
		let propInputValue = propInput.value.toLowerCase();

		let confirmButton = gebi("new-property-confirm");
		let valueInput = gebi("new-property-property-value");

		//name,obj,constraint,emptyimageは書き込み禁止
		let isDisabled = (propInputValue == "name" || propInputValue == "obj" || propInputValue.startsWith(EMPTYIMAGE) || propInputValue == CONSTRAINT);
		confirmButton.disabled = isDisabled;
		valueInput.disabled = isDisabled;
		if (isDisabled) {
			propInput.classList.add("validation-error");
			//警告を表示
			gebi("addCarPropertyDialog").querySelector(".dialog-title").innerHTML = `${propInputValue}は変更できません`;
		} else {
			propInput.classList.remove("validation-error");
			//既に当該車両に存在するプロパティの場合
			if (addons.length == 1) {
				if (addon[propInputValue] != undefined) {
					//値を投入
					valueInput.value = addon[propInputValue];

					//警告を表示
					gebi("addCarPropertyDialog").querySelector(".dialog-title").innerHTML = "車両のプロパティを上書き";
					confirmButton.innerHTML = `上書き`;
				} else {
					gebi("addCarPropertyDialog").querySelector(".dialog-title").innerHTML = "車両にプロパティを追加";
					confirmButton.innerHTML = `追加`;
				}
			} else {
				gebi("addCarPropertyDialog").querySelector(".dialog-title").innerHTML = `車両にプロパティを一括投入`;
				confirmButton.innerHTML = `投入`;
			}
		}

		//サジェストが存在する場合はサジェストをセット
		if (FORMULAIC_PHRASE_FOR_DAT_VAL.hasOwnProperty(propInputValue)) {
			setDatasetToSuggestionBox(valueInput, valueSuggestionBox, FORMULAIC_PHRASE_FOR_DAT_VAL[propInputValue]);
			valueSuggestionBox.classList.remove("unavailable");
		} else {
			valueSuggestionBox.classList.add("unavailable");
		}

	});


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
					<select id="addon-image-file-name"></select>
				</span>
			</tr>
		</table>
		<div id="addon-image-preview"></div>
		<p style="margin-bottom:0;text-align:center;">↓クリックで画像を指定・shift+クリックで1列をまとめて指定↓</p>
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
		lastX: 0,
		display: function () {
			Dialog.list.editImageDialog.functions.lastX = 0;

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
			window.getSelection().removeAllRanges();
			let addonWholeImageArea = gebi("addon-image-whole-preview");
			let positionPointerCursor = gebi("position-pointer-cursor");
			let addonImagePositionsArea = gebi("addon-image-positions");
			let x = 0;
			Dialog.list.editImageDialog.functions.lastX = Math.floor((e.clientX - addonWholeImageArea.getBoundingClientRect().left) / PAK_TYPE / Dialog.list.editImageDialog.functions.imageDisplaySizeRatio);
			let y = Math.floor((e.clientY - addonWholeImageArea.getBoundingClientRect().top) / PAK_TYPE / Dialog.list.editImageDialog.functions.imageDisplaySizeRatio);
			if (e.shiftKey) {
				positionPointerCursor.style.width = `600px`;
				x = 0;
			} else {
				positionPointerCursor.style.width = `${PAK_TYPE * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				x = Dialog.list.editImageDialog.functions.lastX;
			}
			if (x >= 0 && y >= 0) {
				positionPointerCursor.classList.add("on");
				positionPointerCursor.style.left = `${x * PAK_TYPE * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				positionPointerCursor.style.top = `${y * PAK_TYPE * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				addonImagePositionsArea.innerHTML = `x:${Dialog.list.editImageDialog.functions.editingAddonMainImageData[2]}, y:${Dialog.list.editImageDialog.functions.editingAddonMainImageData[1]} => ${e.shiftKey ? "x:0～7" : `x:${x}`}, y:${y}`;
			} else {
				positionPointerCursor.classList.remove("on");
			}
		},
		clickPositionPointerCursor: function (e) {
			let addonWholeImageArea = gebi("addon-image-whole-preview");
			let y = Math.floor((e.clientY - addonWholeImageArea.getBoundingClientRect().top) / PAK_TYPE / Dialog.list.editImageDialog.functions.imageDisplaySizeRatio);
			if (e.shiftKey) {
				DIRECTIONS.forEach((dir, i) => {
					Dialog.list.editImageDialog.functions.editingAddon[`${EMPTYIMAGE}[${dir}]`] = `${Dialog.list.editImageDialog.functions.editingAddonMainImageData[0]}.${y}.${i}`;
				});
				Dialog.list.editImageDialog.functions.refresh();
			} else {
				let x = Math.floor((e.clientX - addonWholeImageArea.getBoundingClientRect().left) / PAK_TYPE / Dialog.list.editImageDialog.functions.imageDisplaySizeRatio);
				Dialog.list.editImageDialog.functions.editingAddon[`${EMPTYIMAGE}[${Dialog.list.editImageDialog.functions.selectedDirection}]`] = `${Dialog.list.editImageDialog.functions.editingAddonMainImageData[0]}.${y}.${x}`;
				Dialog.list.editImageDialog.functions.refresh();
			}
		},
		dispatchKeyDownEvent: function (e) {
			let positionPointerCursor = gebi("position-pointer-cursor");
			if (e.shiftKey && Dialog.list.editImageDialog.isActive && positionPointerCursor.classList.contains("on")) {
				positionPointerCursor.style.left = 0;
				positionPointerCursor.style.width = `600px`;
			}
		},
		dispatchKeyUpEvent: function (e) {
			let addonWholeImageArea = gebi("addon-image-whole-preview");
			let positionPointerCursor = gebi("position-pointer-cursor");
			if (Dialog.list.editImageDialog.isActive && positionPointerCursor.classList.contains("on")) {
				positionPointerCursor.style.left = `${Dialog.list.editImageDialog.functions.lastX * PAK_TYPE * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
				positionPointerCursor.style.width = `${PAK_TYPE * Dialog.list.editImageDialog.functions.imageDisplaySizeRatio}px`;
			}
		},
		refresh: function () {
			refresh();

			//イベントリセット
			let addonWholeImageArea = gebi("addon-image-whole-preview");
			addonWholeImageArea.removeEventListener("mouseenter", Dialog.list.editImageDialog.functions.showPositionPointerCursor);
			addonWholeImageArea.removeEventListener("mousemove", Dialog.list.editImageDialog.functions.movePositionPointerCursor);
			addonWholeImageArea.removeEventListener("click", Dialog.list.editImageDialog.functions.clickPositionPointerCursor);
			window.removeEventListener("keydown", Dialog.list.editImageDialog.functions.dispatchKeyDownEvent);
			window.removeEventListener("keyup", Dialog.list.editImageDialog.functions.dispatchKeyUpEvent);

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
			let preview = setAddonPreviewImageByDirection(addonImageArea, Dialog.list.editImageDialog.functions.editingAddon, Dialog.list.editImageDialog.functions.selectedDirection);
			//方向別矢印をセット
			preview.innerHTML = DIRECTION_ARROWS[selectBox.selectedIndex];
			preview.classList.add("mku-balloon");
			preview.setAttribute("mku-balloon-message", `矢印の向きと車両の向きが同じであれば正しい方向にセットされています`);

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
				window.addEventListener("keydown", Dialog.list.editImageDialog.functions.dispatchKeyDownEvent);
				window.addEventListener("keyup", Dialog.list.editImageDialog.functions.dispatchKeyUpEvent);

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
	gebi("addon-image-file-name").addEventListener("change", () => {
		changeImage(Dialog.list.editImageDialog.functions.editingAddon, gebi("addon-image-file-name").value);
		Dialog.list.editImageDialog.functions.refresh();
	});

	new Dialog("couplingPreviewDialog", "連結プレビュー", `
		<div>
			<p>編成(<span id="preview-current-formation-count"></span>両)<button id="clear-preview-formation-button" onclick="Dialog.list.couplingPreviewDialog.functions.currentFormation=[];Dialog.list.couplingPreviewDialog.functions.refresh();" class="lsf-icon" icon="clear">編成クリア</button></p>
			<div id="preview-current-formation" class="cars-container"></div>
		</div>
		<div>
			<p>連結候補</p>
			<div id="preview-current-candidate" class="cars-container"></div>
		</div>
		`, [{ "content": "編成からコスト計算", "event": `Dialog.list.calcCostDialog.functions.display();`, "icon": "graph", "id": "open-calc-cost-dialog-button" }, { "content": "撮影", "event": `Dialog.list.formatedAddonsImageDialog.functions.display();`, "icon": "camera", "id": "open-formated-image-dialog-button" }, { "content": "終了", "event": `Dialog.list.couplingPreviewDialog.off();`, "icon": "close" }], {
		currentFormation: [],
		display: function () {
			if (masterAddons.length == 0) {
				Dialog.list.alertDialog.functions.display("先にdatファイルを読み込んでください。");
			} else {
				Dialog.list.couplingPreviewDialog.functions.refresh();
				Dialog.list.couplingPreviewDialog.on();
			}
		},
		refresh: function (isFromRemove) {
			let currentArea = gebi("preview-current-formation");
			currentArea.innerHTML = "";
			let candidateArea = gebi("preview-current-candidate");
			candidateArea.innerHTML = "";

			let formation = Dialog.list.couplingPreviewDialog.functions.currentFormation;
			gebi("preview-current-formation-count").innerHTML = formation.length;
			[
				gebi("clear-preview-formation-button"),
				gebi("open-formated-image-dialog-button"),
				gebi("open-calc-cost-dialog-button")
			].forEach((button) => { button.disabled = formation.length == 0; });

			formation.forEach((car, i) => {
				let outer = createOuter(false);
				outer.dataset.addonName = car.name;
				setAddonPreviewImage(outer, car);
				setAddonBalloon(outer, car);
				if (i == formation.length - 1) {
					outer.addEventListener("click", () => {
						gebi("mku-balloon").classList.remove("on");
						formation.pop();
						Dialog.list.couplingPreviewDialog.functions.refresh(true);
					});
				}
				currentArea.appendChild(outer);
			});
			if (formation.length == 0) {
				//編成エリアのレイアウト崩れ防止用の空車両
				let dummyOuter = createOuter(true);
				currentArea.appendChild(dummyOuter);

				masterAddons.forEach((addon) => {
					if (addon[CONSTRAINT]["prev"].size == 0 || (addon[CONSTRAINT]["prev"].size == 1 && [...addon[CONSTRAINT]["prev"].keys()][0] == ADDON_NONE)) {
						addImagePreview(candidateArea, formation, addon);
					}
				});
			} else {
				let candidateAddonsCount = 0;
				masterAddons.forEach((addon) => {
					if (addon[CONSTRAINT]["prev"].has(formation.at(-1)) || (addon[CONSTRAINT]["prev"].size == 0 && formation.at(-1)[CONSTRAINT]["next"].size == 0)) {
						addImagePreview(candidateArea, formation, addon);
						candidateAddonsCount++;
					}
				});
				if (candidateAddonsCount == 1 && formation.at(-1)[CONSTRAINT]["next"].size != 0 && !Boolean(isFromRemove)) {
					//ユーザ操作によって追加されたさらにその次の連結候補(next)が1件のみだった場合、その要素をクリックしてしまう
					candidateArea.querySelector(".image-container").click();
				} else if (Boolean(isFromRemove) && formation.at(-1)[CONSTRAINT]["next"].size == 1) {
					//ユーザ操作によって削除されたさらにその前の連結候補(prev)が1件のみだった場合、その要素をクリックしてしまう
					Array.from(currentArea.querySelectorAll(".image-container")).at(-1).click();
				}
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

	new Dialog("calcCostDialog", "編成からコスト計算", `
		<table class="input-area">
			<tr>
				<td>
					係数
				</td>
				<td>
					<span id="formation-keisuu"></span>
				</td>
			</tr>
			<tr>
				<td>
					編成定員
				</td>
				<td>
					<span id="formation-payload"></span>人
				</td>
			</tr>
			<tr>
				<td>
					編成出力
				</td>
				<td>
					<span id="formation-power"></span>kW
				</td>
			</tr>
			<tr>
				<td>
					ギア比
				</td>
				<td>
					×<span id="formation-gear"></span>
				</td>
			</tr>
			<tr>
				<td>
					編成重量
				</td>
				<td>
					<span id="formation-weight"></span>t
				</td>
			</tr>
			<tr>
				<td>
					編成最高速度
				</td>
				<td>
					<span id="formation-speed"></span>km/h
				</td>
			</tr>
			<tr>
				<td>
					起動加速度
				</td>
				<td>
					<input id="formation-starting-acceleration" type="number" min="0">km/h/s
				</td>
			</tr>
		</table>
		<p><span class="mku-balloon" mku-balloon-message="オンにするとgear･cost･runningcostの値が上書きされる可能性があります"><label for="overwrite-exists-property" class="mku-checkbox-container"><input id="overwrite-exists-property" type="checkbox" checked></label><label for="overwrite-exists-property">既存のプロパティに上書き</label></span></p>
		<p><span class="mku-balloon" mku-balloon-message="加速度が足りない場合はオンにしてください"><label for="boost-mode" class="mku-checkbox-container"><input id="boost-mode" type="checkbox"></label><label for="boost-mode">ブーストモード</label></span></p>
	`, [{ "content": "適用", "event": `Dialog.list.calcCostDialog.functions.applyCostsheet();`, "icon": "check", "id": "apply-costsheet-button", "disabled": "disabled" }, { "content": "閉じる", "event": `Dialog.list.calcCostDialog.off();`, "icon": "close" }], {
		costs: {},
		display: function () {
			if (Dialog.list.calcCostDialog.functions.refresh()) {
				Dialog.list.calcCostDialog.on();
			}
		},
		refresh: function () {
			let formation = Dialog.list.couplingPreviewDialog.functions.currentFormation;

			let startingAcceleration = Number(gebi("formation-starting-acceleration").value);

			//編成合計
			let formationWeight = 0, formationPayload = 0, formationPower = 0;

			let formationSpeed = formation[0].speed;
			let introYear = formation[0].intro_year;

			formation.forEach((addon) => {
				formationPayload += Number(addon.payload != undefined ? addon.payload : 0);
				formationWeight += Number(addon.weight != undefined ? addon.weight : 0);
				formationPower += Number(addon.power != undefined ? addon.power : 0);
				formationSpeed = Math.min(formationSpeed, addon.speed);
				introYear = Math.min(introYear, addon.intro_year);
			});

			let keisuu = calcKeisu(introYear);
			let gear = calcGear(formationSpeed, startingAcceleration, formationWeight, formationPayload, formationPower, gebi("boost-mode").checked);
			if (!(isNaN(formationSpeed) || isNaN(startingAcceleration) || isNaN(formationWeight) || isNaN(formationPayload) || isNaN(formationPower) || isNaN(introYear) || isNaN(keisuu) || isNaN(gear))) {
				gebi("formation-payload").innerText = formationPayload;
				gebi("formation-weight").innerText = Math.floor(formationWeight);
				gebi("formation-power").innerText = formationPower;
				gebi("formation-speed").innerText = formationSpeed;
				gebi("formation-keisuu").innerText = keisuu;
				gebi("formation-gear").innerText = gear / 100;

				Dialog.list.calcCostDialog.functions.costs = {
					startingAcceleration: startingAcceleration,
					formationPayload: formationPayload,
					formationWeight: formationWeight,
					formationPower: formationPower,
					formationSpeed: formationSpeed,
					keisuu: keisuu,
					gear: gear
				};
				return true;
			} else {
				new Message(`未設定項目があります。車両の ( speed / payload / power / weight / intro_year ) の各プロパティに値がセットされているか確認してください。`, ["normal-message"], 4000, true, true);
				return false;
			}
		},
		applyCostsheet: function () {
			let formation = Dialog.list.couplingPreviewDialog.functions.currentFormation;
			Dialog.list.confirmDialog.functions.display(`コストシートから導出した性能値を${formation.length}両の車両に設定してもよろしいですか？`, () => {
				let formationCosts = Dialog.list.calcCostDialog.functions.costs;
				let overwriteMode = gebi("overwrite-exists-property").checked;
				formation.forEach((addon) => {
					let power = addon.power != undefined ? addon.power : 0;
					let cost = calcCost(formationCosts.gear, formationCosts.formationSpeed, addon.payload, power, formationCosts.keisuu)
					for (let prop in cost) {
						if (overwriteMode || addon[prop] == undefined) {
							addon[prop] = cost[prop];
						}
					}
					if (power != 0 && (overwriteMode || addon.gear == undefined)) {
						addon.gear = formationCosts.gear;
					}
				});
				Dialog.list.calcCostDialog.off();
				Dialog.list.couplingPreviewDialog.off();
				refresh();
				new Message(`${formation.length}両の車両にコストシートを適用しました。`, ["normal-message"], 3000, true, true);
			});
		}
	}, true);
	gebi("formation-starting-acceleration").addEventListener("input", () => {
		let val = gebi("formation-starting-acceleration").value;
		gebi("apply-costsheet-button").disabled = val.trim() == "" || Number(val) <= 0;
		Dialog.list.calcCostDialog.functions.refresh();
	});
	gebi("boost-mode").addEventListener("change", () => {
		Dialog.list.calcCostDialog.functions.refresh();
	})

	new Dialog("formatedAddonsImageDialog", "編成画像撮影", `<canvas id="formated-addons-image"></canvas>`, [{ "content": "クリップボードにコピー", "event": `Dialog.list.formatedAddonsImageDialog.functions.copyToClipboard();`, "icon": "tabs" }, { "content": "保存", "event": `Dialog.list.formatedAddonsImageDialog.functions.saveAsFile();`, "icon": "download" }, { "content": "閉じる", "event": `Dialog.list.formatedAddonsImageDialog.off();`, "icon": "close" }], {
		display: function () {
			loader.start();
			setTimeout(() => {
				let formation = Dialog.list.couplingPreviewDialog.functions.currentFormation;

				for (let car of formation) {
					if (!imageFiles.has(car[EMPTYIMAGE_DIRECTIONS[0]].split(".")[0])) {
						Dialog.list.alertDialog.functions.display("画像が指定されていない車両があるため撮影できません。");
						return;
					}
				}

				Dialog.list.formatedAddonsImageDialog.functions.refresh();
				Dialog.list.formatedAddonsImageDialog.on();
				setTimeout(loader.finish, 150);
			}, 0);
		},
		refresh: function () {
			let formation = Dialog.list.couplingPreviewDialog.functions.currentFormation;
			let canvas = document.createElement("canvas");
			canvas.width = PAK_TYPE * 20;
			canvas.height = PAK_TYPE * 20;
			let ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			//車両画像を背景透過して読み込み
			let formationCount = formation.length;
			let inverseFormation = [...formation].reverse();
			let lengths = inverseFormation.map((car) => { return Number(car.length) });
			let totalHeight = Math.floor(lengths.reduce((sum, val) => { return sum + val; }) / 2);
			inverseFormation.forEach((car, i) => {
				let [imgName, imgPositionY, imgPositionX] = getImageNameAndPositionsFromAddon(car);
				let img = getTransparentImage(imgName, imgPositionY, imgPositionX);
				let imgPutPointX = 0;
				for (let j = formationCount - 1; j > i; j--) {
					imgPutPointX += lengths[j];
				}
				ctx.drawImage(img, calcPixelsFromLength(imgPutPointX), Math.floor(calcPixelsFromLength(totalHeight - imgPutPointX / 2)) + PAK_TYPE);
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
				new Message("クリップボードにコピーしました。", ["normal-message"], 3000, true, true);
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
	function calcPixelsFromLength(length) {
		return length * 4;
	}
	function getOffsetValues(position) {
		if (position.indexOf(",") == -1) {
			return [Number(position), 0, 0];
		}
		return position.split(",").map((x) => { return Number(x) });
	}
	function getTransparentImage(imgName, imgPositionY, imgPositionX) {
		let canvas = document.createElement("canvas");
		canvas.width = PAK_TYPE;
		canvas.height = PAK_TYPE;
		[imgPositionX, imgOffsetX, imgOffsetY] = getOffsetValues(imgPositionX);
		let ctx = canvas.getContext("2d");
		ctx.drawImage(imageFiles.get(imgName), PAK_TYPE * imgPositionX, PAK_TYPE * imgPositionY, PAK_TYPE, PAK_TYPE, imgOffsetX, imgOffsetY, PAK_TYPE, PAK_TYPE);
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
		<div class="mku-tab-container" id="help-tab">
			<div class="mku-tab-content" tab-title="概要">
				<h2>このアプリは何？</h2>
				<p>フリー輸送シミュレーションゲーム「Simutrans」のアドオン製作を支援するWebアプリケーションです。</p>
				<p>本アプリでは、Simutransの車両アドオン製作において最も面倒なことの一つ、<strong>連結の設定</strong>を支援します。</p>
				<p>また、メインの機能は連結に関する設定を行うことですが、それ以外のプロパティについても簡易的ながら編集することが可能です。</p>
				<p>このほか、ja.tabを読み込むことで、日本語化後の車両名を確認しながら作業をしたり、日本語名を編集したりすることも可能です。</p>
				<h2>ご注意･免責事項</h2>
				<p>本アプリはサーバとの通信は一切行っておらず、本アプリで製作したデータは皆さんのPC内で完結しています。バックアップ等はご自身の責任において行っていただくようお願いいたします。</p>
				<p>本アプリを利用して出力されるdatファイルは、読み込んだdatファイルの内容のうち、有効な車両についての部分のみとなります。たとえば、車両と建物が同じファイルに記載されていた場合、本アプリでは建物の記述は完全に無視され、出力されるdatファイルには車両のみが記述されます。この他、読み込み中に何らかのエラーが発生した場合も、その部分が正しく出力されない可能性があります。元のdatファイルを本アプリで生成したdatファイルで上書きしてしまうことはせず、元ファイルのバックアップを取っておくことを強くおすすめいたします。</p>
				<h2>謝辞</h2>
				<ul>
				<li>ボタン等の各種アイコンに「<a href="https://kudakurage.com/ligature_symbols/" target="_blank">Ligature Symbols</a>」を利用させていただきました。</li>
				<li>ソートに「<a href="https://github.com/bubkoo/natsort" target="_blank">natsort</a>」を利用させていただきました。</li>
				</ul>
				<p>御礼申し上げます。</p>
			</div>
			<div class="mku-tab-content" tab-title="推奨環境">
				<h2>推奨環境</h2>
				<table class="input-area">
					<tr>
						<td>
							ブラウザ
						</td>
						<td>
							<p>Google Chrome (最新版推奨)</p>
							PCでのご利用を推奨します。スマートフォン等のタッチデバイスでの動作の保証はいたしかねます。
						</td>
					</tr>
					<tr>
						<td>
							画面
						</td>
						<td>
							<p>FHD(1920×1080)以上推奨</p>
							これより小さい画面でご利用の場合、操作がしづらくなる場合があります。そのような場合、ブラウザの拡大率を縮小していただくことで操作がしやすくなります。
						</td>
					</tr>
				</table>
			</div>
			<div class="mku-tab-content" tab-title="コスト計算について">
				<p>本アプリでは、pak128japanの公式コスト計算シートに基づいて車両コスト(cost･runningcost･gear)を計算することが可能です。</p>
				<h2>公式コスト計算式の仕様</h2>
				<p>pak128japanの公式コスト計算シートによると、鉄道車両のコストは編成を組んだ状態で算出することになっております。</p>
				<p>そのため本アプリでは、「連結プレビュー」機能で編成を組成すると、組成した車両を対象にコストを計算することができます。</p>
				<h2>「係数」について</h2>
				<p>pak128japanの公式コスト計算シートに登場する概念で、古い年代の車両ほど大きく、新しい年代の車両ほど小さくなる整数です。</p>
				<p>同じスペックの車両でも、係数が小さいほど安価になります。</p>
				<p>本アプリでは、公式シートから推測した計算式に基づいて、導入年から自動算出します。そのため、本アプリを用いてコスト計算を行う場合、対象車両の「intro_year」プロパティに値が設定されている必要があります。</p>
			</div>
			<div class="mku-tab-content" tab-title="お問い合わせ">
				<p>バグ報告･ご意見･ご要望･ご質問は<a href="https://twitter.com/KasumiTrans" target="_blank">Twitter</a>または<a href="mailto:morooka@kasu.me" target="_blank">メール</a>までお願いいたします。</p>
				<p>なお、バグ報告の際は、症状とともに「読み込んだファイル」「ご利用のOS･ブラウザ」をお伝えいただくと、解決がスムーズになります。お手数ですが、ご協力をお願いいたします。</p>
				<p>変更履歴は<a href="https://github.com/kasu-me/Simutrans-Coupling-Monster" target="_blank">GitHub</a>をご覧ください。</p>
				<p>© 2023 M_Kasumi</p>
			</div>
		</div>
	`, [{ "content": "閉じる", "event": `Dialog.list.helpDialog.off(); `, "icon": "close" }], {}, true);
});
//アドオン名セレクトボックスに値セット
function setAddonNamesToSelectBox(selectBox) {
	selectBox.innerHTML = "";
	for (let addon of masterAddons) {
		let option = document.createElement("option");
		option.value = addon["name"];
		option.innerText = addon["name"];
		selectBox.appendChild(option);
	}
}

//画像ファイル名セレクトボックスに値セット
function setImageNamesToSelectBox(selectBox) {
	selectBox.innerHTML = "";
	for (let imgFileName of imageFileNames) {
		let option = document.createElement("option");
		option.value = imgFileName;
		option.innerText = `${imgFileName}.png`;
		selectBox.appendChild(option);
	}
}

//datプレビュー
function viewDat() {
	if (masterAddons.length != 0) {
		let datText = writeDat();
		Dialog.list.previewDialog.functions.display(datText, "dat");
	} else {
		Dialog.list.alertDialog.functions.display("先にdatファイルを読み込んでください。");
	}
}

//jatabプレビュー
function viewJaTab() {
	if (masterAddons.length != 0) {
		let jaTabText = writeJaTab();
		Dialog.list.previewDialog.functions.display(jaTabText, "ja.tab");
	} else {
		Dialog.list.alertDialog.functions.display("先にdatファイルを読み込んでください。");
	}
}

//アドオンプレビューをセット
function setAddonPreviewImage(target, addon) {
	return setAddonPreviewImageByDirection(target, addon, "s");
}
function setAddonPreviewImageByDirection(target, addon, direction) {
	if (addon == undefined) { return }
	let [imgName, imgPositionY, imgPositionX] = getImageNameAndPositionsFromAddonByDirection(addon, direction);
	let img = imageFiles.get(imgName);

	let div = document.createElement("div");
	div.classList.add("image-container");
	if (img != undefined) {
		div.style.backgroundImage = `url(${img.src})`;
		div.style.backgroundPositionX = `${-imgPositionX * PAK_TYPE}px`;
		div.style.backgroundPositionY = `${-imgPositionY * PAK_TYPE}px`;
	} else {
		div.style.backgroundImage = `url(${NOIMAGE_IMGFILEPATH})`;
		div.classList.add("no-image");
	}
	target.appendChild(div);
	return div;

}

//表示更新
function refresh() {
	let hasNoAddon = masterAddons.length == 0;

	//ボタンの活性制御
	document.querySelectorAll("header .mku-drop-container button").forEach((button, i) => {
		if (i != 0 && button.innerHTML != "新規車両追加" && button.innerHTML != "このアプリについて") {
			button.disabled = hasNoAddon;
		}
	});
	gebi("adding-property-button").disabled = hasNoAddon;
	document.querySelectorAll("header .mku-drop-menu-container").forEach((menuContainer, i) => {
		menuContainer.querySelector("input.mku-drop-menu-checkbox").disabled = menuContainer.querySelectorAll("button:not(:disabled)").length == 0;
	});

	//各種エリアの初期化
	let mainImageContainer = gebi("main-image-container");
	mainImageContainer.innerHTML = "";
	let areas = {
		prev: gebi("constraint-prev"),
		next: gebi("constraint-next"),
	}
	areas.prev.innerHTML = "";
	areas.next.innerHTML = "";
	let propTable = gebi("main-proptable");
	propTable.querySelectorAll("tr").forEach((tr, i) => {
		if (i != 0) {
			propTable.removeChild(tr);
		}
	})
	let jatabInput = gebi("jatabtable-japanese-name");
	jatabInput.innerHTML = "";
	jatabInput.removeAttribute("disabled");
	jatabInput.setAttribute("contenteditable", "plaintext-only");
	setFooterAddonsList();

	//ダイアログを開いている場合の処理
	if (Dialog.list.carListDialog.isActive) {
		Dialog.list.carListDialog.functions.display();
	}

	//車両がない場合の処理
	if (hasNoAddon) {
		jatabInput.setAttribute("disabled", "disabled");
		jatabInput.removeAttribute("contenteditable");
		gebi("carsSelectBox").innerHTML = "";
		return;
	}
	//車両がなければ以下の処理は行わない

	//編集中のアドオンの取得
	let editingAddon = getEditingAddon();
	if (editingAddon == undefined) {
		editingAddon = masterAddons[0];
	}

	//編集中アドオンの画像設定
	let imageContainer = setAddonPreviewImage(mainImageContainer, editingAddon);
	imageContainer.addEventListener("click", () => {
		Dialog.list.editImageDialog.functions.display();
	});

	//前後の連結設定を表示
	let constraints = editingAddon[CONSTRAINT];

	function setArea(mode) {
		if (constraints[mode] != undefined) {
			constraints[mode].forEach((constraint) => {
				if (constraint != "none") {
					setAddonPreviewBox(areas[mode], document.createElement("li"), getObjectByItsName(masterAddons, constraint));
				}
			});
		}
	}
	setArea("prev");
	setArea("next");
	setDragAndDropAddonEvents();

	//選択中のアドオンをハイライト
	gebi("addons-list").querySelectorAll(".draggable-object").forEach((addon) => {
		if (addon.dataset.addonName == editingAddon.name) {
			addon.classList.add("editing");
		} else {
			addon.classList.remove("editing");
		}
	});

	//選択中のアドオンのプロパティを表示
	jatabInput.innerHTML = getJapaneseNameFromAddon(editingAddon);

	for (let prop in editingAddon) {
		if (prop == CONSTRAINT || prop.startsWith(EMPTYIMAGE)) { continue }
		let tr = document.createElement("tr");
		let tdProp = document.createElement("td");
		let tdVal = document.createElement("td");
		let tdController = document.createElement("td");
		let valInput = document.createElement("input");
		tr.appendChild(tdProp);
		tr.appendChild(tdVal);
		tr.appendChild(tdController);
		tdVal.appendChild(valInput);
		propTable.appendChild(tr);
		tdProp.innerHTML = prop;
		valInput.value = editingAddon[prop];
		let isDisabled = prop == "name" || prop == "obj";
		let isRequiredProperty = prop == "name" || prop == "obj" || prop == "length";
		valInput.disabled = isDisabled;
		if (isRequiredProperty) {
			tdController.innerHTML = "※必須";
		} else {
			tdController.innerHTML = `<button class="lsf mku-balloon" mku-balloon-message="プロパティを削除" onclick="deleteProperty('${prop}',this)">delete</button>`;
		}
		valInput.addEventListener("input", () => {
			editingAddon[prop] = valInput.value;
		});
	}
}

function deleteProperty(propName, evtTargetButton) {
	let addon = getEditingAddon();
	Dialog.list.confirmDialog.functions.display(`車両からプロパティ「${propName}」を削除してもよろしいですか？`, () => {
		delete addon[propName];
		if (evtTargetButton != undefined) {
			let tr = evtTargetButton.parentNode.parentNode;
			let table = tr.parentNode;
			table.removeChild(tr);
		}
		new Message(`プロパティを削除しました。`, ["file-saved"], 3000, true, true);
	});
}

//フッタのアドオンリストを表示
function setFooterAddonsList() {
	let addonsList = gebi("addons-list");
	addonsList.innerHTML = "";
	masterAddons.forEach((addon) => {
		setAddonPreviewBox(addonsList, document.createElement("div"), addon);
	});
}

//アドオンプレビューボックス設定
function setAddonPreviewBox(parent, box, addon) {
	box.classList.add("draggable-object");
	if (addon != undefined) {
		setAddonBalloon(box, addon);
		box.dataset.addonName = addon.name;
		let title = document.createElement("p");
		title.innerHTML = addon.name;
		box.appendChild(title);
		if (jatab.has(addon)) {
			let titleJa = document.createElement("p");
			titleJa.innerHTML = jatab.get(addon);
			box.appendChild(titleJa);
		}
		setAddonPreviewImage(box, addon);
	} else {
		box.classList.add("no-drag");
		let error = document.createElement("div");
		error.classList.add("image-container");
		error.innerHTML = "存在しない車両への参照です"
		box.appendChild(error);
	}
	parent.appendChild(box);
}

//アドオンバルーン設定
function setAddonBalloon(target, addon) {
	target.classList.add("mku-balloon");
	target.setAttribute("mku-balloon-message", `<strong>${addon.name}</strong>${getJapaneseNameFromAddon(addon, "", "\n")}`);
}

//アドオンドラッグアンドドロップイベントをセット
function setDragAndDropAddonEvents() {
	let constraintViews = document.querySelectorAll("#constraint-container>div");
	let addonsList = document.querySelectorAll("#addons-list .draggable-object");
	let changeSelect = function (addonName) {
		let selectBox = gebi("carsSelectBox");
		selectBox.value = addonName;
		selectBox.dispatchEvent(new Event("change"));
	}
	Drag.setElements(addonsList, constraintViews, (dragResult, i) => {
		if (dragResult.to >= 0) {
			let targetAddon = getEditingAddon();
			let targetName = targetAddon.name;
			let fromName = dragResult.me.dataset.addonName;
			let fromAddon = getObjectByItsName(masterAddons, fromName);
			if (constraintViews[dragResult.to].classList.contains("constraint-view")) {
				//prevまたはnextにドロップされた場合、連結設定に追加
				targetAddon[CONSTRAINT][constraintViews[dragResult.to].id == "constraint-prev-container" ? "prev" : "next"].add(fromName);
				fromAddon[CONSTRAINT][constraintViews[dragResult.to].id != "constraint-prev-container" ? "prev" : "next"].add(targetName);
			} else {
				//真ん中にドロップされた場合、選択を切り替え
				changeSelect(dragResult.me.dataset.addonName);
			}
			refresh();
		} else if (dragResult.to == -2) {
			changeSelect(dragResult.me.dataset.addonName);
		}
	});

	let deleteDropArea = document.querySelectorAll("#addons-list");
	Drag.setElements(document.querySelectorAll(".constraint-view .draggable-object:not(.no-drag)"), deleteDropArea, (dragResult, i) => {
		if (dragResult.to >= 0) {
			let targetAddon = getEditingAddon();
			let targetName = targetAddon.name;
			let fromName = dragResult.me.dataset.addonName;
			let fromAddon = getObjectByItsName(masterAddons, fromName);
			targetAddon[CONSTRAINT][dragResult.me.parentNode.parentNode.id == "constraint-prev-container" ? "prev" : "next"].delete(fromName);
			fromAddon[CONSTRAINT][dragResult.me.parentNode.parentNode.id != "constraint-prev-container" ? "prev" : "next"].delete(targetName);
			refresh();
		} else if (dragResult.to == -2) {
			changeSelect(dragResult.me.dataset.addonName);
		}
	});

}


//画像指定ダイアログ内のプレビュー更新
function updateViewSelectImageDialogPreviewingImage() {
	gebi("image-file-input").value = "";
	let imagePreview = gebi("selected-image-preview");
	imagePreview.innerHTML = "";
	if (imageFiles.has(imageSelectBox.value)) {
		imagePreview.appendChild(imageFiles.get(imageSelectBox.value));
	} else {
		imagePreview.appendChild(NOIMAGE);
	}
}

//DAT指定
function loadAndSetDatFile(files) {
	let promises = [];
	let droppedImageFiles = [];
	let droppedJaTabFiles = [];
	let notDatFilesCount = 0;
	for (let file of files) {
		if (file.name.toUpperCase().endsWith(".DAT")) {
			promises.push(loadDatFile(file));
		} else if (file.name.toUpperCase().endsWith(".PNG")) {
			//画像ファイルはあとで処理するため別リストに隔離(datが出揃わないことには処理が継続できないため)
			droppedImageFiles.push(file);
		} else if (file.name.toUpperCase().endsWith(".TAB")) {
			//TABファイルはあとで処理するため別リストに隔離(datが出揃わないことには処理が継続できないため)
			droppedJaTabFiles.push(file);
		} else {
			notDatFilesCount++;
		}
	}
	loader.start();
	//全DAT読み込み完了後
	Promise.all(promises).then(() => {
		loader.finish();
		let message = ``;
		if (promises.length == 0) {
			//datファイルが1件もなかった場合
			message = `DATファイルを選択してください。`;
		} else if (promises.length > 0 && masterAddons.length == 0) {
			//datファイルに有効なアドオンがなかった場合
			message = `読み込まれたDATファイルに有効な車両がありませんでした。`;
		} else {
			message = `${promises.length}件のDATファイルから${masterAddons.length}両を読み込みました。${notDatFilesCount > 0 ? `${notDatFilesCount}件のファイルはDATファイルではないため読み込みませんでした。` : ""}`;
		}
		new Message(message, ["dat-file-loaded"], 3000, true, true);
		//DATを1件以上読み込んだら、画像選択ダイアログに遷移する
		if (promises.length > 0 && masterAddons.length > 0) {
			Dialog.list.helloDialog.off();
			//この画面で選択した画像およびjatabを読み込む非同期処理
			Promise.all(
				[
					//画像読み込み
					new Promise((resolve) => {
						loadAndSetImageFile(droppedImageFiles, true).then(() => {
							let notFoundImages = Array.from(imageFileNames).filter(imageFileName => !imageFiles.has(imageFileName));
							if (notFoundImages.length > 0) {
								//画像が不足していれば画像読み込み画面に移動し不足している画像を選択状態にする
								resolve([0, notFoundImages[0]]);
								//
							} else {
								//画像が不足していなければ画像読み込み画面に移動せずメイン画面を表示
								resolve([-1, -2]);
							}
						});
					}),
					//TAB読み込み
					new Promise((resolve) => {
						loadAndSetJaTabFile(droppedJaTabFiles).then(() => {
							resolve();
						});
					}),
				]
			).then((results) => {
				let imgLoadedStatus = results[0][0];
				if (imgLoadedStatus >= 0) {
					let notFoundImages = results[0][1];
					Dialog.list.selectImageDialog.functions.display(notFoundImages);
				} else {
					Dialog.list.openDatFileDialog.off();
				}
			});
			refresh();
			Dialog.list.openDatFileDialog.off();
		}
	});
}
//画像指定
function loadAndSetImageFile(files, forceAttachMode) {
	let promises = [];
	let failureCount = 0;
	let notImageFilesCount = 0;
	if (files.length == 1 && !Boolean(forceAttachMode)) {
		//個別指定モード(セレクトボックスで選択されているアドオンに対する画像ファイルとして設定)
		if (files[0].name.toUpperCase().endsWith(".PNG")) {
			promises.push(appendImageToImagesList(gebi("imageSelectBox").value, files[0]));
		} else {
			notImageFilesCount++;
		}
	} else {
		//アタッチモード(DATから参照されている画像に対する画像ファイルとして同名の画像ファイルを設定)
		for (let file of files) {
			if (file.name.toUpperCase().endsWith(".PNG")) {
				//ファイル名で検索し、datに記述のあるファイル名なら設定
				let pureFileName = removeExtention(file.name)
				if (imageFileNames.has(pureFileName)) {
					promises.push(appendImageToImagesList(pureFileName, file));
				} else {
					failureCount++;
				}
			} else {
				notImageFilesCount++;
			}
		};
	}
	loader.start();
	//全PNG読み込み後
	return Promise.all(promises).then(() => {
		loader.finish();
		let message = ``;
		message = `${promises.length}件のPNGファイルを読み込みました。${failureCount > 0 ? `${failureCount}件のPNGファイルはDATから参照されていないため読み込みませんでした。` : ""}${notImageFilesCount > 0 ? `${notImageFilesCount}件のファイルはPNGファイルではないため読み込みませんでした。` : ""}`;
		new Message(message, ["image-file-loaded"], 3000, true, true);
		updateViewSelectImageDialogPreviewingImage();
		if (Dialog.list.editImageDialog.isActive) {
			Dialog.list.editImageDialog.functions.refresh();
		} else {
			refresh();
		}
	});
}

//jatab指定
function loadAndSetJaTabFile(files) {
	let promises = [];
	let notTabFilesCount = 0;
	let jaTabText = "";
	for (let file of files) {
		if (file.name.toUpperCase().endsWith(".TAB")) {
			promises.push(appendJaTab(file));
		} else {
			notTabFilesCount++;
		}
	}
	loader.start();
	//全TAB読み込み後
	return Promise.all(promises).then((count) => {
		loader.finish();
		let message = ``;
		if (count.length != 0) {
			message = `${count.reduce((sum, val) => sum + val)}両の車両に日本語名を適用しました。${notTabFilesCount > 0 ? `${notTabFilesCount}件のファイルはTABファイルではないため読み込みませんでした。` : ""}`;
			new Message(message, ["tab-file-loaded"], 3000, true, true);
		} else if (notTabFilesCount > 0) {
			message = `${notTabFilesCount > 0 ? `${notTabFilesCount}件のファイルはTABファイルではないため読み込みませんでした。` : ""}`;
			new Message(message, ["tab-file-loaded"], 3000, true, true);
		}
		updateViewSelectImageDialogPreviewingImage();
		refresh();
	});
}

//ファイルドラッグアンドドロップイベントをセット
function setDragAndDropFileEvents(target, callback) {
	target.addEventListener('dragover', function (e) {
		e.stopPropagation();
		e.preventDefault();
		target.classList.add("drag-target");
		e.dataTransfer.dropEffect = 'copy';
	}, false);
	target.addEventListener('dragleave', function (e) {
		target.classList.remove("drag-target");
	}, false);
	target.addEventListener('drop', function (e) {
		e.stopPropagation();
		e.preventDefault();
		target.classList.remove("drag-target");
		var files = e.dataTransfer.files;
		callback(files);
	}, false);
}

window.addEventListener("load", () => {
	reset(); refresh();

	//ドラッグアンドドロップの整備
	let dropDatFileArea = gebi("dat-file-drop-area");
	setDragAndDropFileEvents(dropDatFileArea, loadAndSetDatFile);

	let dragImageFileArea = gebi("selected-image-preview");
	setDragAndDropFileEvents(dragImageFileArea, loadAndSetImageFile);

	let dragJaTabFileArea = gebi("jatab-file-drop-area");
	setDragAndDropFileEvents(dragJaTabFileArea, loadAndSetJaTabFile);

	//車両選択セレクトボックスのイベント
	let carsSelectBox = gebi("carsSelectBox");
	carsSelectBox.addEventListener("change", () => {
		refresh();
	});

	//日本語名指定イベント
	let jatabInput = gebi("jatabtable-japanese-name");
	jatabInput.addEventListener("input", () => {
		if (jatabInput.innerText.trim() == "") {
			jatab.delete(getEditingAddon())
		} else {
			jatab.set(getEditingAddon(), jatabInput.innerText);
		}
	});
	jatabInput.addEventListener("keydown", (e) => {

		if (e.key === 'Enter') {
			return e.preventDefault()
		}
	})

	//画像指定セレクトボックスのイベント
	let imageSelectBox = gebi("imageSelectBox");
	imageSelectBox.addEventListener("change", () => updateViewSelectImageDialogPreviewingImage());

	//画像ファイル選択のイベント
	gebi("image-file-input").addEventListener('change', function (e) {
		loadAndSetImageFile(e.target.files);
	});

	//初期画面を開く
	Dialog.list.helloDialog.functions.display();
});
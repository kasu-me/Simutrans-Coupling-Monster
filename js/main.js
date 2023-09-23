let gebi = x => document.getElementById(x);
//
let masterDatFileName = "";
//datをJSオブジェクト化したもの
let masterAddons = [];
//現在読み込み中のデータ内で使用されている画像ファイル名
let imageFileNames = new Set();
//現在読み込み中のデータ内で使用されている画像ファイル名をキーとした画像オブジェクト
let imageFiles = new Map();
//アドオンをキーとするjatabデータ
let jatab = new Map();

//固定値
//画像なし画像
const NOIMAGE_IMGFILEPATH = "./img/noimage.png";
const NOIMAGE = new Image();
NOIMAGE.src = NOIMAGE_IMGFILEPATH;
NOIMAGE.classList.add("noimage");
//datファイル定型句
const CONSTRAINT = "constraint";
const EMPTYIMAGE = "emptyimage";
const DIRECTIONS = ["s", "e", "se", "sw", "n", "w", "nw", "ne"];
const EMPTYIMAGE_DIRECTIONS = DIRECTIONS.map(x => `${EMPTYIMAGE}[${x}]`);
//pakタイプ
const PAK_TYPE = 128;

//拡張子削除
function removeExtention(fileName) {
	return fileName.slice(fileName, fileName.lastIndexOf("."));
}

//リセット
function reset() {
	resetDat();
	imageFileNames = new Set();
	imageFiles = new Map();
	jatab = new Map();
	gebi("image-file-input").value = "";
	[
		gebi("carsSelectBox"),
		gebi("imageSelectBox"),
		gebi("constraint-prev"),
		gebi("constraint-next"),
		gebi("main-image-container"),
		gebi("selected-image-preview"),
	].forEach((elem) => { elem.innerHTML = "" });
}

function resetDat() {
	masterDatFileName = "";
	masterAddons = [];
}

//ファイル読み込み
function readFile(file, resolve, reject) {
	var fr = new FileReader();
	fr.readAsText(file);
	fr.onload = function () {
		resolve(fr.result.replace(/\r/g, ""));
	}
}

//オブジェクト配列からname属性でオブジェクトを検索
function searchObjectsByItsName(obj, name) {
	return obj.filter(x => x.name == name)
}

//現在編集中のアドオンを取得
function getEditingAddon() {
	let selectBox = gebi("carsSelectBox");
	return searchObjectsByItsName(masterAddons, selectBox.value)[0];
}

//アドオンから日本語名を取得
function getJapaneseNameFromAddon(addon, unsetString, prefix) {
	return jatab.has(addon) ? `${prefix != undefined ? prefix : ""}${jatab.get(addon)}` : unsetString != undefined ? unsetString : "";
}

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

//datファイル読み込み
function loadDatFile(file) {
	return new Promise((resolve) => {
		masterDatFileName = file.name;
		new Promise((resolve, reject) => {
			readFile(file, resolve, reject);
		}).then((dat) => {
			dat = dat.replace(/-{3,}/g, "---");
			let vehicles = dat.split("---").filter(data => data != "");
			for (let i in vehicles) {
				//空白行スキップ
				if (vehicles[i].trim() == "") { continue }
				//コメント行スキップ
				if (vehicles[i].trim().startsWith("#")) { continue }
				masterAddons.push({});
				masterAddons.at(-1)[CONSTRAINT] = {
					prev: new Set(),
					next: new Set()
				};
				let lines = vehicles[i].split("\n");
				for (let j in lines) {
					let line = lines[j];
					if (line.trim() == "") { continue }
					let [prop, val] = line.split("=");
					let propName = prop.toLowerCase();
					if (propName.startsWith(EMPTYIMAGE)) {
						//画像ファイル指定の場合
						imageFileNames.add(val.split(".")[0]);
					}
					if (propName.startsWith(CONSTRAINT)) {
						//連結設定の場合
						let mode = propName.startsWith(`${CONSTRAINT}[prev]`) ? "prev" : "next";
						masterAddons.at(-1)[CONSTRAINT][mode].add(val);
					} else {
						masterAddons.at(-1)[prop.toLowerCase()] = val;
					}
				}
				//名前が存在しない場合、または乗り物でない場合、アドオンを追加しない
				if (masterAddons.at(-1)["name"] == undefined || masterAddons.at(-1)["obj"] == undefined || masterAddons.at(-1)["obj"].toLowerCase() != "vehicle") {
					masterAddons.pop();
				}
			}
			setAddonNamesToSelectBox(gebi("carsSelectBox"));
			setImageNamesToSelectBox(gebi("imageSelectBox"));
			resolve();
		});
	});
}

//dat出力
function writeDat() {
	let dat = "";
	masterAddons.forEach((addon) => {
		let datConstraints = "";
		for (let prop in addon) {
			if (prop == CONSTRAINT) {
				for (let mode in addon[prop]) {
					let constraints = Array.from(addon[prop][mode]);
					constraints.forEach((constraint, i) => {
						datConstraints += `${prop}[${mode}][${i}]=${constraint}\n`;
					})
				}
			} else {
				dat += `${prop}=${addon[prop]}\n`;
			}
		}
		dat += datConstraints;
		dat += `---\n`;
	});
	return dat;
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

//jatab出力
function writeJaTab() {
	let tab = "§###########################################################\n";
	jatab.forEach((japaneseName, addon) => {
		tab += `${addon.name}\n`;
		tab += `${japaneseName}\n`;
	})
	return tab
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

//ファイル保存
function saveFile(type) {
	if (masterAddons.length != 0) {
		let text = type == "dat" ? writeDat() : writeJaTab();
		let fileName = type == "dat" ? masterDatFileName : "ja.tab";
		if (type == "ja.tab" && jatab.size == 0) {
			new Message("日本語化ファイルは内容が存在しないため保存しませんでした。", ["file-saved"], 3000, true, true);
		} else {
			downloadFile(text, fileName);
		}
	} else {
		Dialog.list.alertDialog.functions.display("先にdatファイルを読み込んでください。");
	}
}
function downloadFile(text, fileName) {
	let blob = new Blob([text], { type: "text/plan" });
	let link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = fileName;
	link.click();
}

//アドオンから代表画像名･表示位置を取得
function getImageNameAndPositionsFromAddon(addon) {
	return getImageNameAndPositionsFromAddonByDirection(addon, "s");
}
function getImageNameAndPositionsFromAddonByDirection(addon, direction) {
	return addon[`${EMPTYIMAGE}[${direction}]`].split(".");
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

	document.querySelectorAll(".button-group button").forEach((button, i) => {
		if (i != 0 && button.innerHTML != "このアプリについて") {
			button.disabled = hasNoAddon;
		}
	});

	if (hasNoAddon) {
		return;
	}

	let editingAddon = getEditingAddon();
	if (editingAddon == undefined) { return }

	//編集中アドオンの画像設定
	let mainImageContainer = gebi("main-image-container");
	mainImageContainer.innerHTML = "";
	let imageContainer = setAddonPreviewImage(mainImageContainer, editingAddon);
	imageContainer.addEventListener("click", () => {
		Dialog.list.editImageDialog.functions.display();
	});

	//前後の連結設定を表示
	let areas = {
		prev: gebi("constraint-prev"),
		next: gebi("constraint-next"),
	}
	areas.prev.innerHTML = "";
	areas.next.innerHTML = "";

	let constraints = editingAddon[CONSTRAINT];

	function setArea(mode) {
		if (constraints[mode] != undefined) {
			constraints[mode].forEach((constraint) => {
				if (constraint != "none") {
					setAddonPreviewBox(areas[mode], document.createElement("li"), searchObjectsByItsName(masterAddons, constraint)[0]);
				}
			});
		}
	}
	setArea("prev");
	setArea("next");
	setFooterAddonsList();
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
	let propTable = gebi("main-proptable");
	propTable.querySelectorAll("tr").forEach((tr, i) => {
		if (i != 0) {
			propTable.removeChild(tr);
		}
	})
	let jatabInput = gebi("jatabtable-japanese-name");
	jatabInput.innerHTML = getJapaneseNameFromAddon(editingAddon);

	for (let prop in editingAddon) {
		if (prop == CONSTRAINT || prop.startsWith(EMPTYIMAGE)) { continue }
		let tr = document.createElement("tr");
		let tdProp = document.createElement("td");
		let tdVal = document.createElement("td");
		let valInput = document.createElement("input");
		tdProp.innerHTML = prop;
		valInput.value = editingAddon[prop];
		valInput.disabled = prop == "name";
		valInput.addEventListener("input", () => {
			editingAddon[prop] = valInput.value;
		});
		tr.appendChild(tdProp);
		tr.appendChild(tdVal);
		tdVal.appendChild(valInput);
		propTable.appendChild(tr);
	}
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
			let fromAddon = searchObjectsByItsName(masterAddons, fromName)[0];
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
	Drag.setElements(document.querySelectorAll(".constraint-view .draggable-object"), deleteDropArea, (dragResult, i) => {
		if (dragResult.to >= 0) {
			let targetAddon = getEditingAddon();
			let targetName = targetAddon.name;
			let fromName = dragResult.me.dataset.addonName;
			let fromAddon = searchObjectsByItsName(masterAddons, fromName)[0];
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
	resetDat();
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
			message = `DATファイルを選択してください。`;
		} else {
			message = `${promises.length}件のDATファイルを読み込みました。${notDatFilesCount > 0 ? `${notDatFilesCount}件のファイルはDATファイルではないため読み込みませんでした。` : ""}`;
		}
		new Message(message, ["dat-file-loaded"], 3000, true, true);
		//DATを1件以上読み込んだら、画像選択ダイアログに遷移する
		if (promises.length > 0) {
			//この画面で選択した画像およびjatabを読み込む非同期処理
			Promise.all(
				[
					//画像読み込み
					new Promise((resolve) => {
						loadAndSetImageFile(droppedImageFiles, true).then(() => {
							if (droppedImageFiles.length > 0) {
								let notFoundImages = Array.from(imageFileNames).filter(imageFileName => !imageFiles.has(imageFileName));
								if (notFoundImages.length > 0) {
									//画像が不足していれば画像読み込み画面に移動し不足している画像を選択状態にする
									resolve([0, notFoundImages[0]]);
									//
								} else {
									//画像が不足していなければ画像読み込み画面に移動せずメイン画面を表示
									resolve([-1, -2]);
								}
							} else {
								//画像が読み込まれていなければ画像読み込み画面に移動
								resolve([-1, -1]);
							}
						});
					}),
					//DAT読み込み
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
//画像をリストに登録
function appendImageToImagesList(fileName, file) {
	return new Promise((resolve) => {
		let image = new Image();
		image.onload = () => {
			imageFiles.set(fileName, image);
			resolve();
		};
		const reader = new FileReader();
		reader.onload = () => image.src = reader.result;
		reader.readAsDataURL(file);
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
			message = `${count.reduce((sum, val) => sum + val)}件の車両に日本語名を適用しました。${notTabFilesCount > 0 ? `${notTabFilesCount}件のファイルはTABファイルではないため読み込みませんでした。` : ""}`;
			new Message(message, ["tab-file-loaded"], 3000, true, true);
		} else if (notTabFilesCount > 0) {
			message = `${notTabFilesCount > 0 ? `${notTabFilesCount}件のファイルはTABファイルではないため読み込みませんでした。` : ""}`;
			new Message(message, ["tab-file-loaded"], 3000, true, true);
		}
		updateViewSelectImageDialogPreviewingImage();
		refresh();
	});
}
//jatabをリストに登録
function appendJaTab(file) {
	return new Promise((resolve) => {
		new Promise((resolve, reject) => {
			readFile(file, resolve, reject);
		}).then((tab) => {
			let count = 0;
			let tabs = tab.split("\n").map(x => x.trim()).filter(x => x != "");
			//アドオンに対してマッチするものがあればjatabマスタデータに追加
			masterAddons.forEach((addon) => {
				let name = addon.name;
				let index = tabs.indexOf(name);
				if (index != -1 && tabs[index + 1].trim() != "") {
					jatab.set(addon, tabs[index + 1]);
					count++;
				}
			})
			resolve(count);
		});
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

	//dat選択画面を開く
	Dialog.list.openDatFileDialog.functions.display();
});
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
//datのみリセット
function resetDat() {
	masterDatFileName = "";
	masterAddons = [];
	//連結プレビューダイアログ内の編成を解消
	Dialog.list.couplingPreviewDialog.functions.currentFormation = [];
}

//ファイル読み込み
function readFile(file, resolve, reject) {
	var fr = new FileReader();
	fr.readAsText(file);
	fr.onload = function () {
		resolve(fr.result.replace(/\r/g, ""));
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

//オブジェクト配列からname属性でオブジェクトを検索
function getObjectsByItsName(obj, name) {
	return obj.filter(x => x.name == name)
}
function getObjectByItsName(obj, name) {
	return getObjectsByItsName(obj, name)[0];
}

//現在編集中のアドオンを取得
function getEditingAddon() {
	let selectBox = gebi("carsSelectBox");
	return getObjectByItsName(masterAddons, selectBox.value);
}

//アドオンから日本語名を取得
function getJapaneseNameFromAddon(addon, unsetString, prefix) {
	return jatab.has(addon) ? `${prefix != undefined ? prefix : ""}${jatab.get(addon)}` : unsetString != undefined ? unsetString : "";
}

//アドオンから代表画像名･表示位置を取得
function getImageNameAndPositionsFromAddon(addon) {
	return getImageNameAndPositionsFromAddonByDirection(addon, "s");
}
function getImageNameAndPositionsFromAddonByDirection(addon, direction) {
	return addon[`${EMPTYIMAGE}[${direction}]`].split(".");
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
				//空白アドオンスキップ
				if (vehicles[i].trim() == "") { continue }
				masterAddons.push({});
				masterAddons.at(-1)[CONSTRAINT] = {
					prev: new Set(),
					next: new Set()
				};
				let lines = vehicles[i].split("\n");
				let isJatabExists = false;
				let oldAddon = {};
				for (let j in lines) {
					let line = lines[j];
					//空行スキップ
					if (line.trim() == "") { continue }
					//コメント行スキップ
					if (line.trim().startsWith("#")) { continue }
					let [prop, val] = line.split("=");
					let propName = prop.toLowerCase();
					if (propName == "name" && getObjectsByItsName(masterAddons, val).length > 0) {
						//jatabにレタッチしなおすため、オブジェクトを記録
						isJatabExists = true;
						oldAddon = getObjectByItsName(masterAddons, val);
						//名称指定の場合かつ、同名の車両が既に存在する場合、上書きするため、既存のアドオンを削除する
						masterAddons = masterAddons.filter(x => x.name != val);
					}
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
				//全プロパティ読み込み完了後
				//名前が存在しない場合、または乗り物でない場合、lengthが指定されていない場合、アドオンを追加しない
				if (masterAddons.at(-1)["name"] == undefined || masterAddons.at(-1)["obj"] == undefined || masterAddons.at(-1)["obj"].toLowerCase() != "vehicle" || masterAddons.at(-1)["length"] == undefined) {
					masterAddons.pop();
				}
				//jatabの読み込みなおし
				if (isJatabExists && jatab.has(oldAddon)) {
					jatab.set(masterAddons.at(-1), jatab.get(oldAddon));
					jatab.delete(oldAddon);
				}
			}
			setAddonNamesToSelectBox(gebi("carsSelectBox"));
			setImageNamesToSelectBox(gebi("imageSelectBox"));
			resolve();
		});
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

//jatab出力
function writeJaTab() {
	let tab = "§###########################################################\n";
	jatab.forEach((japaneseName, addon) => {
		tab += `${addon.name}\n`;
		tab += `${japaneseName}\n`;
	})
	return tab
}

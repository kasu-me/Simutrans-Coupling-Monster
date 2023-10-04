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

function addImageFileNameToMasterFromDat(propName, val) {
	imageFileNames.add(val.split(".")[0]);
	//内包表記的なやつの場合
	if (propName.indexOf(",") != -1) {
		propName.split("[")[1].split(",").map(x => x.trim().split("]")[0]).forEach((direction, i) => {
			masterAddons.at(-1)[`${EMPTYIMAGE}[${direction}]`] = val.replace(/<\$0>/g, i);
		});
		return false;
	}
	return true;
}

//マスタアドオンに空の車両を追加
function addEmptyCarToAddon(master) {
	master.push({});
	master.at(-1)[CONSTRAINT] = {
		prev: new Set(),
		next: new Set()
	};
}

//マスタアドオンに新規車両を追加
function addCarToMaster(name, imgFileName, imgFilePositionY, length) {
	//todo:nameの重複チェック
	addEmptyCarToAddon(masterAddons);
	masterAddons.at(-1).name = name;
	masterAddons.at(-1).obj = "vehicle";
	masterAddons.at(-1).length = length;
	addImageFileNameToMasterFromDat("", imgFileName);
	EMPTYIMAGE_DIRECTIONS.forEach((direction, i) => {
		masterAddons.at(-1)[direction] = `${imgFileName}.${imgFilePositionY}.${i}`;
	});

	setAddonNamesToSelectBox(gebi("carsSelectBox"));
	setImageNamesToSelectBox(gebi("imageSelectBox"));
}

//マスタアドオンから車両を削除
function deleteCarFromMaster(addon) {
	for (let i in masterAddons) {
		if (addon.name == masterAddons[i].name) {
			deleteCarFromMasterById(i);
			break;
		}
	}
}
function deleteCarFromMasterByName(addonName) {
	for (let i in masterAddons) {
		if (addonName == masterAddons[i].name) {
			deleteCarFromMasterById(i);
			break;
		}
	}
}
function deleteCarFromMasterById(id) {
	masterAddons.splice(id, 1);
	//削除した際、連結プレビューの連結も解除する
	Dialog.list.couplingPreviewDialog.functions.currentFormation = [];
}

//datファイルからマスタアドオンに読み込み
function loadDatFile(file) {
	return new Promise((resolve) => {
		masterDatFileName = file.name;
		new Promise((resolve, reject) => {
			readFile(file, resolve, reject);
		}).then((dat) => {
			let tmpAddons = [];
			let tmpConstraints = {};
			dat = dat.replace(/-{3,}/g, "---");
			let vehicles = dat.split("---").filter(data => data != "");
			for (let i in vehicles) {
				//連結設定 あとでオブジェクトに変換するが、現時点では名前を格納する
				let tmpConstraint = { next: new Set(), prev: new Set() };

				//空白アドオンスキップ
				if (vehicles[i].trim() == "") { continue }
				addEmptyCarToAddon(tmpAddons);
				let lines = vehicles[i].split("\n");
				let isJatabExists = false;
				let oldAddon = {};
				for (let j in lines) {
					let line = lines[j];
					//空行スキップ
					if (line.trim() == "") { continue }
					//コメント行スキップ
					if (line.trim().startsWith("#")) { continue }

					//プロパティ整形
					let [prop, val] = line.split("=");
					let propName = prop.toLowerCase();

					//あとで使うためのデータ処理
					if (propName == "name" && getObjectsByItsName(masterAddons, val).length > 0) {
						//jatabにレタッチしなおすため、オブジェクトを記録
						isJatabExists = true;
						oldAddon = getObjectByItsName(masterAddons, val);
						//名称指定の場合かつ、同名の車両が既に存在する場合、上書きするため、既存のアドオンを削除する
						masterAddons = masterAddons.filter(x => x.name != val);
					}
					if (propName.startsWith(EMPTYIMAGE)) {
						//画像ファイル指定の場合
						if (!addImageFileNameToMasterFromDat(propName, val)) {
							continue;
						}
					}

					//プロパティ投入
					if (propName.startsWith(CONSTRAINT)) {
						//連結設定の場合
						let mode = propName.startsWith(`${CONSTRAINT}[prev]`) ? "prev" : "next";
						tmpAddons.at(-1)[CONSTRAINT][mode].add(val);
						continue;
					} else {
						//連結設定以外の場合
						tmpAddons.at(-1)[prop.toLowerCase()] = val;
						continue;
					}
				}
				//全プロパティ読み込み完了後
				//名前が存在しない場合、または乗り物でない場合、lengthが指定されていない場合、アドオンを追加しない
				if (tmpAddons.at(-1)["name"] == undefined || tmpAddons.at(-1)["obj"] == undefined || tmpAddons.at(-1)["obj"].toLowerCase() != "vehicle" || tmpAddons.at(-1)["length"] == undefined) {
					tmpAddons.pop();
				} else {
					tmpConstraints[tmpAddons.at(-1)["name"]] = tmpConstraint;
				}
				//jatabの読み込みなおし
				if (isJatabExists && jatab.has(oldAddon)) {
					jatab.set(tmpAddons.at(-1), jatab.get(oldAddon));
					jatab.delete(oldAddon);
				}

			}

			resolve(tmpAddons);
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
						datConstraints += `${prop}[${mode}][${i}]=${constraint.name}\n`;
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

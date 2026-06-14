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
		let fileName = type == "dat" ? (masterDatFileName == "" ? "newfile" : masterDatFileName) : "ja.tab";
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

//反転表示で参照する画像プロパティキー(s方向)。反転画像があればそれ、なければ通常画像
function getReverseDisplayImageKey(addon) {
	let reverseKey = REVERSE_FREIGHTIMAGE_DIRECTIONS[0];
	return addon[reverseKey] != undefined ? reverseKey : EMPTYIMAGE_DIRECTIONS[0];
}
//編成表示用の画像データ[name,y,x]を取得。useReverse時は反転画像(未設定なら通常画像)
function getFormationImageData(addon, useReverse) {
	return addon[useReverse ? getReverseDisplayImageKey(addon) : EMPTYIMAGE_DIRECTIONS[0]].split(".");
}

function addImageFileNameToMasterFromDat(propName, val) {
	imageFileNames.add(val.split(".")[0]);
	//内包表記的なやつの場合
	if (propName.includes(",")) {
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
	if (getObjectsByItsName(masterAddons, name).length > 0) {
		return false;
	}
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
	return true;
}

//マスタアドオンから車両を削除
function deleteCarFromMasterByName(addonName) {
	for (let i in masterAddons) {
		if (addonName == masterAddons[i].name) {
			deleteCarFromMasterById(i);
			break;
		}
	}
}
function deleteCarFromMasterById(id) {
	let addon = masterAddons[id];
	for (let i in masterAddons) {
		masterAddons[i][CONSTRAINT]["prev"].delete(addon);
		masterAddons[i][CONSTRAINT]["next"].delete(addon);
	}
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
			dat = dat.replace(/-{3,}/g, "---");
			let vehicles = dat.split("---").filter(data => data != "");
			for (let i in vehicles) {
				//空白アドオンスキップ
				if (vehicles[i].trim() == "") { continue }
				addEmptyCarToAddon(tmpAddons);
				let lines = vehicles[i].split("\n");
				let isAddonExists = false;
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

					//名称指定の場合かつ、同名の車両が既に存在する場合、あとで使うためのデータ処理
					if (propName == "name" && getObjectsByItsName(masterAddons, val).length > 0) {
						//jatabおよび連結設定をレタッチしなおすため、オブジェクトを記録
						isAddonExists = true;
						oldAddon = getObjectByItsName(masterAddons, val);
						//上書きするため、既存のアドオンを削除する
						masterAddons = masterAddons.filter(x => x.name != val);
					}
					if (propName.startsWith(EMPTYIMAGE)) {
						//画像ファイル指定の場合
						if (!addImageFileNameToMasterFromDat(propName, val)) {
							continue;
						}
					}
					//反転時画像種別(freightimagetype[n])の処理 ※freightimageより前方一致するため先に判定
					let freightImageTypeMatch = propName.match(/^freightimagetype\[(\d+)\]$/);
					if (freightImageTypeMatch) {
						//index0,1は保存時に再生成するため破棄。2以上(No_Electric等)のみ保全
						if (Number(freightImageTypeMatch[1]) >= 2) {
							tmpAddons.at(-1)[propName] = val;
						}
						continue;
					}
					//積載/反転時画像(freightimage[n][dir])の処理
					let freightImageMatch = propName.match(/^freightimage\[(\d+)\]\[(\w+)\]$/);
					if (freightImageMatch) {
						//index0は保存時にemptyimageから再生成するため破棄
						if (Number(freightImageMatch[1]) == 0) {
							continue;
						}
						//index1(反転)および2以上(No_Electric)は画像名を登録のうえ保持
						imageFileNames.add(val.split(".")[0]);
						tmpAddons.at(-1)[propName] = val;
						continue;
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
				}
				//jatabの読み込みなおし
				if (isAddonExists && jatab.has(oldAddon)) {
					jatab.set(tmpAddons.at(-1), jatab.get(oldAddon));
					jatab.delete(oldAddon);
				}
				//連結設定のやりなおし
				if (isAddonExists) {
					let checkAddon = (addon, mode) => {
						if (addon[CONSTRAINT][mode].has(oldAddon)) {
							addon[CONSTRAINT][mode].delete(oldAddon);
							addon[CONSTRAINT][mode].add(tmpAddons.at(-1));
						}
					}
					masterAddons.forEach((addon) => {
						checkAddon(addon, "prev");
						checkAddon(addon, "next");
					});
				}

			}

			resolve(tmpAddons);
		});
	});
}

//名前(文字列)で指定されている連結設定をオブジェクトに変換
let convertConstraintsToObject = (addon, mode, regExp) => {
	addon[CONSTRAINT][mode] = new Set(Array.from(addon[CONSTRAINT][mode]).map(constraint => {
		if (typeof constraint == "string") {
			//文字列の場合
			if (constraint.toLowerCase() == "none") {
				//連結設定「無」用車両をセット
				return ADDON_NONE;
			} else {
				let name = constraint;
				if (regExp != undefined) {
					//正規表現で車両名を変更する場合
					//正規表現で変換後の名前
					name = name.replace(...regExp);
					let targetAddon;
					let obj = getObjectsByItsName(masterAddons, name);
					if (obj.length == 0) {
						//正規表現で変換後の名前の車両が存在しない場合、元の名前の車両を返す
						targetAddon = getObjectByItsName(masterAddons, constraint);
					} else {
						//正規表現で変換後の名前の車両が存在した場合、その車両を返す
						targetAddon = obj[0];
					}
					//対象車両側の連結設定にも自身を設定して整合性を担保する
					targetAddon[CONSTRAINT][mode == "next" ? "prev" : "next"].add(addon);
					return targetAddon;
				} else {
					return getObjectByItsName(masterAddons, name);
				}
			}
		} else {
			return constraint;
		}
	}));
}

//画像を変更
function changeImage(addon, newImageFileName) {
	DIRECTIONS.forEach((dir, i) => {
		let y = getImageNameAndPositionsFromAddonByDirection(addon, dir)[1];
		addon[EMPTYIMAGE_DIRECTIONS[i]] = `${newImageFileName}.${y}.${i}`
	})
}

//反転画像のファイル名を変更(設定済み方向のみ、位置y/xは維持)
function changeReverseImage(addon, newImageFileName) {
	REVERSE_FREIGHTIMAGE_DIRECTIONS.forEach((key) => {
		if (addon[key] != undefined) {
			let positions = addon[key].split(".");
			addon[key] = `${newImageFileName}.${positions[1]}.${positions[2]}`;
		}
	});
}

//画像をリストに登録
function appendImageToImagesList(fileName, file) {
	imageFileNames.add(fileName);
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
//反転時画像作成支援: 色変換ユーティリティ
//"#rrggbb" → [r,g,b]
function hexToRgb(hex) {
	return [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
}
//[r,g,b] → "#rrggbb"
function rgbToHex(rgb) {
	return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
}

//色置換した結果の canvas を生成する
//image       : 元画像(スプライトシート全体)の HTMLImageElement
//colorPairs  : [{ from:[r,g,b], to:[r,g,b] }, ...]
//targetBlocks: Set<"col,row"> 置換対象の128pxブロック
function createColorReplacedCanvas(image, colorPairs, targetBlocks) {
	let canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	let ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0);
	let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	let data = imageData.data;
	for (let p = 0; p < data.length; p += 4) {
		if (data[p + 3] === 0) { continue; }				//透明ピクセルは対象外
		let pixelIndex = p / 4;
		let px = pixelIndex % canvas.width;
		let py = Math.floor(pixelIndex / canvas.width);
		let block = `${Math.floor(px / PAK_TYPE)},${Math.floor(py / PAK_TYPE)}`;
		if (!targetBlocks.has(block)) { continue; }			//対象外ブロックはスキップ
		for (let pair of colorPairs) {
			if (data[p] === pair.from[0] && data[p + 1] === pair.from[1] && data[p + 2] === pair.from[2]) {
				data[p] = pair.to[0];
				data[p + 1] = pair.to[1];
				data[p + 2] = pair.to[2];
				break;										//1ピクセルにつき最初の一致のみ適用
			}
		}
	}
	ctx.putImageData(imageData, 0, 0);
	return canvas;
}

//canvas を imageFiles / imageFileNames に登録する
function registerCanvasAsImage(fileName, canvas) {
	return new Promise((resolve) => {
		canvas.toBlob((blob) => {
			appendImageToImagesList(fileName, blob).then(resolve);
		});
	});
}

//canvas を PNG としてダウンロードする
function downloadCanvas(canvas, fileName) {
	let link = document.createElement("a");
	link.href = canvas.toDataURL();
	link.download = `${fileName}.png`;
	link.click();
}

//キャッシュ済み ImageData から (x,y) のピクセル色 [r,g,b] を取得
function getPixelColorFromImageData(imageData, x, y) {
	let p = (y * imageData.width + x) * 4;
	return [imageData.data[p], imageData.data[p + 1], imageData.data[p + 2]];
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
				//freightimage/freightimagetypeは専用ブロックで生成するためスキップ
				if (prop.startsWith(FREIGHTIMAGE)) { continue }
				if (addon[prop].trim?.() == "") { continue }
				dat += `${prop}=${addon[prop]}\n`;
			}
		}
		//反転時画像(OTRP編成反転)ブロックを出力
		dat += generateReverseImageDat(addon);
		dat += datConstraints;
		dat += `---\n`;
	});
	return dat;
}

//反転時画像(OTRP編成反転)のdat記述を生成
function generateReverseImageDat(addon) {
	//No_Electric等(index>=2)の保全分を収集
	let rawTypes = "";
	let rawImages = "";
	for (let prop in addon) {
		let typeMatch = prop.match(/^freightimagetype\[(\d+)\]$/);
		if (typeMatch && Number(typeMatch[1]) >= 2) {
			rawTypes += `${prop}=${addon[prop]}\n`;
			continue;
		}
		let imageMatch = prop.match(/^freightimage\[(\d+)\]\[(\w+)\]$/);
		if (imageMatch && Number(imageMatch[1]) >= 2) {
			rawImages += `${prop}=${addon[prop]}\n`;
		}
	}
	//反転画像が設定されている方向
	let hasReverseImage = REVERSE_FREIGHTIMAGE_DIRECTIONS.some(key => addon[key] != undefined);
	if (!hasReverseImage) {
		//反転画像なし → No_Electric等の保全分のみ出力
		return rawTypes + rawImages;
	}
	let dat = "";
	let freight = addon.freight != undefined && addon.freight.trim() != "" ? addon.freight : "Passagiere";
	dat += `freightimagetype[0]=${freight}\n`;
	dat += `freightimagetype[1]=Reverse\n`;
	dat += rawTypes;
	//FreightImage[0] = EmptyImage(全8方向 / 存在するもののみ)
	DIRECTIONS.forEach((dir, i) => {
		let emptyKey = EMPTYIMAGE_DIRECTIONS[i];
		if (addon[emptyKey] != undefined) {
			dat += `${getFreightImageKey(0, dir)}=${addon[emptyKey]}\n`;
		}
	});
	//FreightImage[1] = 反転画像(設定済み方向のみ)
	REVERSE_FREIGHTIMAGE_DIRECTIONS.forEach((key) => {
		if (addon[key] != undefined) {
			dat += `${key}=${addon[key]}\n`;
		}
	});
	dat += rawImages;
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

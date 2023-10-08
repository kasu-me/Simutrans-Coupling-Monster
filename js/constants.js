let gebi = document.getElementById.bind(document);
//datファイル名
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
//空のアドオン
const ADDON_NONE = { name: "none" };
//datファイル定型句
const CONSTRAINT = "constraint";
const EMPTYIMAGE = "emptyimage";
const DIRECTIONS = ["s", "e", "se", "sw", "n", "w", "nw", "ne"];
const DIRECTION_ARROWS = ["↙", "↘", "↓", "←", "↗", "↖", "↑", "→"];
const EMPTYIMAGE_DIRECTIONS = DIRECTIONS.map(x => `${EMPTYIMAGE}[${x}]`);
//pakタイプ
const PAK_TYPE = 128;

//各種プロパティと日本語名称の対応
const FORMULAIC_PHRASE_FOR_DAT_PROP_WHOLE = {
	length: "車体長",
	obj: "種類",
	copyright: "作者",
	intro_year: "導入年",
	intro_month: "導入月",
	retire_year: "引退年",
	retire_month: "引退月",
	waytype: "走行環境種別",
	engine_type: "動力種別",
	freight: "貨物",
	runningcost: "運行費",
	cost: "購入費",
	speed: "最高速度",
	payload: "最大積載量",
	weight: "自重",
	gear: "ギア比",
	power: "出力",
	smoke: "煙",
	sound: "音",
	loading_time: "積載時間",
};
const FORMULAIC_PHRASE_FOR_DAT_PROP = {
	copyright: "作者",
	intro_year: "導入年",
	intro_month: "導入月",
	retire_year: "引退年",
	retire_month: "引退月",
	waytype: "走行環境種別",
	engine_type: "動力種別",
	freight: "貨物",
	runningcost: "運行費",
	cost: "購入費",
	speed: "最高速度",
	payload: "最大積載量",
	weight: "自重",
	gear: "ギア比",
	power: "出力",
	smoke: "煙",
	sound: "音",
	loading_time: "積載時間",
};
//各種プロパティと対応する定型句の組み合わせ
const FORMULAIC_PHRASE_FOR_DAT_VAL = {
	waytype: {
		road: "自動車",
		track: "鉄道",
		tram_track: "路面電車",
		air: "航空機",
		water: "船舶",
		monorail_track: "モノレール",
		maglev_track: "リニア",
		narrowgauge_track: "ナローゲージ",
	},
	engine_type: {
		steam: "蒸気機関",
		diesel: "ディーゼル",
		electric: "電気(架線給電)",
		bio: "動物",
		sail: "帆走",
		fuel_cell: "燃料電池",
		hydrogene: "水素燃料",
		battery: "蓄電池",
	},
	freight: {
		Passagiere: "二等旅客",
		Post: "一等旅客",
	},
};
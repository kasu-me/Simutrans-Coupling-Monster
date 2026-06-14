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
const FREIGHTIMAGE = "freightimage";
const FREIGHTIMAGETYPE = "freightimagetype";
const DIRECTIONS = ["s", "e", "se", "sw", "n", "w", "nw", "ne"];
const DIRECTION_ARROWS = ["↙", "↘", "↓", "←", "↗", "↖", "↑", "→"];
const EMPTYIMAGE_DIRECTIONS = DIRECTIONS.map(x => `${EMPTYIMAGE}[${x}]`);
//反転時画像(OTRP編成反転機能)。freightimage[1]が反転時画像のインデックス
const REVERSE_IMAGE_TYPE_INDEX = 1;
//freightimage[typeIndex][direction]形式のプロパティキーを生成
function getFreightImageKey(typeIndex, direction) {
	return `${FREIGHTIMAGE}[${typeIndex}][${direction}]`;
}
//反転時画像の各方向プロパティキー (freightimage[1][s] ...)
const REVERSE_FREIGHTIMAGE_DIRECTIONS = DIRECTIONS.map(x => getFreightImageKey(REVERSE_IMAGE_TYPE_INDEX, x));
//pakタイプ
const PAK_TYPE = 128;

//反転時画像作成支援機能で使用する既定ファイル名サフィックス
const REVERSE_IMAGE_SUFFIX = "_reverse";

//Simutrans 特殊色プリセット(色ペアの from / to 双方で選択可能)
//透過色 #E7FFFF は既存の透過キーカラー RGB(231,255,255)(getTransparentImage 参照)と同一
const SPECIAL_COLOR_PRESETS = [
	{
		category: "透過色",
		description: "ゲーム中では透過され表示されない",
		colors: ["#E7FFFF"],
	},
	{
		category: "プレイヤーカラー",
		description: "ゲーム中では各プレイヤーの色に置き換えられる",
		colors: [
			"#244B67", "#395E7C", "#4C7191", "#6084A7", "#7497BD", "#88ABD3", "#9CBEE9", "#B0D2FF",
			"#7B5803", "#8E6F04", "#A18605", "#B49D07", "#C6B408", "#D9CB0A", "#ECE20B", "#FFF90D",
		],
	},
	{
		category: "発光色",
		description: "夜間に暗くならない色",
		colors: [
			"#01DD01", "#FF211D", "#FFFF53", "#7F9BF1", "#C1B1D1", "#57656F", "#E3E3FF", "#4D4D4D",
			"#FF017F", "#0101FF", "#6B6B6B", "#9B9B9B", "#B3B3B3", "#C9C9C9", "#DFDFDF",
		],
	},
];

//各種プロパティと日本語名称の対応
const FORMULAIC_PHRASE_FOR_DAT_PROP_WHOLE = {
	length: "車体長",
	obj: "アドオン種類",
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
const FORMULAIC_PHRASE_FOR_DAT_PROP = Object.assign({}, FORMULAIC_PHRASE_FOR_DAT_PROP_WHOLE);
const NOT_VALIABLE_PROPERTIES_LIST = ["obj", "length"];
NOT_VALIABLE_PROPERTIES_LIST.forEach((prop) => {
	delete FORMULAIC_PHRASE_FOR_DAT_PROP[prop];
})

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
	length: {
		11: "18m級",
		12: "20m級",
	},
};
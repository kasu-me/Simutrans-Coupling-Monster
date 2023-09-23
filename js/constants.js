let gebi = x => document.getElementById(x);
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
//datファイル定型句
const CONSTRAINT = "constraint";
const EMPTYIMAGE = "emptyimage";
const DIRECTIONS = ["s", "e", "se", "sw", "n", "w", "nw", "ne"];
const EMPTYIMAGE_DIRECTIONS = DIRECTIONS.map(x => `${EMPTYIMAGE}[${x}]`);
//pakタイプ
const PAK_TYPE = 128;
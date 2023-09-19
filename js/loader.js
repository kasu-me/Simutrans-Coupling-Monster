let loader = {
	//読み込み
	start: function () {
		gebi("main-loader").classList.remove("off");
	},
	//読み込み終了
	finish: function () {
		gebi("main-loader").classList.add("off");
	}
};

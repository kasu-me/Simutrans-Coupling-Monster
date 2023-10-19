let loader = {
	list: [],
	//読み込み
	start: function (key) {
		if (key != undefined) {
			this.list.push(key);
		}
		gebi("main-loader").classList.remove("off");
	},
	//読み込み終了
	finish: function (key) {
		if (key != undefined) {
			let index = this.list.indexOf(key);
			if (index != -1) {
				this.list.splice(index, 1);
			}
			if (this.list.length > 0) {
				return
			}
		}
		gebi("main-loader").classList.add("off");
	}
};

window.addEventListener("load", function () {
	//アラート:alrt
	new Dialog("alertDialog", "警告", `<img src="./js/img/alert.svg" class="dialog-icon"><div id="alrt-main"></div>`, [{ "content": "OK", "event": `Dialog.list.alertDialog.off()`, "icon": "check" }], {
		display: function (message) {
			gebi("alrt-main").innerHTML = message;
			Dialog.list.alertDialog.on();
			Dialog.list.alertDialog.buttons.querySelector("button[icon='check']").focus();
		}
	}, true);

	//確認:cnfm
	new Dialog("confirmDialog", "確認", `<img src="./js/img/confirm.svg" class="dialog-icon"><div id="cnfm-main"></div>`, [{ "content": "OK", "event": `Dialog.list.confirmDialog.functions.callback(); Dialog.list.confirmDialog.off()`, "icon": "check" }, { "content": "NO", "event": `Dialog.list.confirmDialog.off(); Dialog.list.confirmDialog.functions.interruption(); `, "icon": "close" }], {
		display: function (message, callback, interruption) {
			gebi("cnfm-main").innerHTML = message;
			Dialog.list.confirmDialog.functions.callback = callback || function () { };
			Dialog.list.confirmDialog.functions.interruption = interruption || function () { };
			Dialog.list.confirmDialog.on();
			Dialog.list.confirmDialog.buttons.querySelector("button[icon='check']").focus();
		},
		callback: function () { },
		interruption: function () { }
	}, true);

	//情報:info
	new Dialog("infoDialog", "情報", `<img src="./js/img/info.svg" class="dialog-icon"><div id="info-main"></div>`, [{ "content": "OK", "event": `Dialog.list.infoDialog.off()`, "icon": "close" }], {
		display: function (message) {
			gebi("info-main").innerHTML = message;
			Dialog.list.infoDialog.on();
			Dialog.list.infoDialog.buttons.querySelector("button[icon='check']").focus();
		}
	}, true);
});
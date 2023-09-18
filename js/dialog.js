class Dialog {
	static area = document.createElement("div");
	static areaOverlay = document.createElement("div");
	static list = {};

	id;
	dialogTitle;
	dialog;
	mainMessage;
	buttons;
	functions = {};
	isOverlay = false;
	background;

	//new Dialog("ID","タイトル","本文",[{"event":"ボタン1のイベント","content":"ボタン1の本文"},{"event":"ボタン2のイベント","content":"ボタン2の本文"},...],{関数,関数,...},重ねがけするかどうか);
	constructor(id, dialogTitle, message, buttons, functions, isOverlay) {
		this.dialog = document.createElement("div");
		if (dialogTitle != "") {
			this.dialogTitle = document.createElement("p");
			this.dialogTitle.classList.add("dialog-title");
			this.dialogTitle.innerHTML = dialogTitle;
			this.dialog.appendChild(this.dialogTitle);

			//ドラッグ移動
			this.dialogTitle.addEventListener("mousedown", (event) => {
				this.dialogTitle.style.cursor = "grabbing";
				let offsetX = event.clientX - this.dialog.getBoundingClientRect().left;
				let offsetY = event.clientY - this.dialog.getBoundingClientRect().top;

				let movePosition = (pageX, pageY) => {
					this.dialog.style.left = `${pageX - offsetX}px`;
					this.dialog.style.top = `${pageY - offsetY - window.scrollY}px`;
				}
				let mouseMove = (event) => {
					movePosition(event.pageX, event.pageY);
				}

				document.addEventListener("mousemove", mouseMove);

				document.addEventListener("mouseup", () => {
					document.removeEventListener('mousemove', mouseMove);
					this.dialogTitle.style.cursor = "grab";
				}, { once: true });

			});
		}
		this.mainMessage = document.createElement("div");
		this.mainMessage.classList.add("dialog-main-message");
		this.buttons = document.createElement("p");
		this.buttons.classList.add("dialog-foot-buttons-container");
		this.setContents(message, buttons);
		this.dialog.appendChild(this.mainMessage);
		this.dialog.appendChild(this.buttons);
		this.dialog.setAttribute("id", id);
		this.dialog.setAttribute("class", "dialog-content off");

		this.functions = functions || this.functions;
		if (this.functions.display == undefined) {
			this.functions.display = () => {
				this.on();
			}
		}

		this.isOverlay = isOverlay || this.isOverlay;

		if (this.isOverlay) {
			this.background = document.createElement("div");
			this.background.classList.add("dialog-area");
			this.background.appendChild(this.dialog);
			Dialog.areaOverlay.appendChild(this.background);
		} else {
			Dialog.area.appendChild(this.dialog);
		}
		Dialog.list[id] = this;
	}
	setContents(message, buttons) {
		this.setMessage(message);
		this.setButtons(buttons);
	}
	setMessage(message) {
		this.mainMessage.innerHTML = message;
	}
	setButtons(buttons) {
		let buttonContent = "";
		for (let i in buttons) {
			//データ整形
			if (buttons[i]["icon"] == undefined || buttons[i]["icon"] == null) {
				buttons[i]["icon"] = "";
			}
			let button = document.createElement("button");
			button.classList.add("dialog-main-button");
			button.innerHTML = buttons[i]["content"];
			for (let j in buttons[i]) {
				button.setAttribute("onclick", buttons[i]["event"]);
				if (j == "content" || j == "event") {
					continue;
				} else if (j == "icon") {
					button.setAttribute("icon", buttons[i]["icon"]);
					button.classList.add("lsf-icon");
				} else if (j == "class") {
					button.classList.add(buttons[i][j]);
				} else {
					button.setAttribute(j, buttons[i][j]);
				}
				this.buttons.appendChild(button);
			}
		}
	}
	on() {
		let isActiveInFirstTime = this.isActive;
		if (!this.isOverlay) {
			Dialog.offAll();
			Dialog.displayDialogArea();
		} else {
			Dialog.displayDialogAreaOverlay();
			Dialog.open(this.background);
		}
		Dialog.open(this.dialog);
		if (!isActiveInFirstTime) {
			this.dialog.style.top = "";
			this.dialog.style.left = `${(window.innerWidth - this.dialog.getBoundingClientRect().width) / 2}px`;
		}
	}
	off() {
		if (!this.isOverlay) {
			Dialog.closeDialogArea();
		} else {
			Dialog.closeDialogAreaOverlay();
			Dialog.close(this.background);
		}
		Dialog.close(this.dialog);
	}
	get isActive() {
		return this.dialog.classList.contains("on");
	}
	static offAll() {
		Dialog.closeDialogArea();
		for (let i of document.querySelectorAll(".dialog-content")) {
			Dialog.close(i);
		}
	}
	static displayDialogArea() {
		Dialog.open(Dialog.area);
	}
	static displayDialogAreaOverlay() {
		Dialog.open(Dialog.areaOverlay);
	}
	static closeDialogArea() {
		Dialog.close(Dialog.area);
	}
	static closeDialogAreaOverlay() {
		Dialog.close(Dialog.areaOverlay);
	}
	static open(div) {
		div.classList.remove("off");
		div.classList.add("on");
	}
	static close(div) {
		div.classList.remove("on");
		div.classList.add("off");
	}
}

window.addEventListener("load", function () {
	Dialog.area.id = "dialog-area";
	Dialog.area.classList.add("dialog-area");
	document.body.appendChild(Dialog.area);
	Dialog.areaOverlay.id = "dialog-area-overlay";
	Dialog.areaOverlay.classList.add("dialog-area-overlay");
	document.body.appendChild(Dialog.areaOverlay);
});
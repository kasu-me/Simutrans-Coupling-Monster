class Message {
	static fadeInTime = 300;
	message;
	mainMessage;
	timeout;
	isDisposable = false;
	constructor(mainMessage, classNames, timeout, isImmediate, isDisposable) {
		this.mainMessage = mainMessage;
		this.timeout = timeout + Message.fadeInTime;

		this.message = document.createElement("div");
		this.message.classList.add("message-content");
		classNames.forEach((className) => { this.message.classList.add(className); });
		this.message.innerHTML = this.mainMessage;

		let closeButton = document.createElement("a");
		closeButton.innerHTML = "×";
		closeButton.addEventListener("click", () => {
			this.off();
		});
		this.message.appendChild(closeButton);

		document.body.appendChild(this.message);

		if (isImmediate) {
			this.on();
			this.isDisposable = isDisposable;
		}
	}

	on() {
		this.message.classList.remove("off");
		this.message.classList.add("on");
		setTimeout(this.off.bind(this), this.timeout);
	}
	off() {
		this.message.classList.add("off");
		if (this.isDisposable && document.body.contains(this.message)) {
			setTimeout(() => { document.body.removeChild(this.message) }, Message.fadeInTime);
		}
	}
}

window.addEventListener("load", function () {
});
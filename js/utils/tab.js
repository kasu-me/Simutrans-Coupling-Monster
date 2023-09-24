window.addEventListener("load", () => {
	document.querySelectorAll(".mku-tab-container").forEach((tab) => {
		let defaultOpen = null;
		let tabId = tab.id;
		let labelArea = document.createElement("div");
		labelArea.classList.add("mku-tab-label-container");
		tab.prepend(labelArea);
		tab.querySelectorAll(".mku-tab-content").forEach((tabContent) => {
			let tabContentContainer = document.createElement("div");
			tabContentContainer.classList.add("mku-tab-content-container");
			tabContentContainer.appendChild(tabContent);
			tab.appendChild(tabContentContainer);

			let label = document.createElement("label");
			label.setAttribute("for", `mku-tab-${tabId}-${tabContent.getAttribute("tab-title")}`);
			label.innerHTML = tabContent.getAttribute("tab-title");
			labelArea.appendChild(label);

			let input = document.createElement("input");
			input.setAttribute("type", "radio");
			input.setAttribute("class", "mku-tab-radio");
			input.setAttribute("id", `mku-tab-${tabId}-${tabContent.getAttribute("tab-title")}`);
			input.setAttribute("name", tabId);
			tabContentContainer.prepend(input);

			if (tabContent.getAttribute("default") != null) {
				defaultOpen = input;
			}
			input.addEventListener("change", function () {
				this.parentNode.parentNode.querySelectorAll(".mku-tab-label-container label").forEach((label) => {
					label.classList.remove("on");
				});
				this.parentNode.parentNode.querySelector(`.mku-tab-label-container label[for="${this.id}"]`).classList.add("on");
			});
		});
		if (defaultOpen == null) {
			Tab.open(tab.querySelector(".mku-tab-content-container input[type='radio'].mku-tab-radio"));
		} else {
			Tab.open(defaultOpen);
		}
	});
});
class Tab {
	static open(input) {
		input.click();
	}
}
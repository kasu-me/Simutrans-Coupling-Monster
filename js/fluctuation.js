window.addEventListener("load", function () {
	let selectAreas = document.querySelectorAll(".selectbox-fluctuation-button");
	let createButton = (selectBox, mode, evt) => {
		let button = this.document.createElement("button");
		button.classList.add("fluctuation-button");
		button.classList.add("lsf");
		button.disabled = selectBox.disabled;
		button.innerHTML = mode;
		button.addEventListener("click", evt);
		return button;
	}
	selectAreas.forEach((selectArea) => {
		let selectBox = selectArea.querySelector("select");
		let decrementButton = createButton(selectBox, "left", () => {
			let i = selectBox.selectedIndex - 1;
			selectBox.selectedIndex = i < 0 ? selectBox.length - 1 : i;
			selectBox.dispatchEvent(new Event("change"));
		});
		let incrementButton = createButton(selectBox, "right", () => {
			let i = selectBox.selectedIndex + 1;
			selectBox.selectedIndex = i % selectBox.length;
			selectBox.dispatchEvent(new Event("change"));
		});
		selectArea.prepend(decrementButton);
		selectArea.appendChild(incrementButton);
	});

	const observer = new MutationObserver((mutations) => {
		for (let mutation of mutations) {
			if (mutation.target.tagName == "SELECT" && mutation.target.parentNode.classList.contains("selectbox-fluctuation-button")) {
				mutation.target.parentNode.querySelectorAll("button.fluctuation-button").forEach((button) => {
					button.disabled = mutation.target.disabled;
				});
			}
		}
	});
	observer.observe(document.body, { childList: true, subtree: true, attributes: true });
});
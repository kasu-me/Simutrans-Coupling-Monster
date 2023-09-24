window.addEventListener("load", function () {
	let selectAreas = document.querySelectorAll(".selectbox-fluctuation-button");
	selectAreas.forEach((selectArea) => {
		let selectBox = selectArea.querySelector("select");
		let decrementButton = this.document.createElement("button");
		decrementButton.classList.add("fluctuation-button");
		decrementButton.classList.add("lsf");
		decrementButton.disabled = selectBox.disabled;
		decrementButton.innerHTML = "left";
		decrementButton.addEventListener("click", () => {
			let i = selectBox.selectedIndex - 1;
			selectBox.selectedIndex = i < 0 ? selectBox.length - 1 : i;
			selectBox.dispatchEvent(new Event("change"));
		});
		let incrementButton = this.document.createElement("button");
		incrementButton.classList.add("fluctuation-button");
		incrementButton.classList.add("lsf");
		incrementButton.disabled = selectBox.disabled;
		incrementButton.innerHTML = "right";
		incrementButton.addEventListener("click", () => {
			let i = selectBox.selectedIndex + 1;
			selectBox.selectedIndex = i % selectBox.length;
			selectBox.dispatchEvent(new Event("change"));
		});
		selectArea.prepend(decrementButton);
		selectArea.appendChild(incrementButton);
	})
});
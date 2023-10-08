
function setSuggestionBox(input, dropdown, dataset) {
	setDatasetToSuggestionBox(input, dropdown, dataset);
	input.addEventListener("focusin", () => {
		dropdown.style.top = `${input.getBoundingClientRect().top + input.clientHeight}px`;
		dropdown.classList.add("on");
	});
	input.addEventListener("focusout", () => {
		if (dropdown.querySelectorAll("div:hover").length == 0) {
			dropdown.classList.remove("on");
		}
	});
	input.addEventListener("input", () => {
		dropdown.querySelectorAll("div").forEach((button) => {
			if (button.dataset.dataName.toUpperCase() == input.value.toUpperCase()) {
				button.classList.add("selected");
			} else {
				button.classList.remove("selected");
			}
		});
	});
}
function setDatasetToSuggestionBox(input, dropdown, dataset) {
	dropdown.innerHTML = "";
	for (let dataName in dataset) {
		let button = document.createElement("div");
		button.innerText = `${dataset[dataName]} (${dataName})`;
		button.dataset.dataName = dataName;
		button.addEventListener("click", () => {
			input.value = dataName;
			input.dispatchEvent(new Event("input"));
			dropdown.classList.remove("on");
		});
		dropdown.appendChild(button);
	}
	input.dispatchEvent(new Event("input"));
}
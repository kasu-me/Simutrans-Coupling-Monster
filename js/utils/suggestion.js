function setSuggestionBox(input, dropdown, dataset) {
	setDatasetToSuggestionBox(input, dropdown, dataset);
	let scroll = () => {
		if (!dropdown.matches(":hover")) {
			hideSuggestionDropdown();
			input.addEventListener("click", showSuggestionDropdown, { once: true });
		}
	};
	let windowResized = () => {
		hideSuggestionDropdown();
		input.addEventListener("click", showSuggestionDropdown, { once: true });
	};
	let showSuggestionDropdown = () => {
		dropdown.style.top = `${input.getBoundingClientRect().top + input.clientHeight + 1}px`;
		dropdown.style.minWidth = `${input.getBoundingClientRect().width}px`;
		dropdown.classList.add("on");
		document.addEventListener("wheel", scroll);
		window.addEventListener("resize", windowResized);
	}
	let hideSuggestionDropdown = () => {
		if (dropdown.querySelectorAll("div:hover").length == 0) {
			dropdown.classList.remove("on");
			document.removeEventListener("wheel", scroll);
			window.removeEventListener("resize", windowResized);
		}
	}

	input.addEventListener("focusin", showSuggestionDropdown);
	input.addEventListener("focusout", hideSuggestionDropdown);

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
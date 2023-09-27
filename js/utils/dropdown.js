window.addEventListener("load", () => {
	let dropContainers = document.querySelectorAll(".mku-drop-menu-container");
	dropContainers.forEach((dropContainer) => {
		let checkBox = document.createElement("input");
		checkBox.setAttribute("type", "checkbox");
		checkBox.classList.add("mku-drop-menu-checkbox")
		dropContainer.appendChild(checkBox);
		if (dropContainer.classList.contains("mouseover")) {
			let stayOpen = false;
			dropContainer.addEventListener("mouseenter", () => {
				checkBox.checked = true;
			});
			dropContainer.addEventListener("mouseleave", () => {
				if (!stayOpen) {
					checkBox.checked = false;
				}
			});
			dropContainer.querySelector(".mku-drop-parent-button").addEventListener("click", () => {
				stayOpen = !stayOpen;
				if (!stayOpen && checkBox.checked) {
					checkBox.checked = false;
				} else if (stayOpen && !checkBox.checked) {
					checkBox.checked = true;
				}
			});
		} else {
			dropContainer.querySelector(".mku-drop-parent-button").addEventListener("click", () => {
				checkBox.click();
			});
		}
	});
});


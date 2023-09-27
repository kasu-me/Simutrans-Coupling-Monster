window.addEventListener("load", () => {
	let dropContainers = document.querySelectorAll(".mku-drop-menu-container");
	dropContainers.forEach((dropContainer) => {
		let checkBox = document.createElement("input");
		checkBox.setAttribute("type", "checkbox");
		checkBox.classList.add("mku-drop-menu-checkbox")
		dropContainer.appendChild(checkBox);
		dropContainer.querySelector(".mku-drop-parent-button").addEventListener("click", () => {
			checkBox.click();
		});
		if (dropContainer.classList.contains("mouseover")) {
			dropContainer.addEventListener("mouseenter", () => {
				checkBox.checked = true;
			});
			dropContainer.addEventListener("mouseleave", () => {
				checkBox.checked = false;
			});
		}
	});
});


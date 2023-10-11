window.addEventListener("load", () => {
	document.querySelector("#constraint-container > div:nth-child(2)").addEventListener("contextmenu", (e) => {
		if (masterAddons.length > 0) {
			turnOnContext(gebi("main-context-menu"), e);
		}
	});
});


function turnOnContext(contextMenu, e) {
	e.preventDefault();
	contextMenu.style.left = `${e.clientX}px`;
	contextMenu.style.top = `${e.clientY}px`;
	contextMenu.classList.add("on");
	window.addEventListener("click", () => {
		contextMenu.classList.remove("on");
	}, { once: true });
}
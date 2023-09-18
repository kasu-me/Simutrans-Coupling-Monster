window.addEventListener("keydown", (e) => {
	if (e.ctrlKey) {
		if (e.key == "s") {
			e.preventDefault();
			saveDat();
		} else if (e.key == "o") {
			e.preventDefault();
			Dialog.list.openDatFileDialog.functions.display();
		}
	}
});
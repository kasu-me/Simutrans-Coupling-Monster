window.addEventListener("keydown", (e) => {
	if (e.ctrlKey) {
		if (e.key == "s") {
			e.preventDefault();
			saveFile('dat');
			saveFile('ja.tab');
		} else if (e.key == "o") {
			e.preventDefault();
			Dialog.list.openDatFileDialog.functions.display();
		}
	}
});
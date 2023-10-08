//表+チェックボックスで行選択
function setTableCheckboxEvents(tableContainer, buttons) {
	//全件選択チェックボックス
	let selectAllCheckBox = tableContainer.querySelector("tr td input[type='checkbox']");
	//各行のチェックボックス
	let checkboxes = tableContainer.querySelectorAll("tr:not(:nth-child(1)) td input[type='checkbox']");
	//最後にチェックした行
	let lastCheckedRow = -1;
	//各行のステータスに応じてボタンの活性･非活性を切り替え
	let switchElementsByCheckedStatus = () => {
		let checkedAtLeastOnce = false;
		let checkedAll = true;
		for (let i of checkboxes) {
			if (i.checked) {
				checkedAtLeastOnce = true;
			} else {
				checkedAll = false;
			}
		}
		buttons.forEach((button) => {
			button.disabled = !checkedAtLeastOnce;
		});
		if (checkedAll) {
			selectAllCheckBox.checked = true;
		}
	}
	//全選択チェックボックスのイベント
	selectAllCheckBox.addEventListener("click", () => {
		tableContainer.querySelectorAll("tr:not(:nth-child(1)) input[type='checkbox']").forEach((checkbox) => {
			checkbox.checked = selectAllCheckBox.checked;
		});
		switchElementsByCheckedStatus();
	});

	//各行チェックボックスのイベント
	checkboxes.forEach((checkBox) => {
		checkBox.addEventListener("click", () => {
			if (!checkBox.checked) {
				selectAllCheckBox.checked = false;
			}
			lastCheckedRow = findElementIndex(tableContainer.querySelectorAll("tr:not(:nth-child(1)) td input[type='checkbox']"), checkBox);
			switchElementsByCheckedStatus();
		});
	});

	//各行をクリックでチェックボックスをチェック
	tableContainer.querySelectorAll("tr:not(:nth-child(1)) td:not(:first-child):not(:last-child)").forEach((td) => {
		td.addEventListener("click", (e) => {
			if (e.shiftKey && lastCheckedRow != -1) {
				window.getSelection().removeAllRanges();
				let checkboxes = tableContainer.querySelectorAll("tr:not(:nth-child(1)) td input[type='checkbox']");
				let thisCheckBoxIndex = findElementIndex(checkboxes, td.parentNode.querySelector("input[type='checkbox']"));
				let start = Math.min(lastCheckedRow, thisCheckBoxIndex);
				let end = Math.max(lastCheckedRow, thisCheckBoxIndex);
				let direction = checkboxes[lastCheckedRow].checked;
				checkboxes[lastCheckedRow].click();
				for (let i = start; i <= end; i++) {
					if (checkboxes[i].checked != direction) {
						checkboxes[i].click();
					}
				}
			} else {
				td.parentNode.querySelector("input[type='checkbox']").click();
			}
			window.getSelection().removeAllRanges();
		});
	});

	let findElementIndex = (from, target) => {
		return [].slice.call(from).indexOf(target);
	};
	switchElementsByCheckedStatus();
}
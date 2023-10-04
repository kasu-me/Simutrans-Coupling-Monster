class Drag {
	static dragContainer;
	static setElements(targetElements, observedElements, callbackFunc) {
		targetElements.forEach((elem, i) => {
			let dragResult = { "me": elem, "to": -1 };
			elem.addEventListener("mousedown", (e) => {
				elem.classList.add("selected-origin");

				Drag.dragContainer.style.width = `${elem.clientWidth + 3}px`;
				Drag.dragContainer.style.height = `${elem.clientHeight + 3}px`;

				Drag.dragContainer.style.top = `${elem.getBoundingClientRect().top + window.scrollY}px`;
				Drag.dragContainer.style.left = `${elem.getBoundingClientRect().left}px`;

				let offsetX = e.clientX - elem.getBoundingClientRect().left;
				let offsetY = e.clientY - elem.getBoundingClientRect().top;

				let startX = e.clientX;
				let startY = e.clientY;

				Drag.dragContainer.innerHTML = elem.innerHTML;

				document.body.appendChild(Drag.dragContainer);

				let moveMouse = (e) => {
					let x = e.clientX - offsetX;
					let y = e.clientY - offsetY + window.scrollY;
					Drag.dragContainer.style.left = `${x}px`;
					Drag.dragContainer.style.top = `${y}px`;

					dragResult.to = -1;
					observedElements.forEach((elem, i) => {
						elem.classList.add("drag-target-candidate");
						elem.classList.remove("drag-target");
						let elemL = elem.getBoundingClientRect().left;
						let elemR = elemL + elem.clientWidth;
						let elemT = elem.getBoundingClientRect().top;
						let elemB = elemT + elem.clientHeight;
						if (elemL < e.clientX && e.clientX < elemR && elemT < e.clientY && e.clientY < elemB) {
							elem.classList.add("drag-target");
							dragResult.to = i;
						}
					});
				};
				document.addEventListener("mousemove", moveMouse);
				document.addEventListener("mouseup", (e) => {
					document.removeEventListener("mousemove", moveMouse);
					document.body.removeChild(Drag.dragContainer);
					targetElements.forEach((elem) => {
						elem.classList.remove("selected-origin");
					});
					observedElements.forEach((elem) => {
						elem.classList.remove("drag-target");
						elem.classList.remove("drag-target-candidate");
					});
					if (e.clientX == startX && e.clientY == startY) {
						dragResult.to = -2;
					}
					callbackFunc(dragResult, i);
				}, { once: true });
			});
		});
	}
}
Drag.dragContainer = document.createElement("div");
Drag.dragContainer.id = "drag-container";
Drag.dragContainer.classList.add("draggable-object");
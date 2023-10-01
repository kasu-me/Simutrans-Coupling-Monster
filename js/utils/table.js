//テーブル生成クラス
class Table {
	#rows = [];
	#title = null;
	#subtitle = null;
	#border = 0;
	#attrs = {};
	#maxCellCount = 0;
	constructor(title, subtitle) {
		this.setTitle(title);
		this.setSubtitle(subtitle);
	}
	//最期の行のセル数
	get cellCountOfLastRow() {
		if (this.#rows.length == 0) { return 0 }
		return this.#rows.at(-1).length;
	}
	//最後の行にセルを追加
	addCell(html, attrs) {
		this.addCellTo(this.#rows.length - 1, html, attrs);
	}
	//n行目にセルを追加
	addCellTo(n, html, attrs) {
		this.addCellInto(n, this.#rows[n].length, html, attrs);
	}
	//n行目m列にセルを追加
	addCellInto(n, m, html, attrs) {
		this.#rows[n].splice(m, 0, new Cell(html, attrs));
		if (this.#rows[n].length > this.#maxCellCount) {
			this.#maxCellCount = this.#rows[n].length;
		}
	}
	//行を追加
	addRow() {
		this.#rows.push([]);
	}
	//全行の一番右に空白のセルを追加して揃える
	addBlankCellToRowRightEnd() {
		this.addBlankCellToRowIn(0);
	}
	//全行の一番右からx番目に空白のセルを追加して揃える
	addBlankCellToRowIn(x, withOutTop) {
		withOutTop = withOutTop == undefined ? false : withOutTop;
		for (let n in this.#rows) {
			if (withOutTop && n == 0) { continue; }
			if (this.#rows[n].length < this.#maxCellCount) {
				for (let i = this.#rows[n].length; i < this.#maxCellCount; i++) {
					this.addCellInto(n, this.#rows[n].length - x, "");
				}
			}
		}
	}
	//タイトルを設定
	setTitle(title) {
		this.#title = title;
	}
	setSubtitle(subtitle) {
		this.#subtitle = subtitle;
	}
	//罫線を設定
	setBorder(n) {
		this.#border = n;
	}
	//その他属性を設定 ({"属性名":"属性値", ...})
	setAttributes(attrs) {
		for (let attr in attrs) {
			this.#attrs[attr] = attrs[attr];
		}
	}
	get maxCellCount() {
		return this.#maxCellCount;
	}

	get rows() {
		return this.#rows;
	}

	//表HTMLを生成
	generateTable() {
		let html = `<div class="generated-table-container"><div class="generated-table-headers">`;
		html += this.#title != null ? `<p class="table-title">${this.#title}</p>` : "";
		html += this.#subtitle != null ? `<p class="table-subtitle">${this.#subtitle}</p>` : "";
		html += `</div><table border="${this.#border}"${Attribute.generateHTML(this.#attrs)}>`;
		for (let i in this.#rows) {
			html += `<tr>`;
			for (let j in this.#rows[i]) {
				html += `<td${this.#rows[i][j].attibutes}>${this.#rows[i][j].HTML}</td>`;
			}
			html += `</tr>`;
		}
		html += `</table></div>`;
		return html;
	}
}

//セルクラス
class Cell {
	#html;
	#attrs = {};

	constructor(html, attrs) {
		this.#html = html;
		this.#attrs = attrs;
	}

	get HTML() {
		return this.#html;
	}
	getAttibute(key) {
		return this.#attrs[key];
	}
	get attibutes() {
		return Attribute.generateHTML(this.#attrs);
	}
}

//属性クラス
class Attribute {
	static generateHTML(attrs) {
		let html = "";
		for (let attr in attrs) {
			html += ` ${attr}="${attrs[attr]}"`;
		}
		return html;
	}
}
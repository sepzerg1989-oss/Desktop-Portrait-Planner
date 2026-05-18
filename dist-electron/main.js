import { BrowserWindow as e, Menu as t, app as n, dialog as r, ipcMain as i, protocol as a } from "electron";
import o from "path";
import { fileURLToPath as s } from "url";
import c from "fs";
import l from "electron-store";
import u from "better-sqlite3";
import d from "sharp";
import f from "crypto";
var p = new class e {
	constructor() {
		this.db = null;
	}
	init(e) {
		let t = o.join(e, "database.sqlite");
		this.db = new u(t), this.db.pragma("journal_mode = WAL"), this._createTables();
	}
	_createTables() {
		this.db.exec("\n      -- 策划案表\n      CREATE TABLE IF NOT EXISTS plans (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        title TEXT NOT NULL DEFAULT '未命名策划案',\n        cover_path TEXT,\n        modules_json TEXT DEFAULT '[]',\n        created_at TEXT DEFAULT (datetime('now','localtime')),\n        updated_at TEXT DEFAULT (datetime('now','localtime'))\n      );\n\n      -- 模特库表\n      CREATE TABLE IF NOT EXISTS models (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        name TEXT NOT NULL,\n        tags TEXT DEFAULT '[]',\n        avatar_path TEXT,\n        model_card_path TEXT,\n        social TEXT DEFAULT '',\n        region TEXT DEFAULT '',\n        price TEXT DEFAULT '',\n        images_json TEXT DEFAULT '[]',\n        created_at TEXT DEFAULT (datetime('now','localtime'))\n      );\n\n      -- 场地库表\n      CREATE TABLE IF NOT EXISTS locations (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        name TEXT NOT NULL,\n        address TEXT DEFAULT '',\n        price TEXT DEFAULT '',\n        tags TEXT DEFAULT '[]',\n        cover_path TEXT,\n        images_json TEXT DEFAULT '[]',\n        created_at TEXT DEFAULT (datetime('now','localtime'))\n      );\n\n      -- 模板预设表（从 localStorage 迁移）\n      CREATE TABLE IF NOT EXISTS templates (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        name TEXT NOT NULL,\n        structure_json TEXT DEFAULT '[]',\n        created_at TEXT DEFAULT (datetime('now','localtime'))\n      );\n    ");
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN region TEXT DEFAULT ''");
		} catch {}
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN price TEXT DEFAULT ''");
		} catch {}
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN model_card_path TEXT DEFAULT ''");
		} catch {}
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN images_json TEXT DEFAULT '[]'");
		} catch {}
	}
	static VALID_TABLES = [
		"plans",
		"models",
		"locations",
		"templates"
	];
	static VALID_COLUMNS = {
		plans: [
			"id",
			"title",
			"cover_path",
			"modules_json",
			"created_at",
			"updated_at"
		],
		models: [
			"id",
			"name",
			"tags",
			"avatar_path",
			"model_card_path",
			"social",
			"region",
			"price",
			"images_json",
			"created_at"
		],
		locations: [
			"id",
			"name",
			"address",
			"price",
			"tags",
			"cover_path",
			"images_json",
			"created_at"
		],
		templates: [
			"id",
			"name",
			"structure_json",
			"created_at"
		]
	};
	_validateTable(t) {
		if (!e.VALID_TABLES.includes(t)) throw Error(`[DatabaseService] 非法表名: ${t}`);
	}
	_validateColumns(t, n) {
		let r = e.VALID_COLUMNS[t];
		if (!r) throw Error(`[DatabaseService] 未知表: ${t}`);
		for (let e of n) if (!r.includes(e)) throw Error(`[DatabaseService] 非法列名: ${t}.${e}`);
	}
	getAll(e) {
		return this._validateTable(e), this.db.prepare(`SELECT * FROM ${e} ORDER BY created_at DESC`).all();
	}
	getById(e, t) {
		return this._validateTable(e), this.db.prepare(`SELECT * FROM ${e} WHERE id = ?`).get(t);
	}
	insert(e, t) {
		this._validateTable(e);
		let n = Object.keys(t);
		this._validateColumns(e, n);
		let r = n.map(() => "?").join(", "), i = `INSERT INTO ${e} (${n.join(", ")}) VALUES (${r})`, a = this.db.prepare(i).run(...n.map((e) => t[e]));
		return this.getById(e, a.lastInsertRowid);
	}
	update(e, t, n) {
		this._validateTable(e);
		let r = Object.keys(n);
		this._validateColumns(e, r);
		let i = `UPDATE ${e} SET ${r.map((e) => `${e} = ?`).join(", ")} WHERE id = ?`;
		return this.db.prepare(i).run(...r.map((e) => n[e]), t), this.getById(e, t);
	}
	delete(e, t) {
		return this._validateTable(e), this.db.prepare(`DELETE FROM ${e} WHERE id = ?`).run(t), { success: !0 };
	}
	savePlan(e, t) {
		let n = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19);
		return this.update("plans", e, {
			...t,
			updated_at: n
		});
	}
	createEmptyPlan(e = "未命名策划案") {
		return this.insert("plans", {
			title: e,
			modules_json: JSON.stringify([
				{
					id: "m1",
					type: "theme",
					title: "拍摄主题",
					data: {
						title: e,
						description: "",
						images: []
					}
				},
				{
					id: "m2",
					type: "model",
					title: "拍摄模特",
					data: {
						name: "",
						avatar: "",
						tags: []
					}
				},
				{
					id: "m3",
					type: "location",
					title: "拍摄场地",
					data: {
						name: "",
						address: "",
						images: []
					}
				},
				{
					id: "m4",
					type: "reference",
					title: "参考样片",
					data: { images: [] }
				}
			])
		});
	}
	saveTemplate(e, t) {
		return this.insert("templates", {
			name: e,
			structure_json: JSON.stringify(t)
		});
	}
	getTemplates() {
		return this.getAll("templates");
	}
	close() {
		this.db &&= (this.db.close(), null);
	}
}(), m = new class {
	constructor() {
		this.workspacePath = null, this.MAX_SIZE_BYTES = 300 * 1024, this.queue = [], this.runningCount = 0, this.MAX_CONCURRENCY = 5;
	}
	setWorkspace(e) {
		this.workspacePath = e;
	}
	async compressAndStore(e, t = "plans") {
		return new Promise((n, r) => {
			this.queue.push({
				sourcePath: e,
				category: t,
				resolve: n,
				reject: r
			}), this.next();
		});
	}
	async next() {
		if (this.runningCount >= this.MAX_CONCURRENCY || this.queue.length === 0) return;
		this.runningCount++;
		let { sourcePath: e, category: t, resolve: n, reject: r } = this.queue.shift();
		try {
			n(await this._doCompress(e, t));
		} catch (e) {
			r(e);
		} finally {
			this.runningCount--, this.next();
		}
	}
	async _doCompress(e, t = "plans") {
		if (!this.workspacePath) throw Error("工作区尚未初始化");
		let n = t.split(/[\\\/]/), r = o.join(this.workspacePath, "images", ...n);
		c.existsSync(r) || c.mkdirSync(r, { recursive: !0 });
		let i = o.extname(e).toLowerCase() || ".jpg", a = f.randomBytes(8).toString("hex"), s = `${Date.now()}_${a}${i}`, l = o.join(r, s);
		try {
			let t = d(e).rotate(), n = await t.metadata(), r = t, i = n.width;
			n.height, n.width > 1600 && (r = r.resize({
				width: 1600,
				withoutEnlargement: !0
			}), Math.round(n.height * (1600 / n.width)), i = 1600);
			let a = await r.jpeg({
				quality: 80,
				mozjpeg: !0,
				progressive: !0
			}).toBuffer();
			if (a.length > this.MAX_SIZE_BYTES) {
				let t = Math.sqrt(this.MAX_SIZE_BYTES / a.length);
				i = Math.min(1200, Math.round(i * t * .9)), a = await d(e).rotate().resize({
					width: i,
					withoutEnlargement: !0
				}).jpeg({
					quality: 60,
					mozjpeg: !0,
					progressive: !0
				}).toBuffer();
			}
			a.length > this.MAX_SIZE_BYTES && (a = await d(e).rotate().resize({
				width: 800,
				withoutEnlargement: !0
			}).jpeg({
				quality: 40,
				mozjpeg: !0
			}).toBuffer());
			let o = await d(a).metadata(), s = o.width / o.height;
			return c.writeFileSync(l, a), {
				success: !0,
				path: l,
				ratio: s
			};
		} catch (e) {
			return console.error("[ImageService] 图片压缩失败:", e), {
				success: !1,
				error: e.message
			};
		}
	}
	_isPathWithinWorkspace(e) {
		if (!this.workspacePath) return !1;
		let t = o.normalize(e), n = o.normalize(o.join(this.workspacePath, "images"));
		return t.startsWith(n + o.sep) || t === n;
	}
	_sanitizeCategory(e) {
		if (!e) return null;
		let t = e.split(/[\\\/]/).filter((e) => e && e !== ".." && !e.includes(":"));
		return t.length === 0 ? null : t;
	}
	async deleteEntityFolder(e) {
		if (!this.workspacePath || !e) return;
		let t = this._sanitizeCategory(e);
		if (!t) return;
		let n = o.join(this.workspacePath, "images", ...t);
		if (!this._isPathWithinWorkspace(n)) {
			console.warn(`[ImageService] 拒绝删除非工作区目录: ${n}`);
			return;
		}
		try {
			c.existsSync(n) && (c.rmSync(n, {
				recursive: !0,
				force: !0
			}), console.log(`[ImageService] 已清理资源目录: ${n}`));
		} catch (e) {
			console.error(`[ImageService] 清理资源目录失败: ${n}`, e);
		}
	}
	async deleteFile(e) {
		if (!this.workspacePath || !e) return { success: !1 };
		try {
			let t = o.normalize(e);
			return !this._isPathWithinWorkspace(t) && t !== o.normalize(o.join(this.workspacePath, "images")) ? (console.warn(`[ImageService] 拒绝删除非工作区图片: ${e}`), {
				success: !1,
				error: "Access denied"
			}) : c.existsSync(t) ? (c.unlinkSync(t), { success: !0 }) : {
				success: !1,
				error: "File not found"
			};
		} catch (t) {
			return console.error(`[ImageService] 删除文件失败: ${e}`, t), {
				success: !1,
				error: t.message
			};
		}
	}
	async renameEntityFolder(e, t) {
		if (!this.workspacePath || !e || !t) return { success: !1 };
		if (e === t) return { success: !0 };
		let n = this._sanitizeCategory(e), r = this._sanitizeCategory(t);
		if (!n || !r) return {
			success: !1,
			error: "Invalid category"
		};
		let i = o.join(this.workspacePath, "images", ...n), a = o.join(this.workspacePath, "images", ...r);
		if (!this._isPathWithinWorkspace(i) || !this._isPathWithinWorkspace(a)) return console.warn(`[ImageService] 拒绝重命名非工作区目录: ${i} -> ${a}`), {
			success: !1,
			error: "Access denied"
		};
		try {
			if (c.existsSync(i)) {
				let e = o.dirname(a);
				return c.existsSync(e) || c.mkdirSync(e, { recursive: !0 }), c.renameSync(i, a), console.log(`[ImageService] 文件夹已重命名: ${i} -> ${a}`), { success: !0 };
			}
			return {
				success: !1,
				error: "Source folder not found"
			};
		} catch (e) {
			return console.error(`[ImageService] 重命名文件夹失败: ${i}`, e), {
				success: !1,
				error: e.message
			};
		}
	}
}(), h = new class {
	constructor() {
		this.store = new l({ name: "workspace-config" }), this.currentPath = null;
	}
	getSavedPath() {
		return this.store.get("workspacePath", null);
	}
	async selectWorkspace(e = null) {
		let t = await r.showOpenDialog(e, {
			title: "选择工作区文件夹 (Portrait Planner)",
			properties: ["openDirectory", "createDirectory"]
		});
		if (t.canceled || t.filePaths.length === 0) return null;
		let n = t.filePaths[0];
		return await this.initWorkspace(n), n;
	}
	async initWorkspace(e) {
		let t = [
			o.join(e, "images", "models"),
			o.join(e, "images", "locations"),
			o.join(e, "images", "plans"),
			o.join(e, "exports")
		];
		for (let e of t) c.existsSync(e) || c.mkdirSync(e, { recursive: !0 });
		p.init(e), m.setWorkspace(e), this.currentPath = e, this.store.set("workspacePath", e);
	}
	async tryRestore() {
		let e = this.getSavedPath();
		return e && c.existsSync(e) ? (await this.initWorkspace(e), !0) : !1;
	}
	getPath() {
		return this.currentPath;
	}
	async initDefault() {
		let e = o.join(n.getPath("documents"), "PortraitPlanner");
		return await this.initWorkspace(e), e;
	}
}(), g = o.dirname(s(import.meta.url));
function _() {
	let t = new e({
		width: 1440,
		height: 900,
		frame: !1,
		titleBarStyle: "hidden",
		backgroundColor: "#E2DED0",
		webPreferences: {
			preload: o.join(g, "preload.js"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	});
	process.env.VITE_DEV_SERVER_URL ? (t.loadURL(process.env.VITE_DEV_SERVER_URL), t.webContents.openDevTools()) : t.loadFile(o.join(g, "../dist/index.html"));
}
a.registerSchemesAsPrivileged([{
	scheme: "local-image",
	privileges: {
		secure: !0,
		supportFetchAPI: !0,
		standard: !0,
		bypassCSP: !0
	}
}]), n.whenReady().then(async () => {
	if (a.handle("local-image", async (e) => {
		let t = new URL(e.url), n = decodeURIComponent(t.pathname);
		process.platform === "win32" && n.startsWith("/") && (n = n.substring(1));
		try {
			await c.promises.access(n, c.constants.R_OK);
		} catch {
			return new Response("File not found", { status: 404 });
		}
		let r = c.createReadStream(n), i = o.extname(n).toLowerCase();
		return new Response(r, { headers: { "Content-Type": {
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".png": "image/png",
			".webp": "image/webp",
			".gif": "image/gif",
			".bmp": "image/bmp"
		}[i] || "image/jpeg" } });
	}), !await h.tryRestore() && !await h.selectWorkspace()) {
		n.quit();
		return;
	}
	_(), t.setApplicationMenu(null), n.on("activate", () => {
		e.getAllWindows().length === 0 && _();
	});
}), n.on("window-all-closed", () => {
	p.close(), process.platform !== "darwin" && n.quit();
}), i.handle("workspace:getPath", () => h.getPath()), i.handle("workspace:selectAndSet", async (t) => {
	let n = e.fromWebContents(t.sender), r = await h.selectWorkspace(n);
	return r ? {
		success: !0,
		path: r
	} : { success: !1 };
}), i.handle("db:models:getAll", () => p.getAll("models")), i.handle("db:models:create", (e, t) => p.insert("models", t)), i.handle("db:models:update", (e, t, n) => p.update("models", t, n)), i.handle("db:models:delete", async (e, t) => {
	let n = p.delete("models", t);
	return n.success && await m.deleteEntityFolder(`models/${t}`), n;
}), i.handle("db:locations:getAll", () => p.getAll("locations")), i.handle("db:locations:create", (e, t) => p.insert("locations", t)), i.handle("db:locations:update", (e, t, n) => p.update("locations", t, n)), i.handle("db:locations:delete", async (e, t) => {
	let n = p.delete("locations", t);
	return n.success && await m.deleteEntityFolder(`locations/${t}`), n;
}), i.handle("db:plans:getAll", () => p.getAll("plans")), i.handle("db:plans:create", (e, t) => p.createEmptyPlan(t)), i.handle("db:plans:createFromTemplate", (e, t, n) => {
	let r = p.getById("templates", n);
	if (!r) return null;
	let i = JSON.parse(r.structure_json).map((e, t) => ({
		id: "m" + Date.now() + t,
		type: e.type,
		title: e.title,
		data: v(e.type)
	}));
	return p.insert("plans", {
		title: t,
		modules_json: JSON.stringify(i)
	});
}), i.handle("db:plans:getById", (e, t) => p.getById("plans", t)), i.handle("db:plans:save", (e, t, n) => p.savePlan(t, n)), i.handle("db:plans:delete", async (e, t) => {
	let n = p.delete("plans", t);
	return n.success && await m.deleteEntityFolder(`plans/${t}`), n;
}), i.handle("db:templates:getAll", () => p.getTemplates()), i.handle("db:templates:save", (e, t, n) => p.saveTemplate(t, n)), i.handle("db:templates:delete", (e, t) => p.delete("templates", t)), i.handle("image:compress", async (e, t, n) => await m.compressAndStore(t, n)), i.handle("image:saveFromBuffer", async (e, t, r) => {
	let i = o.join(n.getPath("temp"), `temp_${Date.now()}.png`);
	c.writeFileSync(i, Buffer.from(t));
	let a = await m.compressAndStore(i, r);
	return c.existsSync(i) && c.unlinkSync(i), a;
}), i.handle("image:deleteFile", async (e, t) => await m.deleteFile(t)), i.handle("image:renameFolder", async (e, t, n) => await m.renameEntityFolder(t, n)), i.handle("image:selectFiles", async (t) => {
	let n = e.fromWebContents(t.sender), i = await r.showOpenDialog(n, {
		title: "选择图片",
		properties: ["openFile", "multiSelections"],
		filters: [{
			name: "图片文件",
			extensions: [
				"jpg",
				"jpeg",
				"png",
				"webp",
				"gif",
				"bmp"
			]
		}]
	});
	return i.canceled ? [] : i.filePaths;
}), i.handle("image:cleanupTempFolder", async (e, t) => await m.deleteEntityFolder(t)), i.handle("system:exportImage", async (t, n, i) => {
	let a = e.fromWebContents(t.sender), o = await r.showSaveDialog(a, {
		title: "导出为长图",
		defaultPath: i || "策划案_长图.jpg",
		filters: [{
			name: "JPEG Image",
			extensions: ["jpg", "jpeg"]
		}]
	});
	if (o.canceled || !o.filePath) return {
		success: !1,
		error: "User canceled"
	};
	try {
		let e = n.replace(/^data:image\/\w+;base64,/, ""), t = Buffer.from(e, "base64");
		return c.writeFileSync(o.filePath, t), {
			success: !0,
			filePath: o.filePath
		};
	} catch (e) {
		return console.error("Export error:", e), {
			success: !1,
			error: e.message
		};
	}
}), i.on("window-minimize", (t) => {
	e.fromWebContents(t.sender).minimize();
}), i.on("window-toggle-maximize", (t) => {
	let n = e.fromWebContents(t.sender);
	n.isMaximized() ? n.unmaximize() : n.maximize();
}), i.on("window-close", (t) => {
	e.fromWebContents(t.sender).close();
});
function v(e) {
	return {
		theme: {
			title: "",
			description: "",
			images: []
		},
		model: {
			name: "",
			avatar: "",
			tags: []
		},
		location: {
			name: "",
			address: "",
			images: []
		},
		reference: { images: [] },
		clothing: {
			description: "",
			images: []
		},
		props: {
			description: "",
			images: []
		},
		custom: {
			description: "",
			images: []
		}
	}[e] || {};
}
//#endregion

import { BrowserWindow as e, Menu as t, Tray as n, app as r, clipboard as i, dialog as a, ipcMain as o, nativeImage as s, net as c, protocol as l, shell as u } from "electron";
import d from "path";
import { fileURLToPath as f } from "url";
import p from "fs";
import m from "electron-store";
import ee from "better-sqlite3";
import h from "sharp";
import g from "crypto";
var _ = new class e {
	constructor() {
		this.db = null;
	}
	init(e) {
		let t = d.join(e, "database.sqlite");
		this.db = new ee(t), this.db.pragma("journal_mode = WAL"), this._createTables();
	}
	_createTables() {
		this.db.exec("\n      -- 策划案表\n      CREATE TABLE IF NOT EXISTS plans (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        title TEXT NOT NULL DEFAULT '未命名策划案',\n        cover_path TEXT,\n        modules_json TEXT DEFAULT '[]',\n        created_at TEXT DEFAULT (datetime('now','localtime')),\n        updated_at TEXT DEFAULT (datetime('now','localtime'))\n      );\n\n      -- 模特库表\n      CREATE TABLE IF NOT EXISTS models (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        name TEXT NOT NULL,\n        tags TEXT DEFAULT '[]',\n        avatar_path TEXT,\n        model_card_path TEXT,\n        social TEXT DEFAULT '',\n        region TEXT DEFAULT '',\n        price TEXT DEFAULT '',\n        images_json TEXT DEFAULT '[]',\n        created_at TEXT DEFAULT (datetime('now','localtime'))\n      );\n\n      -- 场地库表\n      CREATE TABLE IF NOT EXISTS locations (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        name TEXT NOT NULL,\n        address TEXT DEFAULT '',\n        price TEXT DEFAULT '',\n        tags TEXT DEFAULT '[]',\n        cover_path TEXT,\n        images_json TEXT DEFAULT '[]',\n        created_at TEXT DEFAULT (datetime('now','localtime'))\n      );\n\n      -- 模板预设表（从 localStorage 迁移）\n      CREATE TABLE IF NOT EXISTS templates (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        name TEXT NOT NULL,\n        structure_json TEXT DEFAULT '[]',\n        created_at TEXT DEFAULT (datetime('now','localtime'))\n      );\n\n      -- 服装库表 (Clothing)\n      CREATE TABLE IF NOT EXISTS clothing (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        name TEXT NOT NULL,\n        description TEXT DEFAULT '',\n        tags TEXT DEFAULT '[]',\n        link TEXT DEFAULT '',\n        price TEXT DEFAULT '',\n        images_json TEXT DEFAULT '[]',\n        created_at TEXT DEFAULT (datetime('now','localtime'))\n      );\n\n      -- 道具库表 (Props)\n      CREATE TABLE IF NOT EXISTS props (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        name TEXT NOT NULL,\n        description TEXT DEFAULT '',\n        tags TEXT DEFAULT '[]',\n        link TEXT DEFAULT '',\n        price TEXT DEFAULT '',\n        images_json TEXT DEFAULT '[]',\n        created_at TEXT DEFAULT (datetime('now','localtime'))\n      );\n\n      -- 妆容库表 (Makeup)\n      CREATE TABLE IF NOT EXISTS makeup (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        name TEXT NOT NULL,\n        description TEXT DEFAULT '',\n        tags TEXT DEFAULT '[]',\n        images_json TEXT DEFAULT '[]',\n        created_at TEXT DEFAULT (datetime('now','localtime'))\n      );\n    ");
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN region TEXT DEFAULT ''");
		} catch (e) {
			e.message.includes("duplicate column") || console.warn("[DatabaseService] 迁移 region 字段失败:", e.message);
		}
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN price TEXT DEFAULT ''");
		} catch (e) {
			e.message.includes("duplicate column") || console.warn("[DatabaseService] 迁移 price 字段失败:", e.message);
		}
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN model_card_path TEXT DEFAULT ''");
		} catch (e) {
			e.message.includes("duplicate column") || console.warn("[DatabaseService] 迁移 model_card_path 字段失败:", e.message);
		}
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN images_json TEXT DEFAULT '[]'");
		} catch (e) {
			e.message.includes("duplicate column") || console.warn("[DatabaseService] 迁移 images_json 字段失败:", e.message);
		}
	}
	static VALID_TABLES = [
		"plans",
		"models",
		"locations",
		"templates",
		"clothing",
		"props",
		"makeup"
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
		],
		clothing: [
			"id",
			"name",
			"description",
			"tags",
			"link",
			"price",
			"images_json",
			"created_at"
		],
		props: [
			"id",
			"name",
			"description",
			"tags",
			"link",
			"price",
			"images_json",
			"created_at"
		],
		makeup: [
			"id",
			"name",
			"description",
			"tags",
			"images_json",
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
	deleteBatch(e, t) {
		this._validateTable(e);
		let n = this.db.prepare(`DELETE FROM ${e} WHERE id = ?`);
		return this.db.transaction((e) => {
			for (let t of e) n.run(t);
		})(t), { success: !0 };
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
	transaction(e) {
		this.db.transaction(() => {
			e();
		})();
	}
}(), v = new class {
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
		let n = this._sanitizeCategory(t);
		if (!n) throw Error("无效的资源分类路径");
		let r = d.join(this.workspacePath, "images", ...n);
		if (!this._isPathWithinWorkspace(r)) throw Error("拒绝写入非工作区目录");
		p.existsSync(r) || p.mkdirSync(r, { recursive: !0 });
		let i = d.extname(e).toLowerCase() || ".jpg", a = g.randomBytes(8).toString("hex"), o = `${Date.now()}_${a}${i}`, s = d.join(r, o);
		try {
			let t = h(e).rotate(), n = await t.metadata(), r = t, i = n.width;
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
				let e = Math.sqrt(this.MAX_SIZE_BYTES / a.length);
				i = Math.min(1200, Math.round(i * e * .9)), a = await r.resize({
					width: i,
					withoutEnlargement: !0
				}).jpeg({
					quality: 60,
					mozjpeg: !0,
					progressive: !0
				}).toBuffer();
			}
			a.length > this.MAX_SIZE_BYTES && (a = await r.resize({
				width: 800,
				withoutEnlargement: !0
			}).jpeg({
				quality: 40,
				mozjpeg: !0
			}).toBuffer());
			let o = await h(a).metadata(), c = o.width / o.height;
			return p.writeFileSync(s, a), {
				success: !0,
				path: s,
				ratio: c
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
		let t = d.normalize(e), n = d.normalize(d.join(this.workspacePath, "images"));
		return t.startsWith(n + d.sep) || t === n;
	}
	_sanitizeCategory(e) {
		if (!e) return null;
		let t = e.split(/[\\\/]/).filter((e) => e && !e.includes("..") && !e.includes(":") && !/^[~]/.test(e));
		return t.length === 0 ? null : t;
	}
	async deleteEntityFolder(e) {
		if (!this.workspacePath || !e) return;
		let t = this._sanitizeCategory(e);
		if (!t) return;
		let n = d.join(this.workspacePath, "images", ...t);
		if (!this._isPathWithinWorkspace(n)) {
			console.warn(`[ImageService] 拒绝删除非工作区目录: ${n}`);
			return;
		}
		try {
			let e = !1;
			p.existsSync(n) && (p.rmSync(n, {
				recursive: !0,
				force: !0
			}), console.log(`[ImageService] 已清理资源目录: ${n}`), e = !0);
			let r = t[t.length - 1];
			if (/^\d+$/.test(r)) {
				let n = d.join(this.workspacePath, "images", ...t.slice(0, -1));
				if (p.existsSync(n)) {
					let t = p.readdirSync(n);
					for (let i of t) {
						let t = d.join(n, i);
						p.statSync(t).isDirectory() && (i.endsWith(`_${r}`) || i === r) && (p.rmSync(t, {
							recursive: !0,
							force: !0
						}), console.log(`[ImageService] 已清理资源目录（匹配 ID 后缀）: ${t}`), e = !0);
					}
				}
			}
			e || console.log(`[ImageService] 未找到需要清理的资源目录: ${n}`);
		} catch (e) {
			console.error(`[ImageService] 清理资源目录失败: ${n}`, e);
		}
	}
	async copyFilesToEntity(e, t) {
		if (!this.workspacePath || !t || !Array.isArray(e)) return [];
		let n = this._sanitizeCategory(t);
		if (!n) throw Error("无效的资源分类路径");
		let r = d.join(this.workspacePath, "images", ...n);
		if (!this._isPathWithinWorkspace(r)) throw Error("拒绝写入非工作区目录");
		p.existsSync(r) || p.mkdirSync(r, { recursive: !0 });
		let i = [];
		return e.forEach((e, t) => {
			if (!e || !p.existsSync(e)) return;
			let n = d.extname(e).toLowerCase() || ".jpg", a = g.randomBytes(8).toString("hex"), o = `${Date.now()}_copy_${t}_${a}${n}`, s = d.join(r, o);
			try {
				p.copyFileSync(e, s), i.push({
					oldPath: e,
					newPath: s
				});
			} catch (t) {
				console.error("[ImageService] 复制归档文件失败:", e, t);
			}
		}), i;
	}
	async deleteFile(e) {
		if (!this.workspacePath || !e) return { success: !1 };
		try {
			let t = d.normalize(e);
			return !this._isPathWithinWorkspace(t) && t !== d.normalize(d.join(this.workspacePath, "images")) ? (console.warn(`[ImageService] 拒绝删除非工作区图片: ${e}`), {
				success: !1,
				error: "Access denied"
			}) : p.existsSync(t) ? (p.unlinkSync(t), { success: !0 }) : {
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
		let i = d.join(this.workspacePath, "images", ...n), a = d.join(this.workspacePath, "images", ...r);
		if (!this._isPathWithinWorkspace(i) || !this._isPathWithinWorkspace(a)) return console.warn(`[ImageService] 拒绝重命名非工作区目录: ${i} -> ${a}`), {
			success: !1,
			error: "Access denied"
		};
		try {
			if (p.existsSync(i)) {
				let e = d.dirname(a);
				return p.existsSync(e) || p.mkdirSync(e, { recursive: !0 }), p.renameSync(i, a), console.log(`[ImageService] 文件夹已重命名: ${i} -> ${a}`), { success: !0 };
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
}(), y = new class {
	constructor() {
		this.store = new m({ name: "workspace-config" }), this.currentPath = null;
	}
	getSavedPath() {
		return this.store.get("workspacePath", null);
	}
	async selectWorkspace(e = null) {
		let t = await a.showOpenDialog(e, {
			title: "选择工作区文件夹 (Portrait Planner)",
			properties: ["openDirectory", "createDirectory"]
		});
		if (t.canceled || t.filePaths.length === 0) return null;
		let n = t.filePaths[0];
		return await this.initWorkspace(n), n;
	}
	async initWorkspace(e) {
		let t = [
			d.join(e, "images", "models"),
			d.join(e, "images", "locations"),
			d.join(e, "images", "plans"),
			d.join(e, "images", "clothing"),
			d.join(e, "images", "props"),
			d.join(e, "images", "makeup"),
			d.join(e, "exports")
		];
		for (let e of t) p.existsSync(e) || p.mkdirSync(e, { recursive: !0 });
		_.init(e), v.setWorkspace(e), this.currentPath = e, this.store.set("workspacePath", e);
	}
	async tryRestore() {
		let e = this.getSavedPath();
		return e && p.existsSync(e) ? (await this.initWorkspace(e), !0) : !1;
	}
	getPath() {
		return this.currentPath;
	}
	async initDefault() {
		let e = d.join(r.getPath("documents"), "PortraitPlanner");
		return await this.initWorkspace(e), e;
	}
}(), b = new Set([
	".jpg",
	".jpeg",
	".png",
	".webp",
	".gif",
	".bmp"
]), te = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".gif": "image/gif",
	".bmp": "image/bmp"
}, x = 200 * 1024 * 1024, S = 2e3, C = 25 * 1024 * 1024, w = 150 * 1024 * 1024;
function T(e) {
	if (typeof e != "string") return "";
	if (!e.startsWith("local-image://host/")) return e;
	let t = decodeURIComponent(e.replace("local-image://host/", ""));
	return process.platform === "win32" && t.startsWith("/") && (t = t.substring(1)), t;
}
function E(e) {
	return e ? typeof e == "string" ? T(e) : typeof e == "object" ? T(e.path || e.url || "") : "" : "";
}
function D(e) {
	let t = d.resolve(e);
	return process.platform === "win32" ? t.toLowerCase() : t;
}
function ne(e, t) {
	if (!e || !t) return !1;
	let n = D(e), r = D(t), i = d.relative(n, r);
	return i === "" || !!i && !i.startsWith("..") && !d.isAbsolute(i);
}
function O(e) {
	return b.has(d.extname(e || "").toLowerCase());
}
function k(e, t) {
	return !e || !t || !O(e) ? !1 : ne(d.join(t, "images"), e);
}
function A(e) {
	return te[d.extname(e || "").toLowerCase()] || "image/jpeg";
}
function j(e) {
	let t = new URL(e), n = decodeURIComponent(t.pathname);
	return process.platform === "win32" && n.startsWith("/") && (n = n.substring(1)), n;
}
function M(e) {
	if (typeof e != "string") return 0;
	let t = e.trim();
	if (!t) return 0;
	let n = t.endsWith("==") ? 2 : +!!t.endsWith("=");
	return Math.floor(t.length * 3 / 4) - n;
}
function N(e, t = 0) {
	if (t > x) throw Error("数据包过大，请拆分后再导入");
	if (!e || e.type !== "portraitplanner-export") throw Error("无效的导出文件格式");
	if (e.data && typeof e.data != "object") throw Error("导入数据结构无效");
	if (e.images && typeof e.images != "object") throw Error("导入图片结构无效");
	let n = e.images || {}, r = Object.entries(n);
	if (r.length > S) throw Error("数据包图片数量过多，请拆分后再导入");
	let i = 0;
	for (let [e, t] of r) {
		if (!O(e)) throw Error("数据包包含不支持的图片格式");
		let n = M(t);
		if (n > C) throw Error("单张图片过大，请压缩后再导入");
		if (i += n, i > w) throw Error("数据包图片总体积过大，请拆分后再导入");
	}
}
//#endregion
//#region electron/services/ExportService.js
var P = (e) => (e || "").replace(/[\\\/:*?"<>|]/g, "_").trim() || "unnamed", F = new class {
	async exportData(e, t) {
		try {
			let n = {
				version: "1.0",
				type: "portraitplanner-export",
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				data: {
					plans: [],
					models: [],
					locations: [],
					clothing: [],
					props: [],
					makeup: []
				},
				images: {}
			}, r = (e) => {
				let t = E(e);
				if (!(!t || n.images[t])) try {
					p.existsSync(t) && (n.images[t] = p.readFileSync(t, "base64"));
				} catch (e) {
					console.warn("[ExportService] 读取图片失败:", t, e);
				}
			};
			if (e.planIds && Array.isArray(e.planIds)) for (let t of e.planIds) {
				let e = _.getById("plans", t);
				e && (n.data.plans.push(e), e.cover_path && r(e.cover_path), JSON.parse(e.modules_json || "[]").forEach((e) => {
					e.data?.images && e.data.images.forEach((e) => r(e)), e.data?.avatar && r(e.data.avatar), e.data?.avatarPath && r(e.data.avatarPath), e.data?.modelCard && r(e.data.modelCard), e.data?.modelCardPath && r(e.data.modelCardPath), e.data?.items && e.data.items.forEach((e) => {
						e.images && e.images.forEach((e) => r(e));
					});
				}));
			}
			if (e.modelIds && Array.isArray(e.modelIds)) for (let t of e.modelIds) {
				let e = _.getById("models", t);
				e && (n.data.models.push(e), e.avatar_path && r(e.avatar_path), e.model_card_path && r(e.model_card_path), JSON.parse(e.images_json || "[]").forEach((e) => r(e)));
			}
			if (e.locationIds && Array.isArray(e.locationIds)) for (let t of e.locationIds) {
				let e = _.getById("locations", t);
				e && (n.data.locations.push(e), e.cover_path && r(e.cover_path), JSON.parse(e.images_json || "[]").forEach((e) => r(e)));
			}
			if (e.clothingIds && Array.isArray(e.clothingIds)) for (let t of e.clothingIds) {
				let e = _.getById("clothing", t);
				e && (n.data.clothing.push(e), JSON.parse(e.images_json || "[]").forEach((e) => r(e)));
			}
			if (e.propsIds && Array.isArray(e.propsIds)) for (let t of e.propsIds) {
				let e = _.getById("props", t);
				e && (n.data.props.push(e), JSON.parse(e.images_json || "[]").forEach((e) => r(e)));
			}
			if (e.makeupIds && Array.isArray(e.makeupIds)) for (let t of e.makeupIds) {
				let e = _.getById("makeup", t);
				e && (n.data.makeup.push(e), JSON.parse(e.images_json || "[]").forEach((e) => r(e)));
			}
			let i = await a.showSaveDialog(t, {
				title: "导出数据",
				defaultPath: "PortraitPlanner_Data.ppexport",
				filters: [{
					name: "PortraitPlanner Export File",
					extensions: ["ppexport"]
				}]
			});
			return i.canceled || !i.filePath ? {
				success: !1,
				error: "User canceled"
			} : (p.writeFileSync(i.filePath, JSON.stringify(n)), {
				success: !0,
				filePath: i.filePath
			});
		} catch (e) {
			return console.error("[ExportService] 导出失败:", e), {
				success: !1,
				error: e.message
			};
		}
	}
	async importData(e, t = null) {
		let n = null;
		try {
			let r = t;
			if (!r) {
				let t = await a.showOpenDialog(e, {
					title: "导入数据",
					properties: ["openFile"],
					filters: [{
						name: "PortraitPlanner Export File",
						extensions: ["ppexport"]
					}]
				});
				if (t.canceled || t.filePaths.length === 0) return {
					success: !1,
					error: "User canceled"
				};
				r = t.filePaths[0];
			}
			let i = p.statSync(r), o = p.readFileSync(r, "utf-8"), s = JSON.parse(o);
			N(s, i.size), n = d.join(y.getPath(), "images", "import_temp"), p.existsSync(n) || p.mkdirSync(n, { recursive: !0 });
			let c = {};
			if (s.images) for (let [e, t] of Object.entries(s.images)) {
				let r = Buffer.from(t, "base64"), i = g.randomBytes(8).toString("hex"), a = d.extname(e) || ".jpg", o = `${Date.now()}_${i}${a}`, s = d.join(n, o);
				p.writeFileSync(s, r), c[e] = s;
				let l = E(e);
				l && (c[l] = s);
			}
			let l = (e) => {
				let t = E(e);
				return t && (c[t] || t);
			}, u = (e, t, n, r, i) => {
				let a = E(e);
				if (!a) return e;
				let o = l(a);
				return o && o !== a && (o = f(o, t, n, r, i)), e && typeof e == "object" ? {
					...e,
					path: o,
					url: m(o)
				} : {
					path: o,
					url: m(o),
					ratio: 1
				};
			}, f = (e, t, n, r = "", i = 0) => {
				if (!e || !p.existsSync(e)) return e;
				let a = r ? P(r) : "", o = a && a !== "unnamed" ? `${a}_${n}` : String(n), s = d.join(y.getPath(), "images", t, o);
				p.existsSync(s) || p.mkdirSync(s, { recursive: !0 });
				let c = d.extname(e) || ".jpg", l = `${Date.now()}_${i}${c}`, u = d.join(s, l);
				try {
					return p.copyFileSync(e, u), u;
				} catch (t) {
					return console.error("[ExportService] 复制文件失败:", t), e;
				}
			}, m = (e) => e ? `local-image://host/${e.replace(/\\/g, "/")}` : "";
			if (_.transaction(() => {
				if (s.data.models) for (let e of s.data.models) {
					let t = {};
					_.constructor.VALID_COLUMNS.models.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = _.insert("models", t), r = n.id, i = l(t.avatar_path);
					i && i !== t.avatar_path && (i = f(i, "models", r, n.name, "avatar"));
					let a = l(t.model_card_path);
					a && a !== t.model_card_path && (a = f(a, "models", r, n.name, "modelcard"));
					let o = JSON.parse(t.images_json || "[]").map((e, t) => u(e, "models", r, n.name, `photo_${t}`));
					_.update("models", r, {
						avatar_path: i,
						model_card_path: a,
						images_json: JSON.stringify(o)
					});
				}
				if (s.data.locations) for (let e of s.data.locations) {
					let t = {};
					_.constructor.VALID_COLUMNS.locations.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = _.insert("locations", t), r = n.id, i = l(t.cover_path);
					i && i !== t.cover_path && (i = f(i, "locations", r, n.name, "cover"));
					let a = JSON.parse(t.images_json || "[]").map((e, t) => u(e, "locations", r, n.name, `photo_${t}`));
					_.update("locations", r, {
						cover_path: i,
						images_json: JSON.stringify(a)
					});
				}
				if (s.data.plans) for (let e of s.data.plans) {
					let t = {};
					_.constructor.VALID_COLUMNS.plans.forEach((n) => {
						n !== "id" && n !== "created_at" && n !== "updated_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = _.insert("plans", t), r = n.id, i = l(t.cover_path);
					i && i !== t.cover_path && (i = f(i, "plans", r, n.title, "cover"));
					let a = JSON.parse(t.modules_json || "[]");
					a.forEach((e, t) => {
						if (e.data?.images && (e.data.images = e.data.images.map((e, i) => u(e, "plans", r, n.title, `mod_${t}_img_${i}`))), e.data?.avatar) {
							let i = l(e.data.avatarPath || e.data.avatar);
							i && i !== (e.data.avatarPath || e.data.avatar) && (i = f(i, "plans", r, n.title, `mod_${t}_avatar`)), e.data.avatarPath ? (e.data.avatarPath = i, e.data.avatar = m(i)) : (e.data.avatar = i, e.data.avatar && !e.data.avatar.startsWith("local-image://") && (e.data.avatar = m(i)));
						}
						if (e.data?.modelCard) {
							let i = l(e.data.modelCardPath || e.data.modelCard);
							i && i !== (e.data.modelCardPath || e.data.modelCard) && (i = f(i, "plans", r, n.title, `mod_${t}_modelcard`)), e.data.modelCardPath ? (e.data.modelCardPath = i, e.data.modelCard = m(i)) : (e.data.modelCard = i, e.data.modelCard && !e.data.modelCard.startsWith("local-image://") && (e.data.modelCard = m(i)));
						}
						e.data?.items && e.data.items.forEach((e, i) => {
							e.images &&= e.images.map((e, a) => u(e, "plans", r, n.title, `mod_${t}_item_${i}_img_${a}`));
						});
					}), _.update("plans", r, {
						cover_path: i,
						modules_json: JSON.stringify(a)
					});
				}
				if (s.data.clothing) for (let e of s.data.clothing) {
					let t = {};
					_.constructor.VALID_COLUMNS.clothing.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = _.insert("clothing", t), r = n.id, i = JSON.parse(t.images_json || "[]").map((e, t) => u(e, "clothing", r, n.name, `photo_${t}`));
					_.update("clothing", r, { images_json: JSON.stringify(i) });
				}
				if (s.data.props) for (let e of s.data.props) {
					let t = {};
					_.constructor.VALID_COLUMNS.props.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = _.insert("props", t), r = n.id, i = JSON.parse(t.images_json || "[]").map((e, t) => u(e, "props", r, n.name, `photo_${t}`));
					_.update("props", r, { images_json: JSON.stringify(i) });
				}
				if (s.data.makeup) for (let e of s.data.makeup) {
					let t = {};
					_.constructor.VALID_COLUMNS.makeup.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = _.insert("makeup", t), r = n.id, i = JSON.parse(t.images_json || "[]").map((e, t) => u(e, "makeup", r, n.name, `photo_${t}`));
					_.update("makeup", r, { images_json: JSON.stringify(i) });
				}
			}), p.existsSync(n)) try {
				p.rmSync(n, {
					recursive: !0,
					force: !0
				});
			} catch (e) {
				console.warn("[ExportService] 清理临时文件夹失败:", e);
			}
			return { success: !0 };
		} catch (e) {
			return console.error("[ExportService] 导入失败:", e), {
				success: !1,
				error: e.message
			};
		} finally {
			if (n && p.existsSync(n)) try {
				p.rmSync(n, {
					recursive: !0,
					force: !0
				});
			} catch (e) {
				console.warn("[ExportService] 清理临时文件夹失败:", e);
			}
		}
	}
}(), I = "sepzerg1989-oss", L = "Desktop-Portrait-Planner", R = new m(), z = new class {
	constructor() {
		this.currentVersion = r.getVersion(), this.tempFilePath = null, this.isDownloading = !1;
		let e = R.get("lastRunVersion");
		e !== this.currentVersion && (R.delete("ignoredVersion"), R.set("lastRunVersion", this.currentVersion), console.log(`[UpdateService] 检测到软件版本变更：v${e} -> v${this.currentVersion}，已重置已忽略的版本记录。`));
	}
	getUpdateConfigUrl() {
		return `https://raw.githubusercontent.com/${I}/${L}/main/update.json`;
	}
	getUpdateConfigMirrorUrl() {
		return `https://gh-proxy.com/https://raw.githubusercontent.com/${I}/${L}/main/update.json`;
	}
	async autoCheck(e) {
		try {
			let t = await this.fetchLatestVersion();
			if (!t) return;
			if (R.get("ignoredVersion") === t.version) {
				console.log(`[UpdateService] 自动更新已静默：版本 v${t.version} 已被用户忽略`);
				return;
			}
			this.compareVersion(t.version, this.currentVersion) > 0 && (console.log(`[UpdateService] 发现新版本 v${t.version}`), e.webContents.send("update:available", {
				version: t.version,
				changelog: t.changelog,
				downloadUrl: process.platform === "darwin" ? t.macDownloadUrl : t.downloadUrl
			}));
		} catch (e) {
			console.warn("[UpdateService] 启动自动检查更新失败:", e.message);
		}
	}
	async manualCheck() {
		try {
			let e = await this.fetchLatestVersion();
			return e ? {
				hasUpdate: this.compareVersion(e.version, this.currentVersion) > 0,
				currentVersion: this.currentVersion,
				latestVersion: e.version,
				changelog: e.changelog,
				downloadUrl: process.platform === "darwin" ? e.macDownloadUrl : e.downloadUrl
			} : {
				hasUpdate: !1,
				msg: "获取更新配置失败",
				currentVersion: this.currentVersion
			};
		} catch (e) {
			return console.error("[UpdateService] 手动检查更新失败:", e), {
				hasUpdate: !1,
				error: e.message,
				currentVersion: this.currentVersion
			};
		}
	}
	ignoreVersion(e) {
		return R.set("ignoredVersion", e), console.log(`[UpdateService] 用户已忽略版本：v${e}`), { success: !0 };
	}
	async fetchLatestVersion() {
		let e = [
			`https://gh-proxy.com/https://raw.githubusercontent.com/${I}/${L}/main/update.json`,
			`https://ghproxy.net/https://raw.githubusercontent.com/${I}/${L}/main/update.json`,
			this.getUpdateConfigUrl()
		];
		for (let t of e) try {
			console.log(`[UpdateService] 正在尝试获取更新配置: ${t}`);
			let e = await c.fetch(t, {
				method: "GET",
				redirect: "follow"
			});
			if (e.ok) {
				let t = await e.text();
				return JSON.parse(t);
			}
			console.warn(`[UpdateService] 加载地址返回状态码异常: ${t} -> ${e.status}`);
		} catch (e) {
			console.warn(`[UpdateService] 加载地址失败: ${t}，错误信息: ${e.message}`);
		}
		throw Error("所有更新配置通道均获取失败");
	}
	async downloadPackage(e, t) {
		if (this.isDownloading) throw Error("已有下载任务进行中");
		this.isDownloading = !0, this.cancelRequested = !1;
		let n = [e];
		e.includes("github.com") && [
			"https://gh-proxy.com/",
			"https://ghproxy.net/",
			"https://ghproxy.homeboyc.cn/"
		].reverse().forEach((t) => {
			n.unshift(`${t}${e}`);
		});
		let i = process.platform === "darwin" ? ".dmg" : ".exe", a = `PortraitPlanner_Update_${Date.now()}${i}`, o = d.join(r.getPath("temp"), a);
		this.tempFilePath = o;
		let s = null;
		for (let e of n) {
			console.log(`[UpdateService] 正在尝试下载安装包: ${e}`);
			let n = p.createWriteStream(o);
			try {
				let r = await c.fetch(e, {
					method: "GET",
					redirect: "follow"
				});
				if (!r.ok) throw Error(`状态码异常: ${r.status}`);
				let i = parseInt(r.headers.get("content-length"), 10) || 0, a = 0, s = r.body.getReader();
				for (;;) {
					if (this.cancelRequested) throw Error("USER_CANCELLED");
					let { done: e, value: r } = await s.read();
					if (e) break;
					if (n.write(Buffer.from(r)), a += r.length, i > 0) {
						let e = Math.round(a / i * 100);
						t && !t.isDestroyed() && t.webContents.send("update:download-progress", e);
					}
				}
				return n.end(), this.isDownloading = !1, console.log(`[UpdateService] 成功从地址下载完成: ${e}`), o;
			} catch (t) {
				if (console.warn(`[UpdateService] 从地址下载失败: ${e}，错误信息: ${t.message}`), s = t, n.close(), p.existsSync(o)) try {
					p.unlinkSync(o);
				} catch {}
				if (t.message === "USER_CANCELLED") break;
			}
		}
		throw this.isDownloading = !1, s || /* @__PURE__ */ Error("所有下载通道均失败");
	}
	cancelDownload() {
		this.isDownloading && (this.cancelRequested = !0, console.log("[UpdateService] 用户请求取消更新下载。"));
	}
	async startDownloadAndInstall(e, t) {
		try {
			let n = await this.downloadPackage(e, t);
			if (console.log("[UpdateService] 安装包下载完成:", n), process.platform === "win32" || process.platform === "darwin") {
				let e = await u.openPath(n);
				if (e) throw Error(`无法启动安装包: ${e}`);
				r.quit();
			}
			return { success: !0 };
		} catch (e) {
			return console.error("[UpdateService] 下载升级失败:", e), this.isDownloading = !1, {
				success: !1,
				error: e.message
			};
		}
	}
	compareVersion(e, t) {
		let n = e.replace(/^v/, "").split(".").map(Number), r = t.replace(/^v/, "").split(".").map(Number);
		for (let e = 0; e < Math.max(n.length, r.length); e++) {
			let t = n[e] || 0, i = r[e] || 0;
			if (t !== i) return t - i;
		}
		return 0;
	}
}(), B = [
	"你是一位资深人像摄影策划与独立画册编辑。",
	"请根据用户提供的主题标题和参考图片，生成一段中文文案。",
	"文案不需要描述图片的内容,包括人物，只需要体现画面的意境和氛围感觉，可以作为杂志图片下的一段文字",
	"不要超过40个字，只输出正文，不要标题、编号、解释或 Markdown。"
].join("\n"), V = "aiConfig", H = new Set(["gemini", "glm"]), re = 4, ie = "https://api.z.ai/api/paas/v4/chat/completions";
function U() {
	return {
		provider: "gemini",
		gemini: {
			model: "gemini-3.5-flash",
			apiKey: ""
		},
		glm: {
			model: "GLM-4V-Flash",
			apiKey: ""
		},
		prompt: B
	};
}
function W(e) {
	return typeof e == "string" ? e.trim() : "";
}
function G(e = {}) {
	let t = U();
	return {
		provider: H.has(e.provider) ? e.provider : t.provider,
		gemini: {
			model: W(e.gemini?.model) || t.gemini.model,
			apiKey: W(e.gemini?.apiKey)
		},
		glm: {
			model: W(e.glm?.model) || t.glm.model,
			apiKey: W(e.glm?.apiKey)
		},
		prompt: W(e.prompt) || t.prompt
	};
}
function ae(e, t) {
	if (!t || typeof t != "object") return "";
	if (typeof t.output_text == "string") return t.output_text.trim();
	if (typeof t.text == "string") return t.text.trim();
	let n = t.choices?.[0]?.message?.content;
	return typeof n == "string" ? n.trim() : Array.isArray(n) ? n.map((e) => typeof e == "string" ? e : e?.text || "").join("").trim() : t.candidates?.[0]?.content?.parts?.map((e) => e.text || "").join("").trim() || "";
}
var K = new class {
	constructor(e = {}) {
		this.store = e.store || null, this.workspaceService = e.workspaceService || { getPath: () => "" }, this.fetchImpl = e.fetchImpl || globalThis.fetch;
	}
	getStore() {
		return this.store ||= new m({ name: "ai-config" }), this.store;
	}
	setWorkspaceService(e) {
		this.workspaceService = e || { getPath: () => "" };
	}
	getConfig() {
		return G(this.getStore().get(V, U()));
	}
	saveConfig(e) {
		if (e?.provider && !H.has(e.provider)) throw Error("不支持的 AI 服务商");
		let t = G({
			...this.getConfig(),
			...e
		});
		return this.getStore().set(V, t), t;
	}
	resetPrompt() {
		let e = this.getConfig();
		return e.prompt = B, this.getStore().set(V, e), e;
	}
	async testConnection(e = {}) {
		let t = e[e.provider], n = e.provider === "gemini" ? "Gemini" : "GLM";
		if (!t?.apiKey) throw Error(`请先填写 ${n} API Key`);
		if (!t?.model) throw Error(`请先填写 ${n} 模型 ID`);
		let r = {
			title: "API 连接测试",
			description: "请仅回复 \"Hello\" 两个字母以确认 API 连接正常。"
		};
		if (e.provider === "gemini") {
			if (!(await this.callGemini(e, r, [])).text) throw Error("未返回有效数据");
		} else if (!(await this.callGlm(e, r, [])).text) throw Error("未返回有效数据");
		return !0;
	}
	async generateThemeCopy(e = {}) {
		let t = this.getConfig(), n = t[t.provider], r = t.provider === "gemini" ? "Gemini" : "GLM";
		if (!n?.apiKey) throw Error(`请先在全局设置中填写 ${r} API Key`);
		if (!n?.model) throw Error(`请先在全局设置中填写 ${r} 模型 ID`);
		let i = await this.readImageParts(e.images || []);
		return t.provider === "gemini" ? this.callGemini(t, e, i) : this.callGlm(t, e, i);
	}
	async readImageParts(e) {
		let t = this.workspaceService.getPath(), n = Array.isArray(e) ? e.slice(0, re) : [], r = [];
		for (let e of n) {
			let n = E(e);
			if (!n) continue;
			if (!k(n, t)) throw Error("图片不在当前工作区素材目录中");
			let i = await p.promises.readFile(n);
			r.push({
				mimeType: A(n),
				data: i.toString("base64")
			});
		}
		return r;
	}
	buildRuntimeContext(e = {}, t = !1) {
		return [
			"【当前主题资料】",
			`主题标题：${W(e.title) || "未命名主题"}`,
			`参考图片：${t ? "已附加，请结合图片中的场景、人物情绪、色彩和光线生成。" : "未上传，请仅根据文字信息生成。"}`
		].join("\n");
	}
	async callGemini(e, t, n) {
		let r = { contents: [{ parts: [{ text: `${e.prompt}\n\n${this.buildRuntimeContext(t, n.length > 0)}` }, ...n.map((e) => ({ inlineData: {
			mimeType: e.mimeType,
			data: e.data
		} }))] }] }, i = `https://generativelanguage.googleapis.com/v1beta/models/${e.gemini.model}:generateContent`, a = await this.postJson(i, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-goog-api-key": e.gemini.apiKey
			},
			body: JSON.stringify(r)
		});
		return { text: this.ensureGeneratedText("Gemini", a) };
	}
	async callGlm(e, t, n) {
		let r = [{
			type: "text",
			text: this.buildRuntimeContext(t, n.length > 0)
		}, ...n.map((e) => ({
			type: "image_url",
			image_url: { url: `data:${e.mimeType};base64,${e.data}` }
		}))], i = {
			model: e.glm.model,
			stream: !1,
			messages: [{
				role: "system",
				content: e.prompt
			}, {
				role: "user",
				content: r
			}]
		}, a = await this.postJson(ie, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				Authorization: `Bearer ${e.glm.apiKey}`
			},
			body: JSON.stringify(i)
		});
		return { text: this.ensureGeneratedText("GLM", a) };
	}
	async postJson(e, t) {
		if (typeof this.fetchImpl != "function") throw Error("当前运行环境不支持网络请求");
		let n = await this.fetchImpl(e, t), r = await n.json().catch(() => ({}));
		if (!n.ok) {
			let e = r?.error?.message || r?.message || `请求失败 (${n.status})`;
			throw Error(e);
		}
		return r;
	}
	ensureGeneratedText(e, t) {
		let n = ae(e, t);
		if (!n) throw Error(`${e} 未返回可用文案`);
		return n;
	}
}(), oe = d.dirname(f(import.meta.url)), q = {
	closeBehavior: "tray",
	showCloseToTrayNotice: !0,
	autoLaunch: !1
}, J = new class e {
	constructor(e = {}) {
		this.store = e.store || null, this.platform = e.platform || process.platform, this.app = e.app || null, this.Tray = e.Tray || null, this.Menu = e.Menu || null, this.nativeImage = e.nativeImage || null, this.mainWindow = null, this.tray = null, this.isQuitting = !1;
	}
	static createForTest(t = {}) {
		return new e(t);
	}
	init({ app: e, mainWindow: t, Tray: n, Menu: r, nativeImage: i }) {
		this.app = e, this.Tray = n, this.Menu = r, this.nativeImage = i, this.bindWindow(t), this.createTray(), this.applyLoginItemSettings();
	}
	bindWindow(e) {
		e && (this.mainWindow = e, e.on("close", (e) => {
			this.handleWindowClose(e);
		}));
	}
	getSettings() {
		return this.normalizeSettings(this.getStore().get("appBehavior", q));
	}
	saveSettings(e = {}) {
		let t = this.normalizeSettings({
			...this.getSettings(),
			...e
		});
		return this.getStore().set("appBehavior", t), this.applyLoginItemSettings(t), t.closeBehavior === "tray" && this.createTray(), t;
	}
	normalizeSettings(e = {}) {
		return {
			closeBehavior: e.closeBehavior === "quit" ? "quit" : q.closeBehavior,
			showCloseToTrayNotice: typeof e.showCloseToTrayNotice == "boolean" ? e.showCloseToTrayNotice : q.showCloseToTrayNotice,
			autoLaunch: typeof e.autoLaunch == "boolean" ? e.autoLaunch : q.autoLaunch
		};
	}
	getStore() {
		return this.store ||= new m({ name: "app-behavior-config" }), this.store;
	}
	getCapabilities() {
		let e = this.platform === "darwin";
		return {
			platform: this.platform,
			isMac: e,
			isWindows: this.platform === "win32",
			supportsTray: !0,
			supportsAutoLaunch: !0,
			backgroundTargetLabel: e ? "菜单栏" : "系统托盘",
			closeToBackgroundLabel: e ? "关闭窗口后继续在后台运行" : "关闭窗口后收进系统托盘",
			backgroundDescription: e ? "关闭窗口后，Portrait Planner 会继续在后台运行，可从菜单栏或 Dock 返回。" : "关闭窗口后，Portrait Planner 会继续在系统托盘运行，可从托盘图标重新打开。"
		};
	}
	shouldHideOnClose(e = this.getSettings()) {
		return !this.isQuitting && e.closeBehavior === "tray";
	}
	handleWindowClose(e) {
		return this.shouldHideOnClose() ? (e && typeof e.preventDefault == "function" && e.preventDefault(), this.handleCloseToBackground()) : "quit";
	}
	handleCloseToBackground() {
		return this.getSettings().showCloseToTrayNotice && this.sendCloseNotice() ? "notice" : (this.hideWindow(), "hide");
	}
	sendCloseNotice() {
		if (!this.mainWindow || this.mainWindow.isDestroyed()) return !1;
		let e = this.mainWindow.webContents;
		return !e || typeof e.isDestroyed == "function" && e.isDestroyed() ? !1 : (e.send("app-behavior:show-close-notice", this.getCapabilities()), !0);
	}
	resolveCloseNotice(e = {}) {
		return e.dontShowAgain === !0 && this.saveSettings({ showCloseToTrayNotice: !1 }), e.action === "quit" ? (this.requestQuit(), {
			success: !0,
			action: "quit"
		}) : (this.hideWindow(), {
			success: !0,
			action: "hide"
		});
	}
	hideWindow() {
		this.mainWindow && !this.mainWindow.isDestroyed() && this.mainWindow.hide();
	}
	showWindow(e = null) {
		!this.mainWindow || this.mainWindow.isDestroyed() || (this.mainWindow.isMinimized() && this.mainWindow.restore(), this.mainWindow.show(), this.mainWindow.focus(), e && this.mainWindow.webContents.executeJavaScript(`window.location.hash = ${JSON.stringify(e)};`, !0).catch((e) => console.error("[AppBehaviorService] 跳转设置页失败:", e)));
	}
	createTray() {
		if (this.tray || !this.Tray || !this.Menu || !this.nativeImage) return this.tray;
		let e = this.resolveTrayIconPath(), t = this.nativeImage.createFromPath(e);
		return this.platform === "darwin" && t && !t.isEmpty() && (t = t.resize({
			width: 18,
			height: 18
		}), t.setTemplateImage(!0)), this.tray = new this.Tray(t), this.tray.setToolTip("Portrait Planner"), this.tray.setContextMenu(this.buildTrayMenu()), this.tray.on("double-click", () => this.showWindow()), this.tray.on("click", () => {
			this.platform !== "darwin" && this.showWindow();
		}), this.tray;
	}
	buildTrayMenu() {
		return this.Menu.buildFromTemplate([
			{
				label: "打开 Portrait Planner",
				click: () => this.showWindow()
			},
			{
				label: "设置",
				click: () => this.showWindow("#/settings?tab=behavior")
			},
			{ type: "separator" },
			{
				label: "退出应用",
				click: () => this.requestQuit()
			}
		]);
	}
	resolveTrayIconPath() {
		let e = d.resolve(oe, "..", ".."), t = this.platform === "darwin" ? "logo.png" : "icon.ico", n = this.app && typeof this.app.getAppPath == "function" ? this.app.getAppPath() : e, r = [
			d.join(e, "build", t),
			d.join(n, "build", t),
			d.join(n, t),
			d.join(n, "dist", t),
			d.join(e, "public", t)
		];
		return r.find((e) => p.existsSync(e)) || r[0];
	}
	applyLoginItemSettings(e = this.getSettings()) {
		!this.app || typeof this.app.setLoginItemSettings != "function" || this.app.setLoginItemSettings({
			openAtLogin: e.autoLaunch,
			openAsHidden: !1
		});
	}
	markQuitting() {
		this.isQuitting = !0;
	}
	requestQuit() {
		this.markQuitting(), this.app && this.app.quit();
	}
	shouldQuitWhenAllWindowsClosed() {
		return this.isQuitting || this.getSettings().closeBehavior === "quit";
	}
	registerIpc(e) {
		e.handle("app-behavior:getSettings", () => this.getSettings()), e.handle("app-behavior:saveSettings", (e, t) => this.saveSettings(t)), e.handle("app-behavior:getCapabilities", () => this.getCapabilities()), e.handle("app-behavior:resolveCloseNotice", (e, t) => this.resolveCloseNotice(t)), e.handle("app-behavior:quit", () => (this.requestQuit(), { success: !0 }));
	}
}(), Y = d.dirname(f(import.meta.url)), X = new m({ name: "theme-config" });
K.setWorkspaceService(y);
var Z = null;
function Q() {
	let t = new e({
		width: 1440,
		height: 900,
		frame: !1,
		titleBarStyle: "hidden",
		backgroundColor: {
			default: "#E5E0D8",
			darkroom: "#121212",
			gallery: "#F5F5F7",
			sage: "#D1D5D0",
			rose: "#D9CECD",
			haze: "#C6CDD3"
		}[X.get("theme", "default")] || "#E5E0D8",
		webPreferences: {
			preload: d.join(Y, "preload.js"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	});
	return process.env.VITE_DEV_SERVER_URL ? (t.loadURL(process.env.VITE_DEV_SERVER_URL), t.webContents.openDevTools()) : t.loadFile(d.join(Y, "../dist/index.html")), t;
}
l.registerSchemesAsPrivileged([{
	scheme: "local-image",
	privileges: {
		secure: !0,
		supportFetchAPI: !0,
		standard: !0,
		bypassCSP: !0
	}
}]), r.whenReady().then(async () => {
	if (l.handle("local-image", async (e) => {
		let t = j(e.url), n = y.getPath();
		try {
			if (!k(t, n)) return new Response("Access denied", { status: 403 });
			await p.promises.access(t, p.constants.R_OK);
		} catch {
			return new Response("File not found", { status: 404 });
		}
		let r = p.createReadStream(t);
		return new Response(r, { headers: { "Content-Type": A(t) } });
	}), !await y.tryRestore() && !await y.selectWorkspace()) {
		r.quit();
		return;
	}
	Z = Q(), J.init({
		app: r,
		mainWindow: Z,
		Tray: n,
		Menu: t,
		nativeImage: s,
		dialog: a
	}), setTimeout(() => {
		let t = e.getAllWindows();
		t.length > 0 && z.autoCheck(t[0]);
	}, 4e3), t.setApplicationMenu(null), r.on("activate", () => {
		e.getAllWindows().length === 0 ? (Z = Q(), J.bindWindow(Z), J.createTray()) : J.showWindow();
	});
}), r.on("before-quit", () => {
	J.markQuitting();
}), r.on("window-all-closed", () => {
	J.shouldQuitWhenAllWindowsClosed() && (_.close(), r.quit());
}), J.registerIpc(o), o.handle("workspace:getPath", () => y.getPath()), o.handle("workspace:selectAndSet", async (t) => {
	let n = e.fromWebContents(t.sender), r = await y.selectWorkspace(n);
	return r ? {
		success: !0,
		path: r
	} : { success: !1 };
});
function $(e) {
	let t = e === "plans" ? "plans" : e;
	o.handle(`db:${t}:getAll`, () => _.getAll(e)), o.handle(`db:${t}:create`, (t, n) => _.insert(e, n)), o.handle(`db:${t}:update`, (t, n, r) => _.update(e, n, r)), o.handle(`db:${t}:delete`, async (t, n) => {
		let r = _.delete(e, n);
		return r.success && await v.deleteEntityFolder(`${e}/${n}`), r;
	}), o.handle(`db:${t}:deleteBatch`, async (t, n) => {
		let r = _.deleteBatch(e, n);
		return r.success && Promise.all(n.map((t) => v.deleteEntityFolder(`${e}/${t}`))).catch((t) => console.error(`[main] 批量删除${e}图片目录失败:`, t)), r;
	});
}
$("models"), $("locations"), $("clothing"), $("props"), $("makeup"), o.handle("db:plans:getAll", () => _.getAll("plans")), o.handle("db:plans:create", (e, t) => _.createEmptyPlan(t)), o.handle("db:plans:createFromTemplate", (e, t, n) => {
	let r = _.getById("templates", n);
	if (!r) return null;
	let i = JSON.parse(r.structure_json).map((e, n) => {
		let r = JSON.parse(JSON.stringify(se(e.type)));
		return e.type === "theme" && (r.title = t), {
			id: "m" + Date.now() + n,
			type: e.type,
			title: e.title,
			data: r
		};
	});
	return _.insert("plans", {
		title: t,
		modules_json: JSON.stringify(i)
	});
}), o.handle("db:plans:getById", (e, t) => _.getById("plans", t)), o.handle("db:plans:save", (e, t, n) => _.savePlan(t, n)), o.handle("db:plans:delete", async (e, t) => {
	let n = _.delete("plans", t);
	return n.success && await v.deleteEntityFolder(`plans/${t}`), n;
}), o.handle("db:plans:deleteBatch", async (e, t) => {
	let n = _.deleteBatch("plans", t);
	return n.success && Promise.all(t.map((e) => v.deleteEntityFolder(`plans/${e}`))).catch((e) => console.error("[main] 批量删除策划图片目录失败:", e)), n;
}), o.handle("db:templates:getAll", () => _.getTemplates()), o.handle("db:templates:save", (e, t, n) => _.saveTemplate(t, n)), o.handle("db:templates:delete", (e, t) => _.delete("templates", t)), o.handle("image:compress", async (e, t, n) => await v.compressAndStore(t, n)), o.handle("image:saveFromBuffer", async (e, t, n) => {
	let i = d.join(r.getPath("temp"), `temp_${Date.now()}.png`);
	p.writeFileSync(i, Buffer.from(t));
	let a = await v.compressAndStore(i, n);
	return p.existsSync(i) && p.unlinkSync(i), a;
}), o.handle("image:deleteFile", async (e, t) => await v.deleteFile(t)), o.handle("image:renameFolder", async (e, t, n) => await v.renameEntityFolder(t, n)), o.handle("image:copyFilesToEntity", async (e, t, n) => await v.copyFilesToEntity(t, n)), o.handle("image:selectFiles", async (t) => {
	let n = e.fromWebContents(t.sender), r = await a.showOpenDialog(n, {
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
	return r.canceled ? [] : r.filePaths;
}), o.handle("clipboard:copyImage", async (e, t) => {
	try {
		let e = t;
		if (t.startsWith("data:image/")) {
			let e = s.createFromDataURL(t);
			return e.isEmpty() ? {
				success: !1,
				error: "Failed to create image from DataURL"
			} : (i.writeImage(e), { success: !0 });
		}
		if (e = T(e), process.platform === "win32" && e.startsWith("/") && (e = e.substring(1)), !k(e, y.getPath())) return {
			success: !1,
			error: "Access denied"
		};
		if (!p.existsSync(e)) return {
			success: !1,
			error: `File not found: ${e}`
		};
		let n = s.createFromPath(e);
		return n.isEmpty() ? {
			success: !1,
			error: "Failed to load image from path"
		} : (i.writeImage(n), { success: !0 });
	} catch (e) {
		return console.error("Clipboard copy error:", e), {
			success: !1,
			error: e.message
		};
	}
}), o.handle("image:cleanupTempFolder", async (e, t) => await v.deleteEntityFolder(t)), o.handle("system:exportData", async (t, n) => {
	let r = e.fromWebContents(t.sender);
	return await F.exportData(n, r);
}), o.handle("system:importData", async (t, n) => {
	let r = e.fromWebContents(t.sender);
	return await F.importData(r, n);
}), o.handle("system:exportImage", async (t, n, r) => {
	let i = e.fromWebContents(t.sender), o = await a.showSaveDialog(i, {
		title: "导出为长图",
		defaultPath: r || "策划案_长图.jpg",
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
		return p.writeFileSync(o.filePath, t), {
			success: !0,
			filePath: o.filePath
		};
	} catch (e) {
		return console.error("Export error:", e), {
			success: !1,
			error: e.message
		};
	}
}), o.on("window-minimize", (t) => {
	e.fromWebContents(t.sender).minimize();
}), o.on("window-toggle-maximize", (t) => {
	let n = e.fromWebContents(t.sender);
	n.isMaximized() ? n.unmaximize() : n.maximize();
}), o.on("window-close", (t) => {
	e.fromWebContents(t.sender).close();
}), o.handle("theme:getSaved", () => X.get("theme", "default")), o.handle("theme:save", (e, t) => (X.set("theme", t), { success: !0 })), o.on("theme:setBackgroundColor", (t, n) => {
	let r = e.fromWebContents(t.sender);
	r && !r.isDestroyed() && r.setBackgroundColor(n);
}), o.handle("ai:getConfig", () => K.getConfig()), o.handle("ai:saveConfig", (e, t) => K.saveConfig(t)), o.handle("ai:resetPrompt", () => K.resetPrompt()), o.handle("ai:generateThemeCopy", async (e, t) => await K.generateThemeCopy(t)), o.handle("ai:testConnection", async (e, t) => await K.testConnection(t)), o.handle("system:openExternal", async (e, t) => (await u.openExternal(t), { success: !0 })), o.handle("app:getVersion", () => r.getVersion()), o.handle("update:check", () => z.manualCheck()), o.handle("update:ignore", (e, t) => z.ignoreVersion(t)), o.handle("update:download", (t, n) => {
	let r = e.fromWebContents(t.sender);
	return z.startDownloadAndInstall(n, r);
}), o.handle("update:cancel", () => (z.cancelDownload(), { success: !0 }));
function se(e) {
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
		clothing: { items: [] },
		props: { items: [] },
		makeup: {
			name: "",
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

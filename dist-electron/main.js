import { BrowserWindow as e, Menu as t, app as n, clipboard as r, dialog as i, ipcMain as a, nativeImage as o, net as s, protocol as c, shell as l } from "electron";
import u from "path";
import { fileURLToPath as d } from "url";
import f from "fs";
import p from "electron-store";
import m from "better-sqlite3";
import h from "sharp";
import g from "crypto";
var _ = new class e {
	constructor() {
		this.db = null;
	}
	init(e) {
		let t = u.join(e, "database.sqlite");
		this.db = new m(t), this.db.pragma("journal_mode = WAL"), this._createTables();
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
		let r = u.join(this.workspacePath, "images", ...n);
		if (!this._isPathWithinWorkspace(r)) throw Error("拒绝写入非工作区目录");
		f.existsSync(r) || f.mkdirSync(r, { recursive: !0 });
		let i = u.extname(e).toLowerCase() || ".jpg", a = g.randomBytes(8).toString("hex"), o = `${Date.now()}_${a}${i}`, s = u.join(r, o);
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
			return f.writeFileSync(s, a), {
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
		let t = u.normalize(e), n = u.normalize(u.join(this.workspacePath, "images"));
		return t.startsWith(n + u.sep) || t === n;
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
		let n = u.join(this.workspacePath, "images", ...t);
		if (!this._isPathWithinWorkspace(n)) {
			console.warn(`[ImageService] 拒绝删除非工作区目录: ${n}`);
			return;
		}
		try {
			let e = !1;
			f.existsSync(n) && (f.rmSync(n, {
				recursive: !0,
				force: !0
			}), console.log(`[ImageService] 已清理资源目录: ${n}`), e = !0);
			let r = t[t.length - 1];
			if (/^\d+$/.test(r)) {
				let n = u.join(this.workspacePath, "images", ...t.slice(0, -1));
				if (f.existsSync(n)) {
					let t = f.readdirSync(n);
					for (let i of t) {
						let t = u.join(n, i);
						f.statSync(t).isDirectory() && (i.endsWith(`_${r}`) || i === r) && (f.rmSync(t, {
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
		let r = u.join(this.workspacePath, "images", ...n);
		if (!this._isPathWithinWorkspace(r)) throw Error("拒绝写入非工作区目录");
		f.existsSync(r) || f.mkdirSync(r, { recursive: !0 });
		let i = [];
		return e.forEach((e, t) => {
			if (!e || !f.existsSync(e)) return;
			let n = u.extname(e).toLowerCase() || ".jpg", a = g.randomBytes(8).toString("hex"), o = `${Date.now()}_copy_${t}_${a}${n}`, s = u.join(r, o);
			try {
				f.copyFileSync(e, s), i.push({
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
			let t = u.normalize(e);
			return !this._isPathWithinWorkspace(t) && t !== u.normalize(u.join(this.workspacePath, "images")) ? (console.warn(`[ImageService] 拒绝删除非工作区图片: ${e}`), {
				success: !1,
				error: "Access denied"
			}) : f.existsSync(t) ? (f.unlinkSync(t), { success: !0 }) : {
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
		let i = u.join(this.workspacePath, "images", ...n), a = u.join(this.workspacePath, "images", ...r);
		if (!this._isPathWithinWorkspace(i) || !this._isPathWithinWorkspace(a)) return console.warn(`[ImageService] 拒绝重命名非工作区目录: ${i} -> ${a}`), {
			success: !1,
			error: "Access denied"
		};
		try {
			if (f.existsSync(i)) {
				let e = u.dirname(a);
				return f.existsSync(e) || f.mkdirSync(e, { recursive: !0 }), f.renameSync(i, a), console.log(`[ImageService] 文件夹已重命名: ${i} -> ${a}`), { success: !0 };
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
		this.store = new p({ name: "workspace-config" }), this.currentPath = null;
	}
	getSavedPath() {
		return this.store.get("workspacePath", null);
	}
	async selectWorkspace(e = null) {
		let t = await i.showOpenDialog(e, {
			title: "选择工作区文件夹 (Portrait Planner)",
			properties: ["openDirectory", "createDirectory"]
		});
		if (t.canceled || t.filePaths.length === 0) return null;
		let n = t.filePaths[0];
		return await this.initWorkspace(n), n;
	}
	async initWorkspace(e) {
		let t = [
			u.join(e, "images", "models"),
			u.join(e, "images", "locations"),
			u.join(e, "images", "plans"),
			u.join(e, "images", "clothing"),
			u.join(e, "images", "props"),
			u.join(e, "images", "makeup"),
			u.join(e, "exports")
		];
		for (let e of t) f.existsSync(e) || f.mkdirSync(e, { recursive: !0 });
		_.init(e), v.setWorkspace(e), this.currentPath = e, this.store.set("workspacePath", e);
	}
	async tryRestore() {
		let e = this.getSavedPath();
		return e && f.existsSync(e) ? (await this.initWorkspace(e), !0) : !1;
	}
	getPath() {
		return this.currentPath;
	}
	async initDefault() {
		let e = u.join(n.getPath("documents"), "PortraitPlanner");
		return await this.initWorkspace(e), e;
	}
}(), b = new Set([
	".jpg",
	".jpeg",
	".png",
	".webp",
	".gif",
	".bmp"
]), ee = {
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
	let t = u.resolve(e);
	return process.platform === "win32" ? t.toLowerCase() : t;
}
function te(e, t) {
	if (!e || !t) return !1;
	let n = D(e), r = D(t), i = u.relative(n, r);
	return i === "" || !!i && !i.startsWith("..") && !u.isAbsolute(i);
}
function O(e) {
	return b.has(u.extname(e || "").toLowerCase());
}
function k(e, t) {
	return !e || !t || !O(e) ? !1 : te(u.join(t, "images"), e);
}
function A(e) {
	return ee[u.extname(e || "").toLowerCase()] || "image/jpeg";
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
					f.existsSync(t) && (n.images[t] = f.readFileSync(t, "base64"));
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
			let a = await i.showSaveDialog(t, {
				title: "导出数据",
				defaultPath: "PortraitPlanner_Data.ppexport",
				filters: [{
					name: "PortraitPlanner Export File",
					extensions: ["ppexport"]
				}]
			});
			return a.canceled || !a.filePath ? {
				success: !1,
				error: "User canceled"
			} : (f.writeFileSync(a.filePath, JSON.stringify(n)), {
				success: !0,
				filePath: a.filePath
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
				let t = await i.showOpenDialog(e, {
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
			let a = f.statSync(r), o = f.readFileSync(r, "utf-8"), s = JSON.parse(o);
			N(s, a.size), n = u.join(y.getPath(), "images", "import_temp"), f.existsSync(n) || f.mkdirSync(n, { recursive: !0 });
			let c = {};
			if (s.images) for (let [e, t] of Object.entries(s.images)) {
				let r = Buffer.from(t, "base64"), i = g.randomBytes(8).toString("hex"), a = u.extname(e) || ".jpg", o = `${Date.now()}_${i}${a}`, s = u.join(n, o);
				f.writeFileSync(s, r), c[e] = s;
				let l = E(e);
				l && (c[l] = s);
			}
			let l = (e) => {
				let t = E(e);
				return t && (c[t] || t);
			}, d = (e, t, n, r, i) => {
				let a = E(e);
				if (!a) return e;
				let o = l(a);
				return o && o !== a && (o = p(o, t, n, r, i)), e && typeof e == "object" ? {
					...e,
					path: o,
					url: m(o)
				} : {
					path: o,
					url: m(o),
					ratio: 1
				};
			}, p = (e, t, n, r = "", i = 0) => {
				if (!e || !f.existsSync(e)) return e;
				let a = r ? P(r) : "", o = a && a !== "unnamed" ? `${a}_${n}` : String(n), s = u.join(y.getPath(), "images", t, o);
				f.existsSync(s) || f.mkdirSync(s, { recursive: !0 });
				let c = u.extname(e) || ".jpg", l = `${Date.now()}_${i}${c}`, d = u.join(s, l);
				try {
					return f.copyFileSync(e, d), d;
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
					i && i !== t.avatar_path && (i = p(i, "models", r, n.name, "avatar"));
					let a = l(t.model_card_path);
					a && a !== t.model_card_path && (a = p(a, "models", r, n.name, "modelcard"));
					let o = JSON.parse(t.images_json || "[]").map((e, t) => d(e, "models", r, n.name, `photo_${t}`));
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
					i && i !== t.cover_path && (i = p(i, "locations", r, n.name, "cover"));
					let a = JSON.parse(t.images_json || "[]").map((e, t) => d(e, "locations", r, n.name, `photo_${t}`));
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
					i && i !== t.cover_path && (i = p(i, "plans", r, n.title, "cover"));
					let a = JSON.parse(t.modules_json || "[]");
					a.forEach((e, t) => {
						if (e.data?.images && (e.data.images = e.data.images.map((e, i) => d(e, "plans", r, n.title, `mod_${t}_img_${i}`))), e.data?.avatar) {
							let i = l(e.data.avatarPath || e.data.avatar);
							i && i !== (e.data.avatarPath || e.data.avatar) && (i = p(i, "plans", r, n.title, `mod_${t}_avatar`)), e.data.avatarPath ? (e.data.avatarPath = i, e.data.avatar = m(i)) : (e.data.avatar = i, e.data.avatar && !e.data.avatar.startsWith("local-image://") && (e.data.avatar = m(i)));
						}
						if (e.data?.modelCard) {
							let i = l(e.data.modelCardPath || e.data.modelCard);
							i && i !== (e.data.modelCardPath || e.data.modelCard) && (i = p(i, "plans", r, n.title, `mod_${t}_modelcard`)), e.data.modelCardPath ? (e.data.modelCardPath = i, e.data.modelCard = m(i)) : (e.data.modelCard = i, e.data.modelCard && !e.data.modelCard.startsWith("local-image://") && (e.data.modelCard = m(i)));
						}
						e.data?.items && e.data.items.forEach((e, i) => {
							e.images &&= e.images.map((e, a) => d(e, "plans", r, n.title, `mod_${t}_item_${i}_img_${a}`));
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
					let n = _.insert("clothing", t), r = n.id, i = JSON.parse(t.images_json || "[]").map((e, t) => d(e, "clothing", r, n.name, `photo_${t}`));
					_.update("clothing", r, { images_json: JSON.stringify(i) });
				}
				if (s.data.props) for (let e of s.data.props) {
					let t = {};
					_.constructor.VALID_COLUMNS.props.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = _.insert("props", t), r = n.id, i = JSON.parse(t.images_json || "[]").map((e, t) => d(e, "props", r, n.name, `photo_${t}`));
					_.update("props", r, { images_json: JSON.stringify(i) });
				}
				if (s.data.makeup) for (let e of s.data.makeup) {
					let t = {};
					_.constructor.VALID_COLUMNS.makeup.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = _.insert("makeup", t), r = n.id, i = JSON.parse(t.images_json || "[]").map((e, t) => d(e, "makeup", r, n.name, `photo_${t}`));
					_.update("makeup", r, { images_json: JSON.stringify(i) });
				}
			}), f.existsSync(n)) try {
				f.rmSync(n, {
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
			if (n && f.existsSync(n)) try {
				f.rmSync(n, {
					recursive: !0,
					force: !0
				});
			} catch (e) {
				console.warn("[ExportService] 清理临时文件夹失败:", e);
			}
		}
	}
}(), I = "sepzerg1989-oss", L = "Desktop-Portrait-Planner", R = new p(), z = new class {
	constructor() {
		this.currentVersion = n.getVersion(), this.tempFilePath = null, this.isDownloading = !1;
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
			let e = await s.fetch(t, {
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
		let r = [e];
		e.includes("github.com") && [
			"https://gh-proxy.com/",
			"https://ghproxy.net/",
			"https://ghproxy.homeboyc.cn/"
		].reverse().forEach((t) => {
			r.unshift(`${t}${e}`);
		});
		let i = process.platform === "darwin" ? ".dmg" : ".exe", a = `PortraitPlanner_Update_${Date.now()}${i}`, o = u.join(n.getPath("temp"), a);
		this.tempFilePath = o;
		let c = null;
		for (let e of r) {
			console.log(`[UpdateService] 正在尝试下载安装包: ${e}`);
			let n = f.createWriteStream(o);
			try {
				let r = await s.fetch(e, {
					method: "GET",
					redirect: "follow"
				});
				if (!r.ok) throw Error(`状态码异常: ${r.status}`);
				let i = parseInt(r.headers.get("content-length"), 10) || 0, a = 0, c = r.body.getReader();
				for (;;) {
					if (this.cancelRequested) throw Error("USER_CANCELLED");
					let { done: e, value: r } = await c.read();
					if (e) break;
					if (n.write(Buffer.from(r)), a += r.length, i > 0) {
						let e = Math.round(a / i * 100);
						t && !t.isDestroyed() && t.webContents.send("update:download-progress", e);
					}
				}
				return n.end(), this.isDownloading = !1, console.log(`[UpdateService] 成功从地址下载完成: ${e}`), o;
			} catch (t) {
				if (console.warn(`[UpdateService] 从地址下载失败: ${e}，错误信息: ${t.message}`), c = t, n.close(), f.existsSync(o)) try {
					f.unlinkSync(o);
				} catch {}
				if (t.message === "USER_CANCELLED") break;
			}
		}
		throw this.isDownloading = !1, c || /* @__PURE__ */ Error("所有下载通道均失败");
	}
	cancelDownload() {
		this.isDownloading && (this.cancelRequested = !0, console.log("[UpdateService] 用户请求取消更新下载。"));
	}
	async startDownloadAndInstall(e, t) {
		try {
			let r = await this.downloadPackage(e, t);
			if (console.log("[UpdateService] 安装包下载完成:", r), process.platform === "win32" || process.platform === "darwin") {
				let e = await l.openPath(r);
				if (e) throw Error(`无法启动安装包: ${e}`);
				n.quit();
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
].join("\n"), V = "aiConfig", H = new Set(["gemini", "glm"]), U = 4, W = "https://api.z.ai/api/paas/v4/chat/completions";
function G() {
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
function K(e) {
	return typeof e == "string" ? e.trim() : "";
}
function q(e = {}) {
	let t = G();
	return {
		provider: H.has(e.provider) ? e.provider : t.provider,
		gemini: {
			model: K(e.gemini?.model) || t.gemini.model,
			apiKey: K(e.gemini?.apiKey)
		},
		glm: {
			model: K(e.glm?.model) || t.glm.model,
			apiKey: K(e.glm?.apiKey)
		},
		prompt: K(e.prompt) || t.prompt
	};
}
function J(e, t) {
	if (!t || typeof t != "object") return "";
	if (typeof t.output_text == "string") return t.output_text.trim();
	if (typeof t.text == "string") return t.text.trim();
	let n = t.choices?.[0]?.message?.content;
	return typeof n == "string" ? n.trim() : Array.isArray(n) ? n.map((e) => typeof e == "string" ? e : e?.text || "").join("").trim() : t.candidates?.[0]?.content?.parts?.map((e) => e.text || "").join("").trim() || "";
}
var Y = new class {
	constructor(e = {}) {
		this.store = e.store || null, this.workspaceService = e.workspaceService || { getPath: () => "" }, this.fetchImpl = e.fetchImpl || globalThis.fetch;
	}
	getStore() {
		return this.store ||= new p({ name: "ai-config" }), this.store;
	}
	setWorkspaceService(e) {
		this.workspaceService = e || { getPath: () => "" };
	}
	getConfig() {
		return q(this.getStore().get(V, G()));
	}
	saveConfig(e) {
		if (e?.provider && !H.has(e.provider)) throw Error("不支持的 AI 服务商");
		let t = q({
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
		let t = this.workspaceService.getPath(), n = Array.isArray(e) ? e.slice(0, U) : [], r = [];
		for (let e of n) {
			let n = E(e);
			if (!n) continue;
			if (!k(n, t)) throw Error("图片不在当前工作区素材目录中");
			let i = await f.promises.readFile(n);
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
			`主题标题：${K(e.title) || "未命名主题"}`,
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
		}, a = await this.postJson(W, {
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
		let n = J(e, t);
		if (!n) throw Error(`${e} 未返回可用文案`);
		return n;
	}
}(), X = u.dirname(d(import.meta.url)), Z = new p({ name: "theme-config" });
Y.setWorkspaceService(y);
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
		}[Z.get("theme", "default")] || "#E5E0D8",
		webPreferences: {
			preload: u.join(X, "preload.js"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	});
	process.env.VITE_DEV_SERVER_URL ? (t.loadURL(process.env.VITE_DEV_SERVER_URL), t.webContents.openDevTools()) : t.loadFile(u.join(X, "../dist/index.html"));
}
c.registerSchemesAsPrivileged([{
	scheme: "local-image",
	privileges: {
		secure: !0,
		supportFetchAPI: !0,
		standard: !0,
		bypassCSP: !0
	}
}]), n.whenReady().then(async () => {
	if (c.handle("local-image", async (e) => {
		let t = j(e.url), n = y.getPath();
		try {
			if (!k(t, n)) return new Response("Access denied", { status: 403 });
			await f.promises.access(t, f.constants.R_OK);
		} catch {
			return new Response("File not found", { status: 404 });
		}
		let r = f.createReadStream(t);
		return new Response(r, { headers: { "Content-Type": A(t) } });
	}), !await y.tryRestore() && !await y.selectWorkspace()) {
		n.quit();
		return;
	}
	Q(), setTimeout(() => {
		let t = e.getAllWindows();
		t.length > 0 && z.autoCheck(t[0]);
	}, 4e3), t.setApplicationMenu(null), n.on("activate", () => {
		e.getAllWindows().length === 0 && Q();
	});
}), n.on("window-all-closed", () => {
	_.close(), process.platform !== "darwin" && n.quit();
}), a.handle("workspace:getPath", () => y.getPath()), a.handle("workspace:selectAndSet", async (t) => {
	let n = e.fromWebContents(t.sender), r = await y.selectWorkspace(n);
	return r ? {
		success: !0,
		path: r
	} : { success: !1 };
});
function $(e) {
	let t = e === "plans" ? "plans" : e;
	a.handle(`db:${t}:getAll`, () => _.getAll(e)), a.handle(`db:${t}:create`, (t, n) => _.insert(e, n)), a.handle(`db:${t}:update`, (t, n, r) => _.update(e, n, r)), a.handle(`db:${t}:delete`, async (t, n) => {
		let r = _.delete(e, n);
		return r.success && await v.deleteEntityFolder(`${e}/${n}`), r;
	}), a.handle(`db:${t}:deleteBatch`, async (t, n) => {
		let r = _.deleteBatch(e, n);
		return r.success && Promise.all(n.map((t) => v.deleteEntityFolder(`${e}/${t}`))).catch((t) => console.error(`[main] 批量删除${e}图片目录失败:`, t)), r;
	});
}
$("models"), $("locations"), $("clothing"), $("props"), $("makeup"), a.handle("db:plans:getAll", () => _.getAll("plans")), a.handle("db:plans:create", (e, t) => _.createEmptyPlan(t)), a.handle("db:plans:createFromTemplate", (e, t, n) => {
	let r = _.getById("templates", n);
	if (!r) return null;
	let i = JSON.parse(r.structure_json).map((e, n) => {
		let r = JSON.parse(JSON.stringify(ne(e.type)));
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
}), a.handle("db:plans:getById", (e, t) => _.getById("plans", t)), a.handle("db:plans:save", (e, t, n) => _.savePlan(t, n)), a.handle("db:plans:delete", async (e, t) => {
	let n = _.delete("plans", t);
	return n.success && await v.deleteEntityFolder(`plans/${t}`), n;
}), a.handle("db:plans:deleteBatch", async (e, t) => {
	let n = _.deleteBatch("plans", t);
	return n.success && Promise.all(t.map((e) => v.deleteEntityFolder(`plans/${e}`))).catch((e) => console.error("[main] 批量删除策划图片目录失败:", e)), n;
}), a.handle("db:templates:getAll", () => _.getTemplates()), a.handle("db:templates:save", (e, t, n) => _.saveTemplate(t, n)), a.handle("db:templates:delete", (e, t) => _.delete("templates", t)), a.handle("image:compress", async (e, t, n) => await v.compressAndStore(t, n)), a.handle("image:saveFromBuffer", async (e, t, r) => {
	let i = u.join(n.getPath("temp"), `temp_${Date.now()}.png`);
	f.writeFileSync(i, Buffer.from(t));
	let a = await v.compressAndStore(i, r);
	return f.existsSync(i) && f.unlinkSync(i), a;
}), a.handle("image:deleteFile", async (e, t) => await v.deleteFile(t)), a.handle("image:renameFolder", async (e, t, n) => await v.renameEntityFolder(t, n)), a.handle("image:copyFilesToEntity", async (e, t, n) => await v.copyFilesToEntity(t, n)), a.handle("image:selectFiles", async (t) => {
	let n = e.fromWebContents(t.sender), r = await i.showOpenDialog(n, {
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
}), a.handle("clipboard:copyImage", async (e, t) => {
	try {
		let e = t;
		if (t.startsWith("data:image/")) {
			let e = o.createFromDataURL(t);
			return e.isEmpty() ? {
				success: !1,
				error: "Failed to create image from DataURL"
			} : (r.writeImage(e), { success: !0 });
		}
		if (e = T(e), process.platform === "win32" && e.startsWith("/") && (e = e.substring(1)), !k(e, y.getPath())) return {
			success: !1,
			error: "Access denied"
		};
		if (!f.existsSync(e)) return {
			success: !1,
			error: `File not found: ${e}`
		};
		let n = o.createFromPath(e);
		return n.isEmpty() ? {
			success: !1,
			error: "Failed to load image from path"
		} : (r.writeImage(n), { success: !0 });
	} catch (e) {
		return console.error("Clipboard copy error:", e), {
			success: !1,
			error: e.message
		};
	}
}), a.handle("image:cleanupTempFolder", async (e, t) => await v.deleteEntityFolder(t)), a.handle("system:exportData", async (t, n) => {
	let r = e.fromWebContents(t.sender);
	return await F.exportData(n, r);
}), a.handle("system:importData", async (t, n) => {
	let r = e.fromWebContents(t.sender);
	return await F.importData(r, n);
}), a.handle("system:exportImage", async (t, n, r) => {
	let a = e.fromWebContents(t.sender), o = await i.showSaveDialog(a, {
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
		return f.writeFileSync(o.filePath, t), {
			success: !0,
			filePath: o.filePath
		};
	} catch (e) {
		return console.error("Export error:", e), {
			success: !1,
			error: e.message
		};
	}
}), a.on("window-minimize", (t) => {
	e.fromWebContents(t.sender).minimize();
}), a.on("window-toggle-maximize", (t) => {
	let n = e.fromWebContents(t.sender);
	n.isMaximized() ? n.unmaximize() : n.maximize();
}), a.on("window-close", (t) => {
	e.fromWebContents(t.sender).close();
}), a.handle("theme:getSaved", () => Z.get("theme", "default")), a.handle("theme:save", (e, t) => (Z.set("theme", t), { success: !0 })), a.on("theme:setBackgroundColor", (t, n) => {
	let r = e.fromWebContents(t.sender);
	r && !r.isDestroyed() && r.setBackgroundColor(n);
}), a.handle("ai:getConfig", () => Y.getConfig()), a.handle("ai:saveConfig", (e, t) => Y.saveConfig(t)), a.handle("ai:resetPrompt", () => Y.resetPrompt()), a.handle("ai:generateThemeCopy", async (e, t) => await Y.generateThemeCopy(t)), a.handle("ai:testConnection", async (e, t) => await Y.testConnection(t)), a.handle("system:openExternal", async (e, t) => (await l.openExternal(t), { success: !0 })), a.handle("app:getVersion", () => n.getVersion()), a.handle("update:check", () => z.manualCheck()), a.handle("update:ignore", (e, t) => z.ignoreVersion(t)), a.handle("update:download", (t, n) => {
	let r = e.fromWebContents(t.sender);
	return z.startDownloadAndInstall(n, r);
}), a.handle("update:cancel", () => (z.cancelDownload(), { success: !0 }));
function ne(e) {
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

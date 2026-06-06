import { BrowserWindow as e, Menu as t, app as n, dialog as r, ipcMain as i, net as a, protocol as o, shell as s } from "electron";
import c from "path";
import { fileURLToPath as l } from "url";
import u from "fs";
import d from "electron-store";
import f from "better-sqlite3";
import p from "sharp";
import m from "crypto";
import { spawn as h } from "child_process";
var g = new class e {
	constructor() {
		this.db = null;
	}
	init(e) {
		let t = c.join(e, "database.sqlite");
		this.db = new f(t), this.db.pragma("journal_mode = WAL"), this._createTables();
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
}(), _ = new class {
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
		let r = c.join(this.workspacePath, "images", ...n);
		if (!this._isPathWithinWorkspace(r)) throw Error("拒绝写入非工作区目录");
		u.existsSync(r) || u.mkdirSync(r, { recursive: !0 });
		let i = c.extname(e).toLowerCase() || ".jpg", a = m.randomBytes(8).toString("hex"), o = `${Date.now()}_${a}${i}`, s = c.join(r, o);
		try {
			let t = p(e).rotate(), n = await t.metadata(), r = t, i = n.width;
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
			let o = await p(a).metadata(), c = o.width / o.height;
			return u.writeFileSync(s, a), {
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
		let t = c.normalize(e), n = c.normalize(c.join(this.workspacePath, "images"));
		return t.startsWith(n + c.sep) || t === n;
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
		let n = c.join(this.workspacePath, "images", ...t);
		if (!this._isPathWithinWorkspace(n)) {
			console.warn(`[ImageService] 拒绝删除非工作区目录: ${n}`);
			return;
		}
		try {
			let e = !1;
			u.existsSync(n) && (u.rmSync(n, {
				recursive: !0,
				force: !0
			}), console.log(`[ImageService] 已清理资源目录: ${n}`), e = !0);
			let r = t[t.length - 1];
			if (/^\d+$/.test(r)) {
				let n = c.join(this.workspacePath, "images", ...t.slice(0, -1));
				if (u.existsSync(n)) {
					let t = u.readdirSync(n);
					for (let i of t) {
						let t = c.join(n, i);
						u.statSync(t).isDirectory() && (i.endsWith(`_${r}`) || i === r) && (u.rmSync(t, {
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
		let r = c.join(this.workspacePath, "images", ...n);
		if (!this._isPathWithinWorkspace(r)) throw Error("拒绝写入非工作区目录");
		u.existsSync(r) || u.mkdirSync(r, { recursive: !0 });
		let i = [];
		return e.forEach((e, t) => {
			if (!e || !u.existsSync(e)) return;
			let n = c.extname(e).toLowerCase() || ".jpg", a = m.randomBytes(8).toString("hex"), o = `${Date.now()}_copy_${t}_${a}${n}`, s = c.join(r, o);
			try {
				u.copyFileSync(e, s), i.push({
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
			let t = c.normalize(e);
			return !this._isPathWithinWorkspace(t) && t !== c.normalize(c.join(this.workspacePath, "images")) ? (console.warn(`[ImageService] 拒绝删除非工作区图片: ${e}`), {
				success: !1,
				error: "Access denied"
			}) : u.existsSync(t) ? (u.unlinkSync(t), { success: !0 }) : {
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
		let i = c.join(this.workspacePath, "images", ...n), a = c.join(this.workspacePath, "images", ...r);
		if (!this._isPathWithinWorkspace(i) || !this._isPathWithinWorkspace(a)) return console.warn(`[ImageService] 拒绝重命名非工作区目录: ${i} -> ${a}`), {
			success: !1,
			error: "Access denied"
		};
		try {
			if (u.existsSync(i)) {
				let e = c.dirname(a);
				return u.existsSync(e) || u.mkdirSync(e, { recursive: !0 }), u.renameSync(i, a), console.log(`[ImageService] 文件夹已重命名: ${i} -> ${a}`), { success: !0 };
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
}(), v = new class {
	constructor() {
		this.store = new d({ name: "workspace-config" }), this.currentPath = null;
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
			c.join(e, "images", "models"),
			c.join(e, "images", "locations"),
			c.join(e, "images", "plans"),
			c.join(e, "exports")
		];
		for (let e of t) u.existsSync(e) || u.mkdirSync(e, { recursive: !0 });
		g.init(e), _.setWorkspace(e), this.currentPath = e, this.store.set("workspacePath", e);
	}
	async tryRestore() {
		let e = this.getSavedPath();
		return e && u.existsSync(e) ? (await this.initWorkspace(e), !0) : !1;
	}
	getPath() {
		return this.currentPath;
	}
	async initDefault() {
		let e = c.join(n.getPath("documents"), "PortraitPlanner");
		return await this.initWorkspace(e), e;
	}
}(), y = (e) => (e || "").replace(/[\\\/:*?"<>|]/g, "_").trim() || "unnamed", b = new class {
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
			}, i = (e) => {
				if (!(!e || n.images[e])) try {
					u.existsSync(e) && (n.images[e] = u.readFileSync(e, "base64"));
				} catch (t) {
					console.warn("[ExportService] 读取图片失败:", e, t);
				}
			};
			if (e.planIds && Array.isArray(e.planIds)) for (let t of e.planIds) {
				let e = g.getById("plans", t);
				e && (n.data.plans.push(e), e.cover_path && i(e.cover_path), JSON.parse(e.modules_json || "[]").forEach((e) => {
					e.data?.images && e.data.images.forEach((e) => i(e.path)), e.data?.avatar && i(e.data.avatar), e.data?.modelCard && i(e.data.modelCard), e.data?.items && e.data.items.forEach((e) => {
						e.images && e.images.forEach((e) => i(e.path));
					});
				}));
			}
			if (e.modelIds && Array.isArray(e.modelIds)) for (let t of e.modelIds) {
				let e = g.getById("models", t);
				e && (n.data.models.push(e), e.avatar_path && i(e.avatar_path), e.model_card_path && i(e.model_card_path), JSON.parse(e.images_json || "[]").forEach((e) => i(e.path)));
			}
			if (e.locationIds && Array.isArray(e.locationIds)) for (let t of e.locationIds) {
				let e = g.getById("locations", t);
				e && (n.data.locations.push(e), e.cover_path && i(e.cover_path), JSON.parse(e.images_json || "[]").forEach((e) => i(e.path)));
			}
			if (e.clothingIds && Array.isArray(e.clothingIds)) for (let t of e.clothingIds) {
				let e = g.getById("clothing", t);
				e && (n.data.clothing.push(e), JSON.parse(e.images_json || "[]").forEach((e) => i(e.path)));
			}
			if (e.propsIds && Array.isArray(e.propsIds)) for (let t of e.propsIds) {
				let e = g.getById("props", t);
				e && (n.data.props.push(e), JSON.parse(e.images_json || "[]").forEach((e) => i(e.path)));
			}
			if (e.makeupIds && Array.isArray(e.makeupIds)) for (let t of e.makeupIds) {
				let e = g.getById("makeup", t);
				e && (n.data.makeup.push(e), JSON.parse(e.images_json || "[]").forEach((e) => i(e.path)));
			}
			let a = await r.showSaveDialog(t, {
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
			} : (u.writeFileSync(a.filePath, JSON.stringify(n)), {
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
		try {
			let n = t;
			if (!n) {
				let t = await r.showOpenDialog(e, {
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
				n = t.filePaths[0];
			}
			let i = u.readFileSync(n, "utf-8"), a = JSON.parse(i);
			if (a.type !== "portraitplanner-export") throw Error("无效的导出文件格式");
			let o = c.join(v.getPath(), "images", "import_temp");
			u.existsSync(o) || u.mkdirSync(o, { recursive: !0 });
			let s = {};
			if (a.images) for (let [e, t] of Object.entries(a.images)) {
				let n = Buffer.from(t, "base64"), r = m.randomBytes(8).toString("hex"), i = c.extname(e) || ".jpg", a = `${Date.now()}_${r}${i}`, l = c.join(o, a);
				u.writeFileSync(l, n), s[e] = l;
			}
			let l = (e) => e && (s[e] || e), d = (e, t, n, r = "", i = 0) => {
				if (!e || !u.existsSync(e)) return e;
				let a = r ? y(r) : "", o = a && a !== "unnamed" ? `${a}_${n}` : String(n), s = c.join(v.getPath(), "images", t, o);
				u.existsSync(s) || u.mkdirSync(s, { recursive: !0 });
				let l = c.extname(e) || ".jpg", d = `${Date.now()}_${i}${l}`, f = c.join(s, d);
				try {
					return u.copyFileSync(e, f), f;
				} catch (t) {
					return console.error("[ExportService] 复制文件失败:", t), e;
				}
			}, f = (e) => e ? `local-image://host/${e.replace(/\\/g, "/")}` : "";
			if (g.transaction(() => {
				if (a.data.models) for (let e of a.data.models) {
					let t = {};
					g.constructor.VALID_COLUMNS.models.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = g.insert("models", t), r = n.id, i = l(t.avatar_path);
					i && i !== t.avatar_path && (i = d(i, "models", r, n.name, "avatar"));
					let a = l(t.model_card_path);
					a && a !== t.model_card_path && (a = d(a, "models", r, n.name, "modelcard"));
					let o = JSON.parse(t.images_json || "[]");
					o.forEach((e, t) => {
						if (e && typeof e == "object") {
							let i = l(e.path);
							i && i !== e.path && (i = d(i, "models", r, n.name, `photo_${t}`)), e.path = i, e.url = f(i);
						}
					}), g.update("models", r, {
						avatar_path: i,
						model_card_path: a,
						images_json: JSON.stringify(o)
					});
				}
				if (a.data.locations) for (let e of a.data.locations) {
					let t = {};
					g.constructor.VALID_COLUMNS.locations.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = g.insert("locations", t), r = n.id, i = l(t.cover_path);
					i && i !== t.cover_path && (i = d(i, "locations", r, n.name, "cover"));
					let a = JSON.parse(t.images_json || "[]");
					a.forEach((e, t) => {
						if (e && typeof e == "object") {
							let i = l(e.path);
							i && i !== e.path && (i = d(i, "locations", r, n.name, `photo_${t}`)), e.path = i, e.url = f(i);
						}
					}), g.update("locations", r, {
						cover_path: i,
						images_json: JSON.stringify(a)
					});
				}
				if (a.data.plans) for (let e of a.data.plans) {
					let t = {};
					g.constructor.VALID_COLUMNS.plans.forEach((n) => {
						n !== "id" && n !== "created_at" && n !== "updated_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = g.insert("plans", t), r = n.id, i = l(t.cover_path);
					i && i !== t.cover_path && (i = d(i, "plans", r, n.title, "cover"));
					let a = JSON.parse(t.modules_json || "[]");
					a.forEach((e, t) => {
						if (e.data?.images && e.data.images.forEach((e, i) => {
							if (e && typeof e == "object") {
								let a = l(e.path);
								a && a !== e.path && (a = d(a, "plans", r, n.title, `mod_${t}_img_${i}`)), e.path = a, e.url = f(e.path);
							}
						}), e.data?.avatar) {
							let i = l(e.data.avatarPath || e.data.avatar);
							i && i !== (e.data.avatarPath || e.data.avatar) && (i = d(i, "plans", r, n.title, `mod_${t}_avatar`)), e.data.avatarPath ? (e.data.avatarPath = i, e.data.avatar = f(i)) : (e.data.avatar = i, e.data.avatar && !e.data.avatar.startsWith("local-image://") && (e.data.avatar = f(i)));
						}
						if (e.data?.modelCard) {
							let i = l(e.data.modelCardPath || e.data.modelCard);
							i && i !== (e.data.modelCardPath || e.data.modelCard) && (i = d(i, "plans", r, n.title, `mod_${t}_modelcard`)), e.data.modelCardPath ? (e.data.modelCardPath = i, e.data.modelCard = f(i)) : (e.data.modelCard = i, e.data.modelCard && !e.data.modelCard.startsWith("local-image://") && (e.data.modelCard = f(i)));
						}
						e.data?.items && e.data.items.forEach((e, i) => {
							e.images && e.images.forEach((e, a) => {
								if (e && typeof e == "object") {
									let o = l(e.path);
									o && o !== e.path && (o = d(o, "plans", r, n.title, `mod_${t}_item_${i}_img_${a}`)), e.path = o, e.url = f(e.path);
								}
							});
						});
					}), g.update("plans", r, {
						cover_path: i,
						modules_json: JSON.stringify(a)
					});
				}
				if (a.data.clothing) for (let e of a.data.clothing) {
					let t = {};
					g.constructor.VALID_COLUMNS.clothing.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = g.insert("clothing", t), r = n.id, i = JSON.parse(t.images_json || "[]");
					i.forEach((e, t) => {
						if (e && typeof e == "object") {
							let i = l(e.path);
							i && i !== e.path && (i = d(i, "clothing", r, n.name, `photo_${t}`)), e.path = i, e.url = f(i);
						}
					}), g.update("clothing", r, { images_json: JSON.stringify(i) });
				}
				if (a.data.props) for (let e of a.data.props) {
					let t = {};
					g.constructor.VALID_COLUMNS.props.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = g.insert("props", t), r = n.id, i = JSON.parse(t.images_json || "[]");
					i.forEach((e, t) => {
						if (e && typeof e == "object") {
							let i = l(e.path);
							i && i !== e.path && (i = d(i, "props", r, n.name, `photo_${t}`)), e.path = i, e.url = f(i);
						}
					}), g.update("props", r, { images_json: JSON.stringify(i) });
				}
				if (a.data.makeup) for (let e of a.data.makeup) {
					let t = {};
					g.constructor.VALID_COLUMNS.makeup.forEach((n) => {
						n !== "id" && n !== "created_at" && e[n] !== void 0 && (t[n] = e[n]);
					});
					let n = g.insert("makeup", t), r = n.id, i = JSON.parse(t.images_json || "[]");
					i.forEach((e, t) => {
						if (e && typeof e == "object") {
							let i = l(e.path);
							i && i !== e.path && (i = d(i, "makeup", r, n.name, `photo_${t}`)), e.path = i, e.url = f(i);
						}
					}), g.update("makeup", r, { images_json: JSON.stringify(i) });
				}
			}), u.existsSync(o)) try {
				u.rmSync(o, {
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
		}
	}
}(), x = "sepzerg1989-oss", S = "Desktop-Portrait-Planner-Releases", C = new d(), w = new class {
	constructor() {
		this.currentVersion = n.getVersion(), this.tempFilePath = null, this.isDownloading = !1;
		let e = C.get("lastRunVersion");
		e !== this.currentVersion && (C.delete("ignoredVersion"), C.set("lastRunVersion", this.currentVersion), console.log(`[UpdateService] 检测到软件版本变更：v${e} -> v${this.currentVersion}，已重置已忽略的版本记录。`));
	}
	getUpdateConfigUrl() {
		return `https://raw.githubusercontent.com/${x}/${S}/main/update.json`;
	}
	async autoCheck(e) {
		try {
			let t = await this.fetchLatestVersion();
			if (!t) return;
			if (C.get("ignoredVersion") === t.version) {
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
		return C.set("ignoredVersion", e), console.log(`[UpdateService] 用户已忽略版本：v${e}`), { success: !0 };
	}
	async fetchLatestVersion() {
		let e = this.getUpdateConfigUrl(), t = await a.fetch(e, {
			method: "GET",
			redirect: "follow"
		});
		if (!t.ok) throw Error(`状态码异常: ${t.status}`);
		let n = await t.text();
		try {
			return JSON.parse(n);
		} catch {
			throw Error("解析更新 JSON 失败");
		}
	}
	async downloadPackage(e, t) {
		if (this.isDownloading) throw Error("已有下载任务进行中");
		this.isDownloading = !0;
		let r = e, i = process.platform === "darwin" ? ".dmg" : ".exe", o = `PortraitPlanner_Update_${Date.now()}${i}`, s = c.join(n.getPath("temp"), o);
		this.tempFilePath = s;
		let l = u.createWriteStream(s);
		try {
			let e = await a.fetch(r, {
				method: "GET",
				redirect: "follow"
			});
			if (!e.ok) throw Error(`下载失败，状态码: ${e.status}`);
			let n = parseInt(e.headers.get("content-length"), 10) || 0, i = 0, o = e.body.getReader();
			for (;;) {
				let { done: e, value: r } = await o.read();
				if (e) break;
				if (l.write(Buffer.from(r)), i += r.length, n > 0) {
					let e = Math.round(i / n * 100);
					t && !t.isDestroyed() && t.webContents.send("update:download-progress", e);
				}
			}
			return l.end(), this.isDownloading = !1, s;
		} catch (e) {
			if (this.isDownloading = !1, l.close(), u.existsSync(s)) try {
				u.unlinkSync(s);
			} catch {}
			throw e;
		}
	}
	async startDownloadAndInstall(e, t) {
		try {
			let r = await this.downloadPackage(e, t);
			return console.log("[UpdateService] 安装包下载完成:", r), process.platform === "win32" ? (h(r, {
				detached: !0,
				stdio: "ignore"
			}).unref(), n.quit()) : process.platform === "darwin" && (await s.openPath(r), n.quit()), { success: !0 };
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
}(), T = c.dirname(l(import.meta.url)), E = new d({ name: "theme-config" });
function D() {
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
		}[E.get("theme", "default")] || "#E5E0D8",
		webPreferences: {
			preload: c.join(T, "preload.js"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	});
	process.env.VITE_DEV_SERVER_URL ? (t.loadURL(process.env.VITE_DEV_SERVER_URL), t.webContents.openDevTools()) : t.loadFile(c.join(T, "../dist/index.html"));
}
o.registerSchemesAsPrivileged([{
	scheme: "local-image",
	privileges: {
		secure: !0,
		supportFetchAPI: !0,
		standard: !0,
		bypassCSP: !0
	}
}]), n.whenReady().then(async () => {
	if (o.handle("local-image", async (e) => {
		let t = new URL(e.url), n = decodeURIComponent(t.pathname);
		process.platform === "win32" && n.startsWith("/") && (n = n.substring(1));
		try {
			await u.promises.access(n, u.constants.R_OK);
		} catch {
			return new Response("File not found", { status: 404 });
		}
		let r = u.createReadStream(n), i = c.extname(n).toLowerCase();
		return new Response(r, { headers: { "Content-Type": {
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".png": "image/png",
			".webp": "image/webp",
			".gif": "image/gif",
			".bmp": "image/bmp"
		}[i] || "image/jpeg" } });
	}), !await v.tryRestore() && !await v.selectWorkspace()) {
		n.quit();
		return;
	}
	D(), setTimeout(() => {
		let t = e.getAllWindows();
		t.length > 0 && w.autoCheck(t[0]);
	}, 4e3), t.setApplicationMenu(null), n.on("activate", () => {
		e.getAllWindows().length === 0 && D();
	});
}), n.on("window-all-closed", () => {
	g.close(), process.platform !== "darwin" && n.quit();
}), i.handle("workspace:getPath", () => v.getPath()), i.handle("workspace:selectAndSet", async (t) => {
	let n = e.fromWebContents(t.sender), r = await v.selectWorkspace(n);
	return r ? {
		success: !0,
		path: r
	} : { success: !1 };
});
function O(e) {
	let t = e === "plans" ? "plans" : e;
	i.handle(`db:${t}:getAll`, () => g.getAll(e)), i.handle(`db:${t}:create`, (t, n) => g.insert(e, n)), i.handle(`db:${t}:update`, (t, n, r) => g.update(e, n, r)), i.handle(`db:${t}:delete`, async (t, n) => {
		let r = g.delete(e, n);
		return r.success && await _.deleteEntityFolder(`${e}/${n}`), r;
	}), i.handle(`db:${t}:deleteBatch`, async (t, n) => {
		let r = g.deleteBatch(e, n);
		return r.success && Promise.all(n.map((t) => _.deleteEntityFolder(`${e}/${t}`))).catch((t) => console.error(`[main] 批量删除${e}图片目录失败:`, t)), r;
	});
}
O("models"), O("locations"), O("clothing"), O("props"), O("makeup"), i.handle("db:plans:getAll", () => g.getAll("plans")), i.handle("db:plans:create", (e, t) => g.createEmptyPlan(t)), i.handle("db:plans:createFromTemplate", (e, t, n) => {
	let r = g.getById("templates", n);
	if (!r) return null;
	let i = JSON.parse(r.structure_json).map((e, t) => ({
		id: "m" + Date.now() + t,
		type: e.type,
		title: e.title,
		data: k(e.type)
	}));
	return g.insert("plans", {
		title: t,
		modules_json: JSON.stringify(i)
	});
}), i.handle("db:plans:getById", (e, t) => g.getById("plans", t)), i.handle("db:plans:save", (e, t, n) => g.savePlan(t, n)), i.handle("db:plans:delete", async (e, t) => {
	let n = g.delete("plans", t);
	return n.success && await _.deleteEntityFolder(`plans/${t}`), n;
}), i.handle("db:plans:deleteBatch", async (e, t) => {
	let n = g.deleteBatch("plans", t);
	return n.success && Promise.all(t.map((e) => _.deleteEntityFolder(`plans/${e}`))).catch((e) => console.error("[main] 批量删除策划图片目录失败:", e)), n;
}), i.handle("db:templates:getAll", () => g.getTemplates()), i.handle("db:templates:save", (e, t, n) => g.saveTemplate(t, n)), i.handle("db:templates:delete", (e, t) => g.delete("templates", t)), i.handle("image:compress", async (e, t, n) => await _.compressAndStore(t, n)), i.handle("image:saveFromBuffer", async (e, t, r) => {
	let i = c.join(n.getPath("temp"), `temp_${Date.now()}.png`);
	u.writeFileSync(i, Buffer.from(t));
	let a = await _.compressAndStore(i, r);
	return u.existsSync(i) && u.unlinkSync(i), a;
}), i.handle("image:deleteFile", async (e, t) => await _.deleteFile(t)), i.handle("image:renameFolder", async (e, t, n) => await _.renameEntityFolder(t, n)), i.handle("image:copyFilesToEntity", async (e, t, n) => await _.copyFilesToEntity(t, n)), i.handle("image:selectFiles", async (t) => {
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
}), i.handle("image:cleanupTempFolder", async (e, t) => await _.deleteEntityFolder(t)), i.handle("system:exportData", async (t, n) => {
	let r = e.fromWebContents(t.sender);
	return await b.exportData(n, r);
}), i.handle("system:importData", async (t, n) => {
	let r = e.fromWebContents(t.sender);
	return await b.importData(r, n);
}), i.handle("system:exportImage", async (t, n, i) => {
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
		return u.writeFileSync(o.filePath, t), {
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
}), i.handle("theme:getSaved", () => E.get("theme", "default")), i.handle("theme:save", (e, t) => (E.set("theme", t), { success: !0 })), i.on("theme:setBackgroundColor", (t, n) => {
	let r = e.fromWebContents(t.sender);
	r && !r.isDestroyed() && r.setBackgroundColor(n);
}), i.handle("update:check", () => w.manualCheck()), i.handle("update:ignore", (e, t) => w.ignoreVersion(t)), i.handle("update:download", (t, n) => {
	let r = e.fromWebContents(t.sender);
	return w.startDownloadAndInstall(n, r);
});
function k(e) {
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

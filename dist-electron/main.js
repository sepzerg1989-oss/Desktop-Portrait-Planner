import { BrowserWindow, Menu, app, dialog, ipcMain, net, protocol, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Store from "electron-store";
import Database from "better-sqlite3";
import sharp from "sharp";
import crypto from "crypto";
import { spawn } from "child_process";
var DatabaseService_default = new class DatabaseService {
	constructor() {
		this.db = null;
	}
	/**
	* 初始化数据库连接并创建表结构
	* @param {string} workspacePath - 用户工作区目录的绝对路径
	*/
	init(workspacePath) {
		const dbPath = path.join(workspacePath, "database.sqlite");
		this.db = new Database(dbPath);
		this.db.pragma("journal_mode = WAL");
		this._createTables();
	}
	/** 创建所有核心业务数据表 */
	_createTables() {
		this.db.exec(`
      -- 策划案表
      CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '未命名策划案',
        cover_path TEXT,
        modules_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now','localtime')),
        updated_at TEXT DEFAULT (datetime('now','localtime'))
      );

      -- 模特库表
      CREATE TABLE IF NOT EXISTS models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        avatar_path TEXT,
        model_card_path TEXT,
        social TEXT DEFAULT '',
        region TEXT DEFAULT '',
        price TEXT DEFAULT '',
        images_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now','localtime'))
      );

      -- 场地库表
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT DEFAULT '',
        price TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        cover_path TEXT,
        images_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now','localtime'))
      );

      -- 模板预设表（从 localStorage 迁移）
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        structure_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now','localtime'))
      );
    `);
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN region TEXT DEFAULT ''");
		} catch (e) {}
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN price TEXT DEFAULT ''");
		} catch (e) {}
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN model_card_path TEXT DEFAULT ''");
		} catch (e) {}
		try {
			this.db.exec("ALTER TABLE models ADD COLUMN images_json TEXT DEFAULT '[]'");
		} catch (e) {}
	}
	/** 允许操作的表白名单 — 防御性校验 */
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
	_validateTable(table) {
		if (!DatabaseService.VALID_TABLES.includes(table)) throw new Error(`[DatabaseService] 非法表名: ${table}`);
	}
	_validateColumns(table, keys) {
		const allowed = DatabaseService.VALID_COLUMNS[table];
		if (!allowed) throw new Error(`[DatabaseService] 未知表: ${table}`);
		for (const key of keys) if (!allowed.includes(key)) throw new Error(`[DatabaseService] 非法列名: ${table}.${key}`);
	}
	/** 获取表中所有记录 */
	getAll(table) {
		this._validateTable(table);
		return this.db.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC`).all();
	}
	/** 按 ID 获取单条记录 */
	getById(table, id) {
		this._validateTable(table);
		return this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
	}
	/** 插入一条记录，返回插入后的完整记录 */
	insert(table, data) {
		this._validateTable(table);
		const keys = Object.keys(data);
		this._validateColumns(table, keys);
		const placeholders = keys.map(() => "?").join(", ");
		const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
		const result = this.db.prepare(sql).run(...keys.map((k) => data[k]));
		return this.getById(table, result.lastInsertRowid);
	}
	update(table, id, data) {
		this._validateTable(table);
		const keys = Object.keys(data);
		this._validateColumns(table, keys);
		const sql = `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`;
		this.db.prepare(sql).run(...keys.map((k) => data[k]), id);
		return this.getById(table, id);
	}
	/** 删除一条记录 */
	delete(table, id) {
		this._validateTable(table);
		this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
		return { success: true };
	}
	/** 批量删除记录 (使用 SQLite 事务) */
	deleteBatch(table, ids) {
		this._validateTable(table);
		const stmt = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`);
		this.db.transaction((targetIds) => {
			for (const id of targetIds) stmt.run(id);
		})(ids);
		return { success: true };
	}
	/** 保存策划案 (含更新时间戳) */
	savePlan(id, data) {
		const now = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19);
		return this.update("plans", id, {
			...data,
			updated_at: now
		});
	}
	/** 创建空策划案 */
	createEmptyPlan(title = "未命名策划案") {
		return this.insert("plans", {
			title,
			modules_json: JSON.stringify([
				{
					id: "m1",
					type: "theme",
					title: "拍摄主题",
					data: {
						title,
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
	/** 保存为模板 */
	saveTemplate(name, structureJson) {
		return this.insert("templates", {
			name,
			structure_json: JSON.stringify(structureJson)
		});
	}
	/** 获取所有模板 */
	getTemplates() {
		return this.getAll("templates");
	}
	/** 关闭数据库连接 */
	close() {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}
}();
//#endregion
//#region electron/services/ImageService.js
/**
* 图片处理服务 — 基于 sharp 的图片压缩与存储
* 核心职责：接收源图片，压缩至 ≤300kb，存入工作区对应子目录
*/
var ImageService = class {
	constructor() {
		this.workspacePath = null;
		this.MAX_SIZE_BYTES = 300 * 1024;
		this.queue = [];
		this.runningCount = 0;
		this.MAX_CONCURRENCY = 5;
	}
	/** 设置工作区路径 */
	setWorkspace(workspacePath) {
		this.workspacePath = workspacePath;
	}
	/**
	* 压缩并存储图片（带并发队列控制）
	*/
	async compressAndStore(sourcePath, category = "plans") {
		return new Promise((resolve, reject) => {
			this.queue.push({
				sourcePath,
				category,
				resolve,
				reject
			});
			this.next();
		});
	}
	async next() {
		if (this.runningCount >= this.MAX_CONCURRENCY || this.queue.length === 0) return;
		this.runningCount++;
		const { sourcePath, category, resolve, reject } = this.queue.shift();
		try {
			resolve(await this._doCompress(sourcePath, category));
		} catch (error) {
			reject(error);
		} finally {
			this.runningCount--;
			this.next();
		}
	}
	/**
	* 实际执行压缩的私有方法
	*/
	async _doCompress(sourcePath, category = "plans") {
		if (!this.workspacePath) throw new Error("工作区尚未初始化");
		const categoryParts = category.split(/[\\\/]/);
		const targetDir = path.join(this.workspacePath, "images", ...categoryParts);
		if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
		const ext = path.extname(sourcePath).toLowerCase() || ".jpg";
		const hash = crypto.randomBytes(8).toString("hex");
		const fileName = `${Date.now()}_${hash}${ext}`;
		const targetPath = path.join(targetDir, fileName);
		try {
			const image = sharp(sourcePath).rotate();
			const metadata = await image.metadata();
			let pipeline = image;
			let currentWidth = metadata.width;
			metadata.height;
			if (metadata.width > 1600) {
				pipeline = pipeline.resize({
					width: 1600,
					withoutEnlargement: true
				});
				Math.round(metadata.height * (1600 / metadata.width));
				currentWidth = 1600;
			}
			let buffer = await pipeline.jpeg({
				quality: 80,
				mozjpeg: true,
				progressive: true
			}).toBuffer();
			if (buffer.length > this.MAX_SIZE_BYTES) {
				const sizeRatio = Math.sqrt(this.MAX_SIZE_BYTES / buffer.length);
				currentWidth = Math.min(1200, Math.round(currentWidth * sizeRatio * .9));
				buffer = await sharp(sourcePath).rotate().resize({
					width: currentWidth,
					withoutEnlargement: true
				}).jpeg({
					quality: 60,
					mozjpeg: true,
					progressive: true
				}).toBuffer();
			}
			if (buffer.length > this.MAX_SIZE_BYTES) buffer = await sharp(sourcePath).rotate().resize({
				width: 800,
				withoutEnlargement: true
			}).jpeg({
				quality: 40,
				mozjpeg: true
			}).toBuffer();
			const finalMetadata = await sharp(buffer).metadata();
			const ratio = finalMetadata.width / finalMetadata.height;
			fs.writeFileSync(targetPath, buffer);
			return {
				success: true,
				path: targetPath,
				ratio
			};
		} catch (error) {
			console.error("[ImageService] 图片压缩失败:", error);
			return {
				success: false,
				error: error.message
			};
		}
	}
	/**
	* 删除指定的实体文件夹（用于清理已删除的数据项）
	*/
	_isPathWithinWorkspace(targetPath) {
		if (!this.workspacePath) return false;
		const normalizedTarget = path.normalize(targetPath);
		const normalizedBase = path.normalize(path.join(this.workspacePath, "images"));
		return normalizedTarget.startsWith(normalizedBase + path.sep) || normalizedTarget === normalizedBase;
	}
	_sanitizeCategory(category) {
		if (!category) return null;
		const parts = category.split(/[\\\/]/).filter((p) => p && p !== ".." && !p.includes(":"));
		if (parts.length === 0) return null;
		return parts;
	}
	async deleteEntityFolder(category) {
		if (!this.workspacePath || !category) return;
		const categoryParts = this._sanitizeCategory(category);
		if (!categoryParts) return;
		const targetDir = path.join(this.workspacePath, "images", ...categoryParts);
		if (!this._isPathWithinWorkspace(targetDir)) {
			console.warn(`[ImageService] 拒绝删除非工作区目录: ${targetDir}`);
			return;
		}
		try {
			if (fs.existsSync(targetDir)) {
				fs.rmSync(targetDir, {
					recursive: true,
					force: true
				});
				console.log(`[ImageService] 已清理资源目录: ${targetDir}`);
			}
		} catch (error) {
			console.error(`[ImageService] 清理资源目录失败: ${targetDir}`, error);
		}
	}
	/**
	* 删除单个图片文件
	*/
	async deleteFile(absolutePath) {
		if (!this.workspacePath || !absolutePath) return { success: false };
		try {
			const normalizedPath = path.normalize(absolutePath);
			if (!this._isPathWithinWorkspace(normalizedPath) && normalizedPath !== path.normalize(path.join(this.workspacePath, "images"))) {
				console.warn(`[ImageService] 拒绝删除非工作区图片: ${absolutePath}`);
				return {
					success: false,
					error: "Access denied"
				};
			}
			if (fs.existsSync(normalizedPath)) {
				fs.unlinkSync(normalizedPath);
				return { success: true };
			}
			return {
				success: false,
				error: "File not found"
			};
		} catch (error) {
			console.error(`[ImageService] 删除文件失败: ${absolutePath}`, error);
			return {
				success: false,
				error: error.message
			};
		}
	}
	/**
	* 重命名实体文件夹
	*/
	async renameEntityFolder(oldCategory, newCategory) {
		if (!this.workspacePath || !oldCategory || !newCategory) return { success: false };
		if (oldCategory === newCategory) return { success: true };
		const oldParts = this._sanitizeCategory(oldCategory);
		const newParts = this._sanitizeCategory(newCategory);
		if (!oldParts || !newParts) return {
			success: false,
			error: "Invalid category"
		};
		const oldPath = path.join(this.workspacePath, "images", ...oldParts);
		const newPath = path.join(this.workspacePath, "images", ...newParts);
		if (!this._isPathWithinWorkspace(oldPath) || !this._isPathWithinWorkspace(newPath)) {
			console.warn(`[ImageService] 拒绝重命名非工作区目录: ${oldPath} -> ${newPath}`);
			return {
				success: false,
				error: "Access denied"
			};
		}
		try {
			if (fs.existsSync(oldPath)) {
				const newParent = path.dirname(newPath);
				if (!fs.existsSync(newParent)) fs.mkdirSync(newParent, { recursive: true });
				fs.renameSync(oldPath, newPath);
				console.log(`[ImageService] 文件夹已重命名: ${oldPath} -> ${newPath}`);
				return { success: true };
			}
			return {
				success: false,
				error: "Source folder not found"
			};
		} catch (error) {
			console.error(`[ImageService] 重命名文件夹失败: ${oldPath}`, error);
			return {
				success: false,
				error: error.message
			};
		}
	}
};
var ImageService_default = new ImageService();
//#endregion
//#region electron/services/WorkspaceService.js
/**
* 工作区服务 — 管理用户本地工作区的初始化与持久化
* 使用 electron-store 记住上一次选择的工作区路径
*/
var WorkspaceService = class {
	constructor() {
		this.store = new Store({ name: "workspace-config" });
		this.currentPath = null;
	}
	/**
	* 获取已保存的工作区路径，若无则返回 null
	*/
	getSavedPath() {
		return this.store.get("workspacePath", null);
	}
	/**
	* 弹出系统文件夹选择对话框，让用户选择工作区目录
	* @returns {Promise<string|null>} 用户选择的路径，取消则返回 null
	*/
	async selectWorkspace(parentWindow = null) {
		const result = await dialog.showOpenDialog(parentWindow, {
			title: "选择工作区文件夹 (Portrait Planner)",
			properties: ["openDirectory", "createDirectory"]
		});
		if (result.canceled || result.filePaths.length === 0) return null;
		const selectedPath = result.filePaths[0];
		await this.initWorkspace(selectedPath);
		return selectedPath;
	}
	/**
	* 初始化工作区 — 创建目录结构并初始化数据库
	* @param {string} dirPath - 工作区根目录路径
	*/
	async initWorkspace(dirPath) {
		const dirs = [
			path.join(dirPath, "images", "models"),
			path.join(dirPath, "images", "locations"),
			path.join(dirPath, "images", "plans"),
			path.join(dirPath, "exports")
		];
		for (const dir of dirs) if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		DatabaseService_default.init(dirPath);
		ImageService_default.setWorkspace(dirPath);
		this.currentPath = dirPath;
		this.store.set("workspacePath", dirPath);
	}
	/**
	* 尝试自动恢复上次的工作区（应用启动时调用）
	* @returns {boolean} 是否成功恢复
	*/
	async tryRestore() {
		const saved = this.getSavedPath();
		if (saved && fs.existsSync(saved)) {
			await this.initWorkspace(saved);
			return true;
		}
		return false;
	}
	/**
	* 获取当前工作区路径
	*/
	getPath() {
		return this.currentPath;
	}
	/**
	* 使用默认路径初始化（首次启动且用户未选择时的兜底方案）
	*/
	async initDefault() {
		const defaultPath = path.join(app.getPath("documents"), "PortraitPlanner");
		await this.initWorkspace(defaultPath);
		return defaultPath;
	}
};
var WorkspaceService_default = new WorkspaceService();
//#endregion
//#region electron/services/ExportService.js
/**
* 数据导出与导入服务
*/
var ExportService = class {
	/**
	* 导出选定的数据包
	* @param {Object} ids - { planIds: [], modelIds: [], locationIds: [] }
	* @param {BrowserWindow} win - 弹出对话框所依赖的窗口
	*/
	async exportData(ids, win) {
		try {
			const exportData = {
				version: "1.0",
				type: "portraitplanner-export",
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				data: {
					plans: [],
					models: [],
					locations: []
				},
				images: {}
			};
			const addImage = (absPath) => {
				if (!absPath || exportData.images[absPath]) return;
				try {
					if (fs.existsSync(absPath)) exportData.images[absPath] = fs.readFileSync(absPath, "base64");
				} catch (err) {
					console.warn("[ExportService] 读取图片失败:", absPath, err);
				}
			};
			if (ids.planIds && Array.isArray(ids.planIds)) for (const id of ids.planIds) {
				const plan = DatabaseService_default.getById("plans", id);
				if (plan) {
					exportData.data.plans.push(plan);
					if (plan.cover_path) addImage(plan.cover_path);
					JSON.parse(plan.modules_json || "[]").forEach((m) => {
						if (m.data?.images) m.data.images.forEach((img) => addImage(img.path));
						if (m.data?.avatar) addImage(m.data.avatar);
						if (m.data?.modelCard) addImage(m.data.modelCard);
					});
				}
			}
			if (ids.modelIds && Array.isArray(ids.modelIds)) for (const id of ids.modelIds) {
				const model = DatabaseService_default.getById("models", id);
				if (model) {
					exportData.data.models.push(model);
					if (model.avatar_path) addImage(model.avatar_path);
					if (model.model_card_path) addImage(model.model_card_path);
					JSON.parse(model.images_json || "[]").forEach((img) => addImage(img.path));
				}
			}
			if (ids.locationIds && Array.isArray(ids.locationIds)) for (const id of ids.locationIds) {
				const loc = DatabaseService_default.getById("locations", id);
				if (loc) {
					exportData.data.locations.push(loc);
					if (loc.cover_path) addImage(loc.cover_path);
					JSON.parse(loc.images_json || "[]").forEach((img) => addImage(img.path));
				}
			}
			const result = await dialog.showSaveDialog(win, {
				title: "导出数据",
				defaultPath: "PortraitPlanner_Data.ppexport",
				filters: [{
					name: "PortraitPlanner Export File",
					extensions: ["ppexport"]
				}]
			});
			if (result.canceled || !result.filePath) return {
				success: false,
				error: "User canceled"
			};
			fs.writeFileSync(result.filePath, JSON.stringify(exportData));
			return {
				success: true,
				filePath: result.filePath
			};
		} catch (e) {
			console.error("[ExportService] 导出失败:", e);
			return {
				success: false,
				error: e.message
			};
		}
	}
	/**
	* 导入数据包
	* @param {BrowserWindow} win - 弹出对话框所依赖的窗口
	* @param {string} [filePath] - 可选的直接文件路径，用于拖拽上传等静默导入
	*/
	async importData(win, filePath = null) {
		try {
			let finalFilePath = filePath;
			if (!finalFilePath) {
				const result = await dialog.showOpenDialog(win, {
					title: "导入数据",
					properties: ["openFile"],
					filters: [{
						name: "PortraitPlanner Export File",
						extensions: ["ppexport"]
					}]
				});
				if (result.canceled || result.filePaths.length === 0) return {
					success: false,
					error: "User canceled"
				};
				finalFilePath = result.filePaths[0];
			}
			const fileContent = fs.readFileSync(finalFilePath, "utf-8");
			const exportData = JSON.parse(fileContent);
			if (exportData.type !== "portraitplanner-export") throw new Error("无效的导出文件格式");
			const importedImagesDir = path.join(WorkspaceService_default.getPath(), "images", "imported");
			if (!fs.existsSync(importedImagesDir)) fs.mkdirSync(importedImagesDir, { recursive: true });
			const pathMapping = {};
			if (exportData.images) for (const [oldPath, base64Str] of Object.entries(exportData.images)) {
				const buffer = Buffer.from(base64Str, "base64");
				const hash = Math.random().toString(36).substring(2, 10);
				const ext = path.extname(oldPath) || ".jpg";
				const fileName = `${Date.now()}_${hash}${ext}`;
				const targetPath = path.join(importedImagesDir, fileName);
				fs.writeFileSync(targetPath, buffer);
				pathMapping[oldPath] = targetPath;
			}
			const replacePath = (oldPath) => {
				if (!oldPath) return oldPath;
				return pathMapping[oldPath] || oldPath;
			};
			if (exportData.data.models) for (const model of exportData.data.models) {
				const newModel = {};
				DatabaseService_default.constructor.VALID_COLUMNS.models.forEach((key) => {
					if (key !== "id" && model[key] !== void 0) newModel[key] = model[key];
				});
				newModel.avatar_path = replacePath(newModel.avatar_path);
				newModel.model_card_path = replacePath(newModel.model_card_path);
				const images = JSON.parse(newModel.images_json || "[]");
				images.forEach((img) => img.path = replacePath(img.path));
				newModel.images_json = JSON.stringify(images);
				DatabaseService_default.insert("models", newModel);
			}
			if (exportData.data.locations) for (const loc of exportData.data.locations) {
				const newLoc = {};
				DatabaseService_default.constructor.VALID_COLUMNS.locations.forEach((key) => {
					if (key !== "id" && loc[key] !== void 0) newLoc[key] = loc[key];
				});
				newLoc.cover_path = replacePath(newLoc.cover_path);
				const images = JSON.parse(newLoc.images_json || "[]");
				images.forEach((img) => img.path = replacePath(img.path));
				newLoc.images_json = JSON.stringify(images);
				DatabaseService_default.insert("locations", newLoc);
			}
			if (exportData.data.plans) for (const plan of exportData.data.plans) {
				const newPlan = {};
				DatabaseService_default.constructor.VALID_COLUMNS.plans.forEach((key) => {
					if (key !== "id" && plan[key] !== void 0) newPlan[key] = plan[key];
				});
				newPlan.cover_path = replacePath(newPlan.cover_path);
				const modules = JSON.parse(newPlan.modules_json || "[]");
				modules.forEach((m) => {
					if (m.data?.images) m.data.images.forEach((img) => img.path = replacePath(img.path));
					if (m.data?.avatar) m.data.avatar = replacePath(m.data.avatar);
					if (m.data?.modelCard) m.data.modelCard = replacePath(m.data.modelCard);
				});
				newPlan.modules_json = JSON.stringify(modules);
				DatabaseService_default.insert("plans", newPlan);
			}
			return { success: true };
		} catch (e) {
			console.error("[ExportService] 导入失败:", e);
			return {
				success: false,
				error: e.message
			};
		}
	}
};
var ExportService_default = new ExportService();
//#endregion
//#region electron/services/UpdateService.js
var GITHUB_OWNER = "sepzerg1989-oss";
var GITHUB_REPO = "Desktop-Portrait-Planner-Releases";
var store = new Store();
var UpdateService = class {
	constructor() {
		this.currentVersion = app.getVersion();
		this.tempFilePath = null;
		this.isDownloading = false;
		const lastRunVersion = store.get("lastRunVersion");
		if (lastRunVersion !== this.currentVersion) {
			store.delete("ignoredVersion");
			store.set("lastRunVersion", this.currentVersion);
			console.log(`[UpdateService] 检测到软件版本变更：v${lastRunVersion} -> v${this.currentVersion}，已重置已忽略的版本记录。`);
		}
	}
	/**
	* 获取检测更新配置文件 update.json 的路径
	*/
	getUpdateConfigUrl() {
		return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/update.json`;
	}
	/**
	* 自动在启动时检测更新（排除已忽略的版本）
	* @param {BrowserWindow} win 
	*/
	async autoCheck(win) {
		try {
			const updateInfo = await this.fetchLatestVersion();
			if (!updateInfo) return;
			if (store.get("ignoredVersion") === updateInfo.version) {
				console.log(`[UpdateService] 自动更新已静默：版本 v${updateInfo.version} 已被用户忽略`);
				return;
			}
			if (this.compareVersion(updateInfo.version, this.currentVersion) > 0) {
				console.log(`[UpdateService] 发现新版本 v${updateInfo.version}`);
				win.webContents.send("update:available", {
					version: updateInfo.version,
					changelog: updateInfo.changelog,
					downloadUrl: process.platform === "darwin" ? updateInfo.macDownloadUrl : updateInfo.downloadUrl
				});
			}
		} catch (err) {
			console.warn("[UpdateService] 启动自动检查更新失败:", err.message);
		}
	}
	/**
	* 手动点击检测更新（无视忽略标志）
	*/
	async manualCheck() {
		try {
			const updateInfo = await this.fetchLatestVersion();
			if (!updateInfo) return {
				hasUpdate: false,
				msg: "获取更新配置失败",
				currentVersion: this.currentVersion
			};
			return {
				hasUpdate: this.compareVersion(updateInfo.version, this.currentVersion) > 0,
				currentVersion: this.currentVersion,
				latestVersion: updateInfo.version,
				changelog: updateInfo.changelog,
				downloadUrl: process.platform === "darwin" ? updateInfo.macDownloadUrl : updateInfo.downloadUrl
			};
		} catch (err) {
			console.error("[UpdateService] 手动检查更新失败:", err);
			return {
				hasUpdate: false,
				error: err.message,
				currentVersion: this.currentVersion
			};
		}
	}
	/**
	* 忽略该版本号
	*/
	ignoreVersion(version) {
		store.set("ignoredVersion", version);
		console.log(`[UpdateService] 用户已忽略版本：v${version}`);
		return { success: true };
	}
	/**
	* 从云端获取最新 update.json 的配置内容
	* 使用 Electron 的 net.fetch，能完美穿透国内代理、自动集成系统代理设置
	*/
	async fetchLatestVersion() {
		const url = this.getUpdateConfigUrl();
		const response = await net.fetch(url, {
			method: "GET",
			redirect: "follow"
		});
		if (!response.ok) throw new Error(`状态码异常: ${response.status}`);
		const body = await response.text();
		try {
			return JSON.parse(body);
		} catch (e) {
			throw new Error("解析更新 JSON 失败");
		}
	}
	/**
	* 执行流式网络下载（支持国内镜像加速）
	* 采用 Electron 的 net.fetch，完美适配系统 VPN/代理，防止 TLS 握手断开错误
	*/
	async downloadPackage(downloadUrl, win) {
		if (this.isDownloading) throw new Error("已有下载任务进行中");
		this.isDownloading = true;
		const finalUrl = downloadUrl;
		const ext = process.platform === "darwin" ? ".dmg" : ".exe";
		const fileName = `PortraitPlanner_Update_${Date.now()}${ext}`;
		const tempPath = path.join(app.getPath("temp"), fileName);
		this.tempFilePath = tempPath;
		const fileStream = fs.createWriteStream(tempPath);
		try {
			const response = await net.fetch(finalUrl, {
				method: "GET",
				redirect: "follow"
			});
			if (!response.ok) throw new Error(`下载失败，状态码: ${response.status}`);
			const totalBytes = parseInt(response.headers.get("content-length"), 10) || 0;
			let downloadedBytes = 0;
			const reader = response.body.getReader();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				fileStream.write(Buffer.from(value));
				downloadedBytes += value.length;
				if (totalBytes > 0) {
					const percent = Math.round(downloadedBytes / totalBytes * 100);
					if (win && !win.isDestroyed()) win.webContents.send("update:download-progress", percent);
				}
			}
			fileStream.end();
			this.isDownloading = false;
			return tempPath;
		} catch (err) {
			this.isDownloading = false;
			fileStream.close();
			if (fs.existsSync(tempPath)) try {
				fs.unlinkSync(tempPath);
			} catch (_) {}
			throw err;
		}
	}
	/**
	* 触发下载并自动执行升级安装
	*/
	async startDownloadAndInstall(downloadUrl, win) {
		try {
			const packagePath = await this.downloadPackage(downloadUrl, win);
			console.log("[UpdateService] 安装包下载完成:", packagePath);
			if (process.platform === "win32") {
				spawn(packagePath, {
					detached: true,
					stdio: "ignore"
				}).unref();
				app.quit();
			} else if (process.platform === "darwin") {
				await shell.openPath(packagePath);
				app.quit();
			}
			return { success: true };
		} catch (err) {
			console.error("[UpdateService] 下载升级失败:", err);
			this.isDownloading = false;
			return {
				success: false,
				error: err.message
			};
		}
	}
	/**
	* 辅助工具：版本号对比 (v1 > v2 返回正数，v1 < v2 返回负数，相等返回0)
	*/
	compareVersion(v1, v2) {
		const parts1 = v1.replace(/^v/, "").split(".").map(Number);
		const parts2 = v2.replace(/^v/, "").split(".").map(Number);
		for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
			const num1 = parts1[i] || 0;
			const num2 = parts2[i] || 0;
			if (num1 !== num2) return num1 - num2;
		}
		return 0;
	}
};
var UpdateService_default = new UpdateService();
//#endregion
//#region electron/main.js
var __dirname = path.dirname(fileURLToPath(import.meta.url));
function createWindow() {
	const win = new BrowserWindow({
		width: 1440,
		height: 900,
		frame: false,
		titleBarStyle: "hidden",
		backgroundColor: "#E2DED0",
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true
		}
	});
	if (process.env.VITE_DEV_SERVER_URL) {
		win.loadURL(process.env.VITE_DEV_SERVER_URL);
		win.webContents.openDevTools();
	} else win.loadFile(path.join(__dirname, "../dist/index.html"));
}
protocol.registerSchemesAsPrivileged([{
	scheme: "local-image",
	privileges: {
		secure: true,
		supportFetchAPI: true,
		standard: true,
		bypassCSP: true
	}
}]);
app.whenReady().then(async () => {
	protocol.handle("local-image", async (request) => {
		const url = new URL(request.url);
		let filePath = decodeURIComponent(url.pathname);
		if (process.platform === "win32" && filePath.startsWith("/")) filePath = filePath.substring(1);
		try {
			await fs.promises.access(filePath, fs.constants.R_OK);
		} catch (e) {
			return new Response("File not found", { status: 404 });
		}
		const stream = fs.createReadStream(filePath);
		const ext = path.extname(filePath).toLowerCase();
		return new Response(stream, { headers: { "Content-Type": {
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".png": "image/png",
			".webp": "image/webp",
			".gif": "image/gif",
			".bmp": "image/bmp"
		}[ext] || "image/jpeg" } });
	});
	if (!await WorkspaceService_default.tryRestore()) {
		if (!await WorkspaceService_default.selectWorkspace()) {
			app.quit();
			return;
		}
	}
	createWindow();
	setTimeout(() => {
		const wins = BrowserWindow.getAllWindows();
		if (wins.length > 0) UpdateService_default.autoCheck(wins[0]);
	}, 4e3);
	Menu.setApplicationMenu(null);
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
app.on("window-all-closed", () => {
	DatabaseService_default.close();
	if (process.platform !== "darwin") app.quit();
});
ipcMain.handle("workspace:getPath", () => {
	return WorkspaceService_default.getPath();
});
ipcMain.handle("workspace:selectAndSet", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	const newPath = await WorkspaceService_default.selectWorkspace(win);
	if (newPath) return {
		success: true,
		path: newPath
	};
	return { success: false };
});
ipcMain.handle("db:models:getAll", () => {
	return DatabaseService_default.getAll("models");
});
ipcMain.handle("db:models:create", (event, data) => {
	return DatabaseService_default.insert("models", data);
});
ipcMain.handle("db:models:update", (event, id, data) => {
	return DatabaseService_default.update("models", id, data);
});
ipcMain.handle("db:models:delete", async (event, id) => {
	const result = DatabaseService_default.delete("models", id);
	if (result.success) await ImageService_default.deleteEntityFolder(`models/${id}`);
	return result;
});
ipcMain.handle("db:models:deleteBatch", async (event, ids) => {
	const result = DatabaseService_default.deleteBatch("models", ids);
	if (result.success) Promise.all(ids.map((id) => ImageService_default.deleteEntityFolder(`models/${id}`))).catch((e) => console.error("[main] 批量删除模特图片目录失败:", e));
	return result;
});
ipcMain.handle("db:locations:getAll", () => {
	return DatabaseService_default.getAll("locations");
});
ipcMain.handle("db:locations:create", (event, data) => {
	return DatabaseService_default.insert("locations", data);
});
ipcMain.handle("db:locations:update", (event, id, data) => {
	return DatabaseService_default.update("locations", id, data);
});
ipcMain.handle("db:locations:delete", async (event, id) => {
	const result = DatabaseService_default.delete("locations", id);
	if (result.success) await ImageService_default.deleteEntityFolder(`locations/${id}`);
	return result;
});
ipcMain.handle("db:locations:deleteBatch", async (event, ids) => {
	const result = DatabaseService_default.deleteBatch("locations", ids);
	if (result.success) Promise.all(ids.map((id) => ImageService_default.deleteEntityFolder(`locations/${id}`))).catch((e) => console.error("[main] 批量删除场地图片目录失败:", e));
	return result;
});
ipcMain.handle("db:plans:getAll", () => {
	return DatabaseService_default.getAll("plans");
});
ipcMain.handle("db:plans:create", (event, title) => {
	return DatabaseService_default.createEmptyPlan(title);
});
ipcMain.handle("db:plans:createFromTemplate", (event, title, templateId) => {
	const template = DatabaseService_default.getById("templates", templateId);
	if (!template) return null;
	const modules = JSON.parse(template.structure_json).map((item, idx) => ({
		id: "m" + Date.now() + idx,
		type: item.type,
		title: item.title,
		data: getDefaultDataForType(item.type)
	}));
	return DatabaseService_default.insert("plans", {
		title,
		modules_json: JSON.stringify(modules)
	});
});
ipcMain.handle("db:plans:getById", (event, id) => {
	return DatabaseService_default.getById("plans", id);
});
ipcMain.handle("db:plans:save", (event, id, data) => {
	return DatabaseService_default.savePlan(id, data);
});
ipcMain.handle("db:plans:delete", async (event, id) => {
	const result = DatabaseService_default.delete("plans", id);
	if (result.success) await ImageService_default.deleteEntityFolder(`plans/${id}`);
	return result;
});
ipcMain.handle("db:plans:deleteBatch", async (event, ids) => {
	const result = DatabaseService_default.deleteBatch("plans", ids);
	if (result.success) Promise.all(ids.map((id) => ImageService_default.deleteEntityFolder(`plans/${id}`))).catch((e) => console.error("[main] 批量删除策划图片目录失败:", e));
	return result;
});
ipcMain.handle("db:templates:getAll", () => {
	return DatabaseService_default.getTemplates();
});
ipcMain.handle("db:templates:save", (event, name, structure) => {
	return DatabaseService_default.saveTemplate(name, structure);
});
ipcMain.handle("db:templates:delete", (event, id) => {
	return DatabaseService_default.delete("templates", id);
});
ipcMain.handle("image:compress", async (event, sourcePath, category) => {
	return await ImageService_default.compressAndStore(sourcePath, category);
});
ipcMain.handle("image:saveFromBuffer", async (event, buffer, category) => {
	const tempPath = path.join(app.getPath("temp"), `temp_${Date.now()}.png`);
	fs.writeFileSync(tempPath, Buffer.from(buffer));
	const result = await ImageService_default.compressAndStore(tempPath, category);
	if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
	return result;
});
ipcMain.handle("image:deleteFile", async (event, absolutePath) => {
	return await ImageService_default.deleteFile(absolutePath);
});
ipcMain.handle("image:renameFolder", async (event, oldCategory, newCategory) => {
	return await ImageService_default.renameEntityFolder(oldCategory, newCategory);
});
ipcMain.handle("image:selectFiles", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	const result = await dialog.showOpenDialog(win, {
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
	if (result.canceled) return [];
	return result.filePaths;
});
ipcMain.handle("image:cleanupTempFolder", async (event, category) => {
	return await ImageService_default.deleteEntityFolder(category);
});
ipcMain.handle("system:exportData", async (event, ids) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	return await ExportService_default.exportData(ids, win);
});
ipcMain.handle("system:importData", async (event, filePath) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	return await ExportService_default.importData(win, filePath);
});
ipcMain.handle("system:exportImage", async (event, dataUrl, defaultName) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	const result = await dialog.showSaveDialog(win, {
		title: "导出为长图",
		defaultPath: defaultName || "策划案_长图.jpg",
		filters: [{
			name: "JPEG Image",
			extensions: ["jpg", "jpeg"]
		}]
	});
	if (result.canceled || !result.filePath) return {
		success: false,
		error: "User canceled"
	};
	try {
		const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
		const buffer = Buffer.from(base64Data, "base64");
		fs.writeFileSync(result.filePath, buffer);
		return {
			success: true,
			filePath: result.filePath
		};
	} catch (err) {
		console.error("Export error:", err);
		return {
			success: false,
			error: err.message
		};
	}
});
ipcMain.on("window-minimize", (event) => {
	BrowserWindow.fromWebContents(event.sender).minimize();
});
ipcMain.on("window-toggle-maximize", (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	if (win.isMaximized()) win.unmaximize();
	else win.maximize();
});
ipcMain.on("window-close", (event) => {
	BrowserWindow.fromWebContents(event.sender).close();
});
ipcMain.handle("update:check", () => UpdateService_default.manualCheck());
ipcMain.handle("update:ignore", (event, version) => UpdateService_default.ignoreVersion(version));
ipcMain.handle("update:download", (event, url) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	return UpdateService_default.startDownloadAndInstall(url, win);
});
/** 根据模块类型返回默认数据结构 */
function getDefaultDataForType(type) {
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
	}[type] || {};
}
//#endregion

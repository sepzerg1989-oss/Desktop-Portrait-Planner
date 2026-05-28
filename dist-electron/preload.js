//#endregion
//#region electron/preload.js
var { contextBridge, ipcRenderer, webUtils } = (/* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, { get: (a, b) => (typeof require !== "undefined" ? require : a)[b] }) : x)(function(x) {
	if (typeof require !== "undefined") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + x + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
}))("electron");
contextBridge.exposeInMainWorld("electronAPI", {
	getModels: () => ipcRenderer.invoke("db:models:getAll"),
	createModel: (data) => ipcRenderer.invoke("db:models:create", data),
	updateModel: (id, data) => ipcRenderer.invoke("db:models:update", id, data),
	deleteModel: (id) => ipcRenderer.invoke("db:models:delete", id),
	deleteModelsBatch: (ids) => ipcRenderer.invoke("db:models:deleteBatch", ids),
	getLocations: () => ipcRenderer.invoke("db:locations:getAll"),
	createLocation: (data) => ipcRenderer.invoke("db:locations:create", data),
	updateLocation: (id, data) => ipcRenderer.invoke("db:locations:update", id, data),
	deleteLocation: (id) => ipcRenderer.invoke("db:locations:delete", id),
	deleteLocationsBatch: (ids) => ipcRenderer.invoke("db:locations:deleteBatch", ids),
	getPlans: () => ipcRenderer.invoke("db:plans:getAll"),
	createPlan: (title) => ipcRenderer.invoke("db:plans:create", title),
	createPlanFromTemplate: (title, templateId) => ipcRenderer.invoke("db:plans:createFromTemplate", title, templateId),
	getPlanById: (id) => ipcRenderer.invoke("db:plans:getById", id),
	savePlan: (id, data) => ipcRenderer.invoke("db:plans:save", id, data),
	deletePlan: (id) => ipcRenderer.invoke("db:plans:delete", id),
	deletePlansBatch: (ids) => ipcRenderer.invoke("db:plans:deleteBatch", ids),
	getTemplates: () => ipcRenderer.invoke("db:templates:getAll"),
	saveTemplate: (name, structure) => ipcRenderer.invoke("db:templates:save", name, structure),
	deleteTemplate: (id) => ipcRenderer.invoke("db:templates:delete", id),
	compressImage: (sourcePath, category) => ipcRenderer.invoke("image:compress", sourcePath, category),
	saveImageFromBuffer: (buffer, category) => ipcRenderer.invoke("image:saveFromBuffer", buffer, category),
	deleteImageFile: (path) => ipcRenderer.invoke("image:deleteFile", path),
	renameImageFolder: (oldCat, newCat) => ipcRenderer.invoke("image:renameFolder", oldCat, newCat),
	selectImageFiles: (multiple) => ipcRenderer.invoke("image:selectFiles", multiple),
	cleanupTempFolder: (category) => ipcRenderer.invoke("image:cleanupTempFolder", category),
	imageToURL: (absolutePath) => {
		if (!absolutePath) return "";
		return `local-image://host/${absolutePath.replace(/\\/g, "/")}`;
	},
	getFilePath: (file) => webUtils.getPathForFile(file),
	exportImage: (dataUrl, fileName) => ipcRenderer.invoke("system:exportImage", dataUrl, fileName),
	exportData: (ids) => ipcRenderer.invoke("system:exportData", ids),
	importData: (filePath) => ipcRenderer.invoke("system:importData", filePath),
	workspace: {
		getPath: () => ipcRenderer.invoke("workspace:getPath"),
		selectAndSet: () => ipcRenderer.invoke("workspace:selectAndSet")
	},
	checkUpdate: () => ipcRenderer.invoke("update:check"),
	ignoreVersion: (ver) => ipcRenderer.invoke("update:ignore", ver),
	startDownload: (url) => ipcRenderer.invoke("update:download", url),
	onDownloadProgress: (callback) => {
		const listener = (e, val) => callback(val);
		ipcRenderer.on("update:download-progress", listener);
		return () => ipcRenderer.removeListener("update:download-progress", listener);
	},
	onUpdateAvailable: (callback) => {
		const listener = (e, data) => callback(data);
		ipcRenderer.on("update:available", listener);
		return () => ipcRenderer.removeListener("update:available", listener);
	},
	window: {
		minimize: () => ipcRenderer.send("window-minimize"),
		toggleMaximize: () => ipcRenderer.send("window-toggle-maximize"),
		close: () => ipcRenderer.send("window-close")
	}
});
//#endregion

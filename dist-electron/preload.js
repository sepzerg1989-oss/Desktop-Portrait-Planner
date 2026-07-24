//#endregion
//#region electron/preload.js
var { contextBridge: e, ipcRenderer: t, webUtils: n } = (/* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, { get: (e, t) => (typeof require < "u" ? require : e)[t] }) : e)(function(e) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
}))("electron");
e.exposeInMainWorld("electronAPI", {
	getModels: () => t.invoke("db:models:getAll"),
	createModel: (e) => t.invoke("db:models:create", e),
	updateModel: (e, n) => t.invoke("db:models:update", e, n),
	deleteModel: (e) => t.invoke("db:models:delete", e),
	deleteModelsBatch: (e) => t.invoke("db:models:deleteBatch", e),
	getLocations: () => t.invoke("db:locations:getAll"),
	createLocation: (e) => t.invoke("db:locations:create", e),
	updateLocation: (e, n) => t.invoke("db:locations:update", e, n),
	deleteLocation: (e) => t.invoke("db:locations:delete", e),
	deleteLocationsBatch: (e) => t.invoke("db:locations:deleteBatch", e),
	getClothings: () => t.invoke("db:clothing:getAll"),
	createClothing: (e) => t.invoke("db:clothing:create", e),
	updateClothing: (e, n) => t.invoke("db:clothing:update", e, n),
	deleteClothing: (e) => t.invoke("db:clothing:delete", e),
	deleteClothingsBatch: (e) => t.invoke("db:clothing:deleteBatch", e),
	getProps: () => t.invoke("db:props:getAll"),
	createProp: (e) => t.invoke("db:props:create", e),
	updateProp: (e, n) => t.invoke("db:props:update", e, n),
	deleteProp: (e) => t.invoke("db:props:delete", e),
	deletePropsBatch: (e) => t.invoke("db:props:deleteBatch", e),
	getMakeups: () => t.invoke("db:makeup:getAll"),
	createMakeup: (e) => t.invoke("db:makeup:create", e),
	updateMakeup: (e, n) => t.invoke("db:makeup:update", e, n),
	deleteMakeup: (e) => t.invoke("db:makeup:delete", e),
	deleteMakeupsBatch: (e) => t.invoke("db:makeup:deleteBatch", e),
	getPlans: () => t.invoke("db:plans:getAll"),
	createPlan: (e) => t.invoke("db:plans:create", e),
	createPlanFromTemplate: (e, n) => t.invoke("db:plans:createFromTemplate", e, n),
	getPlanById: (e) => t.invoke("db:plans:getById", e),
	savePlan: (e, n) => t.invoke("db:plans:save", e, n),
	deletePlan: (e) => t.invoke("db:plans:delete", e),
	deletePlansBatch: (e) => t.invoke("db:plans:deleteBatch", e),
	getTemplates: () => t.invoke("db:templates:getAll"),
	saveTemplate: (e, n) => t.invoke("db:templates:save", e, n),
	deleteTemplate: (e) => t.invoke("db:templates:delete", e),
	compressImage: (e, n) => t.invoke("image:compress", e, n),
	saveImageFromBuffer: (e, n) => t.invoke("image:saveFromBuffer", e, n),
	deleteImageFile: (e) => t.invoke("image:deleteFile", e),
	renameImageFolder: (e, n) => t.invoke("image:renameFolder", e, n),
	copyFilesToEntity: (e, n) => t.invoke("image:copyFilesToEntity", e, n),
	selectImageFiles: (e) => t.invoke("image:selectFiles", e),
	cleanupTempFolder: (e) => t.invoke("image:cleanupTempFolder", e),
	imageToURL: (e) => e ? `local-image://host/${e.replace(/\\/g, "/")}` : "",
	getFilePath: (e) => n.getPathForFile(e),
	exportImage: (e, n) => t.invoke("system:exportImage", e, n),
	exportData: (e) => t.invoke("system:exportData", e),
	importData: (e) => t.invoke("system:importData", e),
	workspace: {
		getPath: () => t.invoke("workspace:getPath"),
		selectAndSet: () => t.invoke("workspace:selectAndSet")
	},
	getVersion: () => t.invoke("app:getVersion"),
	checkUpdate: () => t.invoke("update:check"),
	ignoreVersion: (e) => t.invoke("update:ignore", e),
	startDownload: (e) => t.invoke("update:download", e),
	cancelDownload: () => t.invoke("update:cancel"),
	onDownloadProgress: (e) => {
		let n = (t, n) => e(n);
		return t.on("update:download-progress", n), () => t.removeListener("update:download-progress", n);
	},
	onUpdateAvailable: (e) => {
		let n = (t, n) => e(n);
		return t.on("update:available", n), () => t.removeListener("update:available", n);
	},
	window: {
		minimize: () => t.send("window-minimize"),
		toggleMaximize: () => t.send("window-toggle-maximize"),
		close: () => t.send("window-close")
	},
	appBehavior: {
		getSettings: () => t.invoke("app-behavior:getSettings"),
		saveSettings: (e) => t.invoke("app-behavior:saveSettings", e),
		getCapabilities: () => t.invoke("app-behavior:getCapabilities"),
		resolveCloseNotice: (e) => t.invoke("app-behavior:resolveCloseNotice", e),
		onCloseNotice: (e) => {
			let n = (t, n) => e(n);
			return t.on("app-behavior:show-close-notice", n), () => t.removeListener("app-behavior:show-close-notice", n);
		},
		quit: () => t.invoke("app-behavior:quit")
	},
	theme: {
		getSavedTheme: () => t.invoke("theme:getSaved"),
		saveTheme: (e) => t.invoke("theme:save", e),
		setBackgroundColor: (e) => t.send("theme:setBackgroundColor", e)
	},
	ai: {
		getConfig: () => t.invoke("ai:getConfig"),
		saveConfig: (e) => t.invoke("ai:saveConfig", e),
		resetPrompt: () => t.invoke("ai:resetPrompt"),
		generateThemeCopy: (e) => t.invoke("ai:generateThemeCopy", e),
		testConnection: (e) => t.invoke("ai:testConnection", e)
	},
	openExternal: (e) => t.invoke("system:openExternal", e),
	clipboard: { copyImage: (e) => t.invoke("clipboard:copyImage", e) }
});
//#endregion

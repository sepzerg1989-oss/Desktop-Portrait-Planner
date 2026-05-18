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
	getLocations: () => t.invoke("db:locations:getAll"),
	createLocation: (e) => t.invoke("db:locations:create", e),
	updateLocation: (e, n) => t.invoke("db:locations:update", e, n),
	deleteLocation: (e) => t.invoke("db:locations:delete", e),
	getPlans: () => t.invoke("db:plans:getAll"),
	createPlan: (e) => t.invoke("db:plans:create", e),
	createPlanFromTemplate: (e, n) => t.invoke("db:plans:createFromTemplate", e, n),
	getPlanById: (e) => t.invoke("db:plans:getById", e),
	savePlan: (e, n) => t.invoke("db:plans:save", e, n),
	deletePlan: (e) => t.invoke("db:plans:delete", e),
	getTemplates: () => t.invoke("db:templates:getAll"),
	saveTemplate: (e, n) => t.invoke("db:templates:save", e, n),
	deleteTemplate: (e) => t.invoke("db:templates:delete", e),
	compressImage: (e, n) => t.invoke("image:compress", e, n),
	saveImageFromBuffer: (e, n) => t.invoke("image:saveFromBuffer", e, n),
	deleteImageFile: (e) => t.invoke("image:deleteFile", e),
	renameImageFolder: (e, n) => t.invoke("image:renameFolder", e, n),
	selectImageFiles: (e) => t.invoke("image:selectFiles", e),
	cleanupTempFolder: (e) => t.invoke("image:cleanupTempFolder", e),
	imageToURL: (e) => e ? `local-image://host/${e.replace(/\\/g, "/")}` : "",
	getFilePath: (e) => n.getPathForFile(e),
	exportImage: (e, n) => t.invoke("system:exportImage", e, n),
	workspace: {
		getPath: () => t.invoke("workspace:getPath"),
		selectAndSet: () => t.invoke("workspace:selectAndSet")
	},
	window: {
		minimize: () => t.send("window-minimize"),
		toggleMaximize: () => t.send("window-toggle-maximize"),
		close: () => t.send("window-close")
	}
});
//#endregion

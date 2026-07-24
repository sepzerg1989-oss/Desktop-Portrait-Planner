# App Behavior System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cross-platform application behavior system for close-to-tray, true quit, auto launch, and settings-driven behavior.

**Architecture:** Put desktop behavior in `electron/services/AppBehaviorService.js` so `main.js` only wires lifecycle events and IPC. Keep Vue platform-neutral by exposing settings and capabilities through `preload.js`.

**Tech Stack:** Electron 32, electron-store, Vue 3, Tailwind CSS, Node `node:test`.

---

### File Structure

- Create: `electron/services/AppBehaviorService.js` for behavior config, tray/menu-bar icon, close handling, login item updates, and IPC handlers.
- Create: `test/services/appBehaviorService.test.mjs` for config normalization and platform capability decisions.
- Modify: `electron/main.js` to import `Tray`, initialize the behavior service, route quit handling, and avoid closing the database when the window is only hidden.
- Modify: `electron/preload.js` to expose `window.electronAPI.appBehavior`.
- Create: `src/components/settings/BehaviorSettings.vue` for the application behavior settings tab.
- Modify: `src/views/Settings.vue` to add the `应用行为` tab.
- Modify: `Projectbackground/project_documentation.md` to document the new service, settings tab, IPC methods, and behavior config.

### Tasks

- [ ] **Task 1: Write failing service tests**
  - Cover default settings, invalid setting normalization, platform capability labels, and close behavior decisions.
  - Run `node --test test/services/appBehaviorService.test.mjs` and confirm failure because the service does not exist yet.

- [ ] **Task 2: Implement AppBehaviorService**
  - Add settings defaults under `app-behavior-config`.
  - Add `getSettings`, `saveSettings`, `getCapabilities`, `handleWindowClose`, `requestQuit`, `createTray`, `showWindow`, `applyLoginItemSettings`, and `registerIpc`.
  - Keep platform checks centralized inside the service.

- [ ] **Task 3: Wire Electron lifecycle**
  - Initialize `AppBehaviorService` after `createWindow()`.
  - Route `app.activate`, `window-all-closed`, and `window-close` through the service.
  - Close `DatabaseService` only during true application quit.

- [ ] **Task 4: Expose renderer API**
  - Add `appBehavior.getSettings`, `saveSettings`, `getCapabilities`, and `quit` in `preload.js`.

- [ ] **Task 5: Add Settings UI**
  - Add `BehaviorSettings.vue` using existing Morandi settings patterns.
  - Add the `应用行为` tab in `Settings.vue`.
  - Keep settings immediately saved and platform copy driven by capabilities.

- [ ] **Task 6: Update documentation**
  - Add AppBehaviorService to project documentation.
  - Add app behavior IPC and settings tab details.

- [ ] **Task 7: Verify**
  - Run `node --test test/services/appBehaviorService.test.mjs`.
  - Run a syntax/import check for modified Electron services.
  - Do not run `npm run build` unless explicitly requested.

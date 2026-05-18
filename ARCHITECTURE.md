# Portrait Planner (人像摄影策划助手) — 项目架构与依赖关系文档

> **版本**: 1.0.0 | **更新日期**: 2026-05-05 | **目标读者**: 二次开发/重构工程师

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈总览](#2-技术栈总览)
3. [目录结构树](#3-目录结构树)
4. [系统分层架构图](#4-系统分层架构图)
5. [Electron 双进程架构](#5-electron-双进程架构)
6. [IPC 通信映射表](#6-ipc-通信映射表)
7. [前端组件依赖树](#7-前端组件依赖树)
8. [状态管理 (Pinia Store) 数据流](#8-状态管理-pinia-store-数据流)
9. [数据库 ER 图](#9-数据库-er-图)
10. [核心业务链路](#10-核心业务链路)
11. [构建与打包流程](#11-构建与打包流程)
12. [扩展指南](#12-扩展指南)

---

## 1. 项目概览

**Portrait Planner** 是一款完全本地化的跨平台桌面端应用 (Windows/macOS)，面向人像摄影师，提供**策划案编辑、模特库管理、场地库管理**三大核心功能。系统完全离线运行，无需云端服务器。

### 核心功能模块

| 模块 | 说明 |
|------|------|
| **策划案编辑器** | 左-中-右三栏布局，支持模块拖拽排序、实时属性编辑、画布预览 |
| **模特素材库** | 模特档案 CRUD，含头像、模卡、作品照片、标签、地区、价格 |
| **场地素材库** | 场地档案 CRUD，含封面、照片集、地址、标签 |
| **模板系统** | 将策划案结构保存为模板，新建时一键复用 |
| **图片处理** | 拖拽/粘贴/选择上传，自动压缩至 ≤300KB |
| **导出功能** | 策划案导出为长图 (JPG) |

---

## 2. 技术栈总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        TECHNOLOGY STACK                         │
├───────────────────┬─────────────────────────────────────────────┤
│ 桌面框架           │ Electron 32 (Main + Renderer)               │
│ 前端框架           │ Vue 3.5 (Composition API + SFC)             │
│ 构建工具           │ Vite 8 + vite-plugin-electron               │
│ 状态管理           │ Pinia 3                                     │
│ 路由               │ Vue Router 5 (Hash 模式)                    │
│ 样式方案           │ TailwindCSS 3.4 + 莫兰迪色系自定义主题       │
│ 拖拽               │ vuedraggable 4 (基于 SortableJS)            │
│ 本地数据库         │ SQLite (better-sqlite3 12)                  │
│ 图片处理           │ sharp 0.34 (Node.js native)                 │
│ 配置持久化         │ electron-store 11                           │
│ 导出               │ html2canvas 1.4                             │
│ 打包分发           │ electron-builder 26 (NSIS/DMG)              │
└───────────────────┴─────────────────────────────────────────────┘
```

---

## 3. 目录结构树

```
APP/                                    # 项目根目录
│
├── package.json                        # 依赖声明、脚本、electron-builder 配置
├── vite.config.js                      # Vite 构建配置 (Vue + Electron 双入口)
├── tailwind.config.js                  # TailwindCSS 莫兰迪色系主题
├── postcss.config.js                   # PostCSS 配置
├── index.html                          # SPA 入口 HTML
│
├── electron/                           # ═══ Electron 主进程 (Main Process) ═══
│   ├── main.js                         #   主进程入口: 窗口创建、IPC 注册、协议注册
│   ├── preload.js                      #   预加载脚本: Context Bridge API 暴露
│   └── services/                       #   主进程服务层
│       ├── DatabaseService.js          #     SQLite 数据库 CRUD 封装 (单例)
│       ├── ImageService.js             #     图片压缩/存储服务 (并发队列)
│       └── WorkspaceService.js         #     工作区初始化/恢复/切换
│
├── src/                                # ═══ 渲染进程 (Renderer Process / Vue) ═══
│   ├── main.js                         #   Vue 应用入口: createApp + Pinia + Router
│   ├── App.vue                         #   根组件: 布局框架 + 路由视图
│   ├── style.css                       #   全局样式 (Tailwind 指令)
│   │
│   ├── router/
│   │   └── index.js                    #   路由表 (5 条路由, Hash 模式)
│   │
│   ├── store/                          #   Pinia 状态管理
│   │   ├── planStore.js                #     策划案状态 (核心三栏联动)
│   │   ├── modelStore.js               #     模特库状态
│   │   └── locationStore.js            #     场地库状态
│   │
│   ├── composables/                    #   Vue 组合式函数 (复用逻辑)
│   │   ├── useImageUpload.js           #     图片上传/拖拽/粘贴处理
│   │   ├── useModal.js                 #     通用弹窗状态管理
│   │   └── usePasteTarget.js           #     全局粘贴目标路由
│   │
│   ├── utils/
│   │   └── helpers.js                  #   纯工具函数 (chunkArray)
│   │
│   ├── views/                          #   页面级组件 (路由对应)
│   │   ├── Dashboard.vue               #     大厅: 策划案列表 + 新建/模板
│   │   ├── PlanEditor.vue              #     编辑器: 三栏布局容器
│   │   ├── Models.vue                  #     模特库: 卡片墙 + 抽屉
│   │   ├── Locations.vue               #     场地库: 卡片墙 + 抽屉
│   │   └── Settings.vue                #     设置: 工作区路径管理
│   │
│   ├── components/                     #   可复用组件
│   │   ├── TopHeader.vue               #     全局导航栏 (Logo + 路由链接)
│   │   ├── ConfirmModal.vue            #     确认弹窗
│   │   ├── ResourceDrawer.vue          #     通用抽屉容器 (模特/场地复用)
│   │   │
│   │   ├── common/                     #     通用基础组件
│   │   │   ├── ImageUploader.vue       #       图片上传组件 (拖拽/粘贴/选择)
│   │   │   └── TitleBar.vue            #       自定义窗口标题栏 (最小化/最大化/关闭)
│   │   │
│   │   ├── PlanEditor/                 #     策划案编辑器子组件
│   │   │   ├── ModuleManager.vue       #       左侧: 模块列表 + 拖拽排序 + 添加
│   │   │   ├── Canvas.vue              #       中间: 画布预览 (模块动态渲染)
│   │   │   ├── PropertyInspector.vue   #       右侧: 属性编辑面板 (Inspector 路由)
│   │   │   ├── ModelLibraryModal.vue   #       模特库选择弹窗
│   │   │   ├── LocationLibraryModal.vue#       场地库选择弹窗
│   │   │   └── Inspectors/            #       各类型模块的属性编辑器
│   │   │       ├── ThemeInspector.vue  #         主题模块编辑器
│   │   │       ├── ModelInspector.vue  #         模特模块编辑器
│   │   │       ├── LocationInspector.vue#        场地模块编辑器
│   │   │       └── GenericInspector.vue#        通用/参考/自定义模块编辑器
│   │   │
│   │   ├── Models/                     #     模特库子组件
│   │   │   ├── ModelForm.vue           #       模特表单 (创建/编辑)
│   │   │   └── ModelView.vue           #       模特详情展示
│   │   │
│   │   └── Locations/                  #     场地库子组件
│   │       ├── LocationForm.vue        #       场地表单 (创建/编辑)
│   │       └── LocationView.vue        #       场地详情展示
│   │
│   └── assets/
│       └── logo.png                    #   应用 Logo
│
├── public/
│   ├── favicon.svg                     # 网站图标
│   └── icons.svg                       # SVG 图标集
│
├── build/
│   └── icon.ico                        # Windows 应用图标
│
├── dist/                               # Vite 构建输出 (渲染进程)
├── dist-electron/                      # Electron 主进程构建输出
└── dist-release/                       # electron-builder 打包输出
    └── Portrait Planner Setup 1.0.0.exe
```

---

## 4. 系统分层架构图

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          SYSTEM LAYERED ARCHITECTURE                       │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  VIEW LAYER (视图层)                                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │  Dashboard   │ │  PlanEditor  │ │   Models     │ │  Locations   │     │
│  │  (大厅首页)   │ │  (三栏编辑器) │ │  (模特库)    │ │  (场地库)     │     │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘     │
│         │                │                │                │              │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐      │
│  │                    SHARED COMPONENTS (共享组件)                  │      │
│  │  TopHeader │ ResourceDrawer │ ImageUploader │ TitleBar │ Modal  │      │
│  └──────────────────────────────┬─────────────────────────────────┘      │
├─────────────────────────────────┼──────────────────────────────────────────┤
│  STATE LAYER (状态层)            │                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                       │
│  │  planStore   │ │  modelStore  │ │locationStore │                       │
│  │  (策划案)     │ │  (模特库)    │ │  (场地库)     │                       │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                       │
│         │                │                │                              │
│  ┌──────┴────────────────┴────────────────┴──────┐                        │
│  │            COMPOSABLES (逻辑复用层)             │                        │
│  │  useImageUpload │ useModal │ usePasteTarget   │                        │
│  └──────────────────────┬────────────────────────┘                        │
├─────────────────────────┼──────────────────────────────────────────────────┤
│  BRIDGE LAYER (桥接层)   │                                                 │
│  ┌──────────────────────┴────────────────────────┐                        │
│  │           window.electronAPI (preload.js)      │                        │
│  │  contextBridge.exposeInMainWorld('electronAPI')│                        │
│  └──────────────────────┬────────────────────────┘                        │
├═════════════════════════╪══════════════════════════════════════════════════┤
│  MAIN PROCESS (主进程)   │  IPC (ipcMain.handle / ipcRenderer.invoke)     │
│  ┌──────────────────────┴────────────────────────┐                        │
│  │              electron/main.js                  │                        │
│  │         (窗口管理 + IPC 路由注册)               │                        │
│  └──────┬──────────────┬──────────────┬──────────┘                        │
│         │              │              │                                   │
│  ┌──────┴──────┐ ┌─────┴──────┐ ┌─────┴──────┐                            │
│  │ Workspace   │ │ Database   │ │  Image     │                            │
│  │ Service     │ │ Service    │ │  Service   │                            │
│  │ (工作区管理) │ │ (SQLite)   │ │ (sharp压缩)│                            │
│  └──────┬──────┘ └─────┬──────┘ └─────┬──────┘                            │
├─────────┼──────────────┼──────────────┼────────────────────────────────────┤
│  DATA   │              │              │                                    │
│  LAYER  │    ┌─────────┴─────────┐    │                                    │
│ (数据层) │    │  database.sqlite  │    │                                    │
│         │    │  ┌──────┐┌──────┐│    │                                    │
│         │    │  │plans ││models││    │                                    │
│         │    │  ├──────┤├──────┤│    │                                    │
│         │    │  │locat.││templ.││    │                                    │
│         │    │  └──────┘└──────┘│    │                                    │
│         │    └──────────────────┘    │                                    │
│         │                           │                                    │
│         │    ┌──────────────────────┴──────────────────────┐              │
│         │    │           images/ (文件系统)                  │              │
│         └───▶│    models/  │  locations/  │  plans/        │              │
│              └─────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Electron 双进程架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    ELECTRON DUAL-PROCESS ARCHITECTURE            │
└─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────┐    ┌──────────────────────────────┐
  │       MAIN PROCESS (主进程)      │    │    RENDERER PROCESS (渲染进程) │
  │       Node.js 完整能力           │    │    Chromium + Vue 3           │
  │                                 │    │                              │
  │  ┌───────────────────────────┐  │    │  ┌────────────────────────┐  │
  │  │ main.js                   │  │    │  │ index.html             │  │
  │  │ ┌───────────────────────┐ │  │    │  │ ┌───────────────────┐  │  │
  │  │ │ BrowserWindow        │ │  │    │  │ │ src/main.js       │  │  │
  │  │ │ (frame:false,        │ │  │    │  │ │ → createApp(Vue)  │  │  │
  │  │ │  contextIsolation)   │ │  │    │  │ │ → use(Pinia)      │  │  │
  │  │ └───────────────────────┘ │  │    │  │ │ → use(Router)     │  │  │
│  │ │                       │ │  │    │  │ └───────────────────┘  │  │
│  │ │ ipcMain.handle() 注册  │ │  │    │  │                       │  │
│  │ │ ┌───────────────────┐ │ │  │    │  │ window.electronAPI    │  │  │
│  │ │ │ workspace:*       │ │ │  │    │  │ (preload 暴露的 API)  │  │  │
│  │ │ │ db:models:*       │ │ │◄───┼────┼──┤                       │  │
│  │ │ │ db:locations:*    │ │ │IPC │    │  │ Pinia Store           │  │  │
│  │ │ │ db:plans:*        │ │ │    │    │  │ → Actions 调用 API    │  │  │
│  │ │ │ db:templates:*    │ │ │    │    │  │ → State 驱动视图      │  │  │
│  │ │ │ image:*           │ │ │    │    │  │                       │  │  │
│  │ │ │ system:*          │ │ │    │    │  │ Vue Components        │  │  │
│  │ │ │ window:*          │ │ │    │    │  │ → 响应式渲染          │  │  │
│  │ │ └───────────────────┘ │ │  │    │  └────────────────────────┘  │
│  │ └───────────────────────────┘  │    │                              │
│  │                               │    │                              │
│  │  ┌───────────────────────────┐│    │  ┌────────────────────────┐  │
│  │  │ Services (单例)           ││    │  │ local-image:// 协议     │  │
│  │  │ ┌─────────────────────┐  ││    │  │ (安全加载本地图片)      │  │
│  │  │ │ WorkspaceService    │  ││    │  └────────────────────────┘  │
│  │  │ │ → electron-store    │  ││    │                              │
│  │  │ │ → fs (目录创建)      │  ││    │                              │
│  │  │ ├─────────────────────┤  ││    │                              │
│  │  │ │ DatabaseService     │  ││    │                              │
│  │  │ │ → better-sqlite3    │  ││    │                              │
│  │  │ │ → WAL 模式          │  ││    │                              │
│  │  │ ├─────────────────────┤  ││    │                              │
│  │  │ │ ImageService        │  ││    │                              │
│  │  │ │ → sharp (压缩)      │  ││    │                              │
│  │  │ │ → 并发队列 (max 5)  │  ││    │                              │
│  │  │ └─────────────────────┘  ││    │                              │
│  │  └───────────────────────────┘│    │                              │
│  └─────────────────────────────────┘    └──────────────────────────────┘
```

### 安全模型

```
┌──────────────────────────────────────────────────────────────┐
│                     SECURITY MODEL                            │
│                                                              │
│  Renderer Process                    Main Process            │
│  ┌──────────────────┐               ┌──────────────────┐    │
│  │ nodeIntegration: │               │ 完整 Node.js API │    │
│  │ false            │               │ fs, path, sharp  │    │
│  │                  │   preload.js  │ better-sqlite3   │    │
│  │ contextIsolation:│◄─────────────►│ electron-store   │    │
│  │ true             │  Context      │                  │    │
│  │                  │  Bridge       │                  │    │
│  │ 只能访问          │               │                  │    │
│  │ window.electron  │               │                  │    │
│  │ API (白名单)      │               │                  │    │
│  └──────────────────┘               └──────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. IPC 通信映射表

### 6.1 完整 IPC 通道清单

```
preload.js (暴露)                          main.js (注册)
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  渲染进程调用                         主进程处理                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  window.electronAPI.getModels()  ───►  ipcMain.handle('db:models:getAll')    │
│  window.electronAPI.createModel()───►  ipcMain.handle('db:models:create')    │
│  window.electronAPI.updateModel()───►  ipcMain.handle('db:models:update')    │
│  window.electronAPI.deleteModel()───►  ipcMain.handle('db:models:delete')    │
│                                                                  │
│  window.electronAPI.getLocations()──►  ipcMain.handle('db:locations:getAll') │
│  window.electronAPI.createLocation()─►  ipcMain.handle('db:locations:create')│
│  window.electronAPI.updateLocation()─►  ipcMain.handle('db:locations:update')│
│  window.electronAPI.deleteLocation()─►  ipcMain.handle('db:locations:delete')│
│                                                                  │
│  window.electronAPI.getPlans()  ───►  ipcMain.handle('db:plans:getAll')      │
│  window.electronAPI.createPlan() ───►  ipcMain.handle('db:plans:create')     │
│  window.electronAPI.getPlanById()───►  ipcMain.handle('db:plans:getById')    │
│  window.electronAPI.savePlan()  ───►  ipcMain.handle('db:plans:save')        │
│  window.electronAPI.deletePlan() ───►  ipcMain.handle('db:plans:delete')     │
│                                                                  │
│  window.electronAPI.getTemplates()──►  ipcMain.handle('db:templates:getAll') │
│  window.electronAPI.saveTemplate()──►  ipcMain.handle('db:templates:save')   │
│  window.electronAPI.deleteTemplate()─►  ipcMain.handle('db:templates:delete')│
│                                                                  │
│  window.electronAPI.compressImage()──►  ipcMain.handle('image:compress')     │
│  window.electronAPI.saveImageFromBuffer()►ipcMain.handle('image:saveFromBuffer')│
│  window.electronAPI.deleteImageFile()──► ipcMain.handle('image:deleteFile')  │
│  window.electronAPI.renameImageFolder()─► ipcMain.handle('image:renameFolder')│
│  window.electronAPI.selectImageFiles()──► ipcMain.handle('image:selectFiles')│
│  window.electronAPI.cleanupTempFolder()─► ipcMain.handle('image:cleanupTempFolder')│
│                                                                  │
│  window.electronAPI.exportImage() ───►  ipcMain.handle('system:exportImage') │
│                                                                  │
│  window.electronAPI.workspace.getPath()─►ipcMain.handle('workspace:getPath') │
│  window.electronAPI.workspace.selectAndSet()►ipcMain.handle('workspace:selectAndSet')│
│                                                                  │
│  window.electronAPI.window.minimize()──► ipcMain.on('window-minimize')       │
│  window.electronAPI.window.toggleMaximize()►ipcMain.on('window-toggle-maximize')│
│  window.electronAPI.window.close() ───►  ipcMain.on('window-close')          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 纯前端方法 (无需 IPC)

```
window.electronAPI.imageToURL(absolutePath)
  → 纯本地计算: 将绝对路径转为 local-image://host/path 协议 URL

window.electronAPI.getFilePath(file)
  → 调用 webUtils.getPathForFile(file)，获取拖拽文件的物理路径
```

---

## 7. 前端组件依赖树

```
App.vue
├── TitleBar.vue                              # 自定义窗口标题栏
├── TopHeader.vue                             # 全局导航 (非编辑器页面显示)
│   └── router-link → / /models /locations /settings
│
└── <router-view>
    │
    ├── Dashboard.vue                         # 路径: /
    │   ├── usePlanStore()                    # Pinia Store
    │   ├── useModal()                        # 弹窗逻辑
    │   └── ConfirmModal.vue                  # 自定义弹窗
    │
    ├── PlanEditor.vue                        # 路径: /editor
    │   ├── usePlanStore()                    # 核心状态
    │   ├── useModal()
    │   ├── ModuleManager.vue                 # 左侧: 模块管理
    │   │   ├── vuedraggable                  #   拖拽排序
    │   │   └── usePlanStore()
    │   ├── Canvas.vue                        # 中间: 画布预览
    │   │   ├── usePlanStore()
    │   │   └── chunkArray() (helpers.js)     #   等分行高排列
    │   ├── PropertyInspector.vue             # 右侧: 属性编辑
    │   │   ├── usePlanStore()
    │   │   ├── ThemeInspector.vue
    │   │   │   ├── ImageUploader.vue
    │   │   │   └── usePasteTarget()
    │   │   ├── ModelInspector.vue
    │   │   │   ├── ImageUploader.vue
    │   │   │   └── usePasteTarget()
    │   │   ├── LocationInspector.vue
    │   │   │   ├── ImageUploader.vue
    │   │   │   └── usePasteTarget()
    │   │   ├── GenericInspector.vue
    │   │   │   ├── ImageUploader.vue
    │   │   │   └── usePasteTarget()
    │   │   ├── ModelLibraryModal.vue         #   模特库选择弹窗
    │   │   └── LocationLibraryModal.vue      #   场地库选择弹窗
    │   └── ConfirmModal.vue
    │
    ├── Models.vue                            # 路径: /models
    │   ├── useModelStore()
    │   ├── ResourceDrawer.vue                #   通用抽屉
    │   │   ├── ModelView.vue                 #     浏览模式
    │   │   └── ModelForm.vue                 #     编辑模式
    │   │       └── ImageUploader.vue
    │   └── ConfirmModal.vue
    │
    ├── Locations.vue                         # 路径: /locations
    │   ├── useLocationStore()
    │   ├── ResourceDrawer.vue                #   通用抽屉
    │   │   ├── LocationView.vue              #     浏览模式
    │   │   └── LocationForm.vue              #     编辑模式
    │   │       └── ImageUploader.vue
    │   └── ConfirmModal.vue
    │
    └── Settings.vue                          # 路径: /settings (懒加载)
        ├── usePlanStore()
        ├── useModelStore()
        └── useLocationStore()
```

---

## 8. 状态管理 (Pinia Store) 数据流

### 8.1 planStore — 核心三栏联动数据中心

```
┌──────────────────────────────────────────────────────────────────┐
│                      planStore (策划案状态)                        │
├──────────────────────────────────────────────────────────────────┤
│  STATE                                                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ plans: []          // 策划案列表 (大厅卡片)                  │  │
│  │ planId: null       // 当前编辑的策划案 ID                    │  │
│  │ planTitle: ''      // 当前策划案标题                         │  │
│  │ modules: []        // ★ 核心: 模块数组                       │  │
│  │ activeModuleId: null // 当前选中的模块 ID                    │  │
│  │ templates: []      // 可用模板列表                           │  │
│  │ loading: false                                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  MODULES 数据结构 (每个模块):                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ {                                                            │  │
│  │   id: 'm1',           // 唯一标识                            │  │
│  │   type: 'theme',      // 类型: theme|model|location|         │  │
│  │                       //       reference|custom              │  │
│  │   title: '拍摄主题',   // 显示名称                           │  │
│  │   data: {             // 模块数据 (类型决定结构)              │  │
│  │     title: '',        //   theme 专用                        │  │
│  │     description: '',  //   通用描述                          │  │
│  │     name: '',         //   model/location 专用               │  │
│  │     images: [],       //   图片数组 [{url, path, ratio}]     │  │
│  │     tags: [],         //   model/location 专用               │  │
│  │     avatar: '',       //   model 专用                        │  │
│  │     modelCard: '',    //   model 专用                        │  │
│  │     address: '',      //   location 专用                     │  │
│  │     ...               //   其他扩展字段                      │  │
│  │   }                                                          │  │
│  │ }                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ACTIONS (数据流向)                                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  fetchPlans() ─────────────► window.electronAPI.getPlans() │  │
│  │  createPlan(title) ────────► window.electronAPI.createPlan()│  │
│  │  loadPlan(id) ─────────────► window.electronAPI.getPlanById()│ │
│  │  savePlan() ───────────────► window.electronAPI.savePlan() │  │
│  │  deletePlan(id) ───────────► window.electronAPI.deletePlan()│ │
│  │                                                            │  │
│  │  ★ 三栏联动核心:                                            │  │
│  │                                                            │  │
│  │  左侧 ModuleManager                                         │  │
│  │    │ 拖拽排序 → modules 数组重排                             │  │
│  │    │ 添加模块 → modules.push(newModule)                     │  │
│  │    │ 点击模块 → activeModuleId = id                         │  │
│  │    ▼                                                       │  │
│  │  中间 Canvas                                                │  │
│  │    │ 监听 modules → 按序渲染各模块                           │  │
│  │    │ 监听 activeModuleId → 高亮选中模块                      │  │
│  │    │ 点击模块 → setActiveModule(id)                         │  │
│  │    ▼                                                       │  │
│  │  右侧 PropertyInspector                                     │  │
│  │    │ 监听 activeModuleId → 显示对应 Inspector               │  │
│  │    │ 用户编辑 → 直接修改 modules[i].data (响应式)            │  │
│  │    │ 修改即时反映到中间 Canvas                               │  │
│  │    │ 2秒防抖 → 自动保存到 SQLite                            │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 8.2 modelStore / locationStore — 资源库状态

```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│       modelStore            │  │      locationStore          │
├─────────────────────────────┤  ├─────────────────────────────┤
│ STATE                       │  │ STATE                       │
│  models: []                 │  │  locations: []              │
│  loading: false             │  │  loading: false             │
├─────────────────────────────┤  ├─────────────────────────────┤
│ ACTIONS                     │  │ ACTIONS                     │
│  fetchAll() → getModels()   │  │  fetchAll() → getLocations()│
│  create(data) → createModel │  │  create(data) → createLoc   │
│  update(id,data) → update.. │  │  update(id,data) → update.. │
│  remove(id) → deleteModel   │  │  remove(id) → deleteLoc    │
├─────────────────────────────┤  ├─────────────────────────────┤
│ 数据映射 (前端 ↔ 数据库)     │  │ 数据映射                    │
│  images (UI) ↔ images_json  │  │  images (UI) ↔ images_json  │
│  tags (Array) ↔ JSON string │  │  tags (Array) ↔ JSON string │
└─────────────────────────────┘  └─────────────────────────────┘
```

---

## 9. 数据库 ER 图

```
┌──────────────────────────────────────────────────────────────────┐
│                    SQLite DATABASE SCHEMA                         │
│                    (database.sqlite)                              │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐       ┌─────────────────────────┐
│         plans           │       │        models           │
├─────────────────────────┤       ├─────────────────────────┤
│ PK  id          INTEGER │       │ PK  id          INTEGER │
│     title       TEXT    │       │     name        TEXT    │
│     cover_path  TEXT    │       │     tags        TEXT    │  ← JSON array string
│     modules_json TEXT   │  ←JSON│     avatar_path TEXT    │
│     created_at  TEXT    │       │     model_card_path TEXT│
│     updated_at  TEXT    │       │     social      TEXT    │
└─────────────────────────┘       │     region      TEXT    │
                                  │     price       TEXT    │
┌─────────────────────────┐       │     images_json TEXT    │  ← JSON array string
│       locations         │       │     created_at  TEXT    │
├─────────────────────────┤       └─────────────────────────┘
│ PK  id          INTEGER │
│     name        TEXT    │       ┌─────────────────────────┐
│     address     TEXT    │       │       templates         │
│     price       TEXT    │       ├─────────────────────────┤
│     tags        TEXT    │  ←JSON│ PK  id          INTEGER │
│     cover_path  TEXT    │       │     name        TEXT    │
│     images_json TEXT    │  ←JSON│     structure_json TEXT │  ← JSON array string
│     created_at  TEXT    │       │     created_at  TEXT    │
└─────────────────────────┘       └─────────────────────────┘

关系说明:
  • 各表之间无外键约束 (松散关联)
  • 策划案中的模特/场地模块通过 ModelLibraryModal/LocationLibraryModal 
    从 models/locations 表导入数据，导入后数据独立存储在 modules_json 中
  • templates.structure_json 存储模块类型数组，不含具体数据
```

---

## 10. 核心业务链路

### 10.1 图片上传与静默压缩链路

```
┌──────────────────────────────────────────────────────────────────┐
│              IMAGE UPLOAD & COMPRESSION PIPELINE                  │
└──────────────────────────────────────────────────────────────────┘

  用户操作                    前端处理                    主进程处理
  ────────                   ────────                   ────────

  ┌──────────┐
  │ 拖拽图片  │──┐
  └──────────┘  │
                ├──► useImageUpload.handleDrop()
  ┌──────────┐  │       │
  │ 粘贴图片  │──┘       │ 1. 提取文件路径
  └──────────┘          │    (webUtils.getPathForFile)
                        │
  ┌──────────┐          │ 2. 调用 IPC
  │ 选择文件  │──┐       │
  └──────────┘  ├───────┘
                │
                ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  window.electronAPI.compressImage(sourcePath, category)     │
  │  window.electronAPI.saveImageFromBuffer(buffer, category)   │
  └──────────────────────────┬──────────────────────────────────┘
                             │ IPC invoke
                             ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  ImageService.compressAndStore(sourcePath, category)        │
  │                                                             │
  │  并发队列 (max 5):                                          │
  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
  │  │ Task │ │ Task │ │ Task │ │ Task │ │ Task │             │
  │  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘             │
  │     │        │        │        │        │                  │
  │     ▼        ▼        ▼        ▼        ▼                  │
  │  ┌─────────────────────────────────────────┐               │
  │  │  sharp 压缩流水线:                       │               │
  │  │  1. .rotate() — 修正 EXIF 旋转          │               │
  │  │  2. .resize(1600) — 限制最大宽度        │               │
  │  │  3. .jpeg(quality:80, mozjpeg) — 压缩   │               │
  │  │  4. 若 >300KB → 降 quality 至 60        │               │
  │  │  5. 若仍 >300KB → 降分辨率至 1200       │               │
  │  │  6. 若仍 >300KB → 降 quality 至 40      │               │
  │  └─────────────────────────────────────────┘               │
  │                                                             │
  │  输出: { success, path, ratio }                             │
  │  存储: workspace/images/{category}/{timestamp}_{hash}.jpg   │
  └──────────────────────────┬──────────────────────────────────┘
                             │ 返回压缩后路径
                             ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  前端接收:                                                   │
  │  window.electronAPI.imageToURL(result.path)                 │
  │  → local-image://host/D:/workspace/images/plans/xxx.jpg     │
  │                                                             │
  │  图片通过 Electron 自定义协议加载:                            │
  │  protocol.handle('local-image', ...)                        │
  │  → fs.createReadStream(filePath) 流式返回                   │
  └─────────────────────────────────────────────────────────────┘
```

### 10.2 左中右三栏实时联动机制

```
┌──────────────────────────────────────────────────────────────────┐
│           THREE-PANEL REAL-TIME SYNCHRONIZATION                   │
└──────────────────────────────────────────────────────────────────┘

  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
  │  ModuleManager  │     │     Canvas      │     │PropertyInspector│
  │    (左侧 280px)  │     │   (中间 flex-1)  │     │   (右侧 360px)  │
  ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
  │                 │     │                 │     │                 │
  │ [拖拽排序]       │     │ [模块渲染]       │     │ [属性表单]       │
  │                 │     │                 │     │                 │
  │  ┌───┐          │     │ ┌─────────────┐ │     │ ThemeInspector  │
  │  │ T │ 主题     │────►│ │ 主题模块     │ │◄────│ ← title        │
  │  └───┘          │     │ │ 标题+图片    │ │     │ ← description  │
  │  ┌───┐          │     │ └─────────────┘ │     │ ← images       │
  │  │ M │ 模特     │────►│ ┌─────────────┐ │     │                │
  │  └───┘          │     │ │ 模特模块     │ │◄────│ ModelInspector │
  │  ┌───┐          │     │ │ 头像+模卡    │ │     │ ← name/avatar  │
  │  │ L │ 场地     │────►│ └─────────────┘ │     │ ← tags/images  │
  │  └───┘          │     │ ┌─────────────┐ │     │                │
  │  ┌───┐          │     │ │ 场地模块     │ │◄────│LocationInspector│
  │  │ R │ 参考     │────►│ └─────────────┘ │     │ ← name/address │
  │  └───┘          │     │ ┌─────────────┐ │     │ ← images       │
  │                 │     │ │ 参考模块     │ │◄────│                │
  │                 │     │ └─────────────┘ │     │GenericInspector│
  │                 │     │                 │     │ ← description  │
  │                 │     │                 │     │ ← images       │
  └─────────────────┘     └─────────────────┘     └─────────────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │      planStore (Pinia)       │
                    │  ┌────────────────────────┐  │
                    │  │ modules: [...]          │  │
                    │  │ activeModuleId: 'm2'    │  │
                    │  └────────────────────────┘  │
                    └──────────────┬──────────────┘
                                   │
                    2秒防抖自动保存 ▼
                    ┌──────────────────────────────┐
                    │ window.electronAPI.savePlan  │
                    │ → SQLite plans.modules_json  │
                    └──────────────────────────────┘
```

### 10.3 应用启动流程

```
┌──────────────────────────────────────────────────────────────────┐
│                     APPLICATION STARTUP FLOW                      │
└──────────────────────────────────────────────────────────────────┘

  app.whenReady()
      │
      ▼
  ┌──────────────────────┐
  │ 注册 local-image://   │  protocol.handle('local-image', ...)
  │ 自定义协议            │
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │ WorkspaceService     │
  │ .tryRestore()        │
  └──────────┬───────────┘
             │
        ┌────┴────┐
        │         │
     成功恢复   首次启动
        │         │
        │         ▼
        │   ┌──────────────────────┐
        │   │ 弹出文件夹选择对话框   │
        │   │ WorkspaceService     │
        │   │ .selectWorkspace()   │
        │   └──────────┬───────────┘
        │              │
        │        用户取消 → app.quit()
        │              │
        └──────┬───────┘
               │ 用户选择了目录
               ▼
  ┌──────────────────────┐
  │ WorkspaceService     │
  │ .initWorkspace(path) │
  │                      │
  │ 1. 创建子目录:        │
  │    images/models/    │
  │    images/locations/ │
  │    images/plans/     │
  │    exports/          │
  │                      │
  │ 2. DatabaseService   │
  │    .init(path)       │
  │    → 创建 SQLite 表   │
  │    → 开启 WAL 模式    │
  │                      │
  │ 3. ImageService      │
  │    .setWorkspace(path)│
  │                      │
  │ 4. electron-store    │
  │    持久化路径         │
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │ createWindow()       │
  │ → BrowserWindow      │
  │ → 加载 Vue 应用       │
  └──────────────────────┘
```

---

## 11. 构建与打包流程

```
┌──────────────────────────────────────────────────────────────────┐
│                     BUILD & PACKAGE PIPELINE                      │
└──────────────────────────────────────────────────────────────────┘

  开发模式:
  ┌─────────┐     ┌────────────────────────────────────────────┐
  │ npm run │────►│ vite (开发服务器)                            │
  │ dev     │     │  ├── Vue 热更新 (localhost:5173)            │
  └─────────┘     │  ├── electron/main.js → dist-electron/     │
                  │  ├── electron/preload.js → dist-electron/  │
                  │  └── 自动启动 Electron 窗口                  │
                  └────────────────────────────────────────────┘

  生产构建:
  ┌──────────────┐
  │ npm run      │
  │ build:win    │
  └──────┬───────┘
         │
         ▼
  ┌──────────────────────┐
  │ vite build           │
  │  ├── Vue → dist/     │
  │  ├── main.js →       │
  │  │   dist-electron/  │
  │  └── preload.js →    │
  │      dist-electron/  │
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │ electron-builder     │
  │  ├── 读取 package.json│
  │  │   build 配置       │
  │  ├── asar 打包        │
  │  │   (unpack:        │
  │  │    better-sqlite3,│
  │  │    sharp)         │
  │  ├── NSIS 安装包      │
  │  └── 输出:            │
  │      dist-release/   │
  │      Portrait Planner│
  │      Setup 1.0.0.exe │
  └──────────────────────┘

  关键配置:
  • asarUnpack: better-sqlite3 和 sharp 包含原生 .node 模块，必须解包
  • external: vite 构建主进程时，将 native 模块标记为外部依赖
  • preload.js 输出格式为 CJS (CommonJS)，因为 Electron preload 不支持 ESM
```

---

## 12. 扩展指南

### 12.1 添加新的模块类型

1. **定义模块数据结构** — 在 `planStore.js` 的 `addModule()` 中添加默认 data
2. **创建 Inspector 组件** — 在 `src/components/PlanEditor/Inspectors/` 新建 `XxxInspector.vue`
3. **注册 Inspector** — 在 `PropertyInspector.vue` 中添加 `v-if="activeModule.type === 'xxx'"`
4. **添加 Canvas 渲染** — 在 `Canvas.vue` 中添加 `v-if="module.type === 'xxx'"` 渲染块
5. **注册模块选项** — 在 `ModuleManager.vue` 的 `addOptions` 数组中添加新类型

### 12.2 添加新的数据库表

1. 在 `DatabaseService.js` 的 `_createTables()` 中添加 `CREATE TABLE IF NOT EXISTS`
2. 在 `VALID_TABLES` 和 `VALID_COLUMNS` 中注册新表
3. 在 `main.js` 中注册对应的 `ipcMain.handle()` 处理器
4. 在 `preload.js` 中暴露对应的 API 方法
5. 创建对应的 Pinia Store (`src/store/xxxStore.js`)

### 12.3 添加新的路由页面

1. 在 `src/views/` 创建新页面组件
2. 在 `router/index.js` 的 `routes` 数组中添加路由记录
3. 在 `TopHeader.vue` 中添加导航链接 (可选)

### 12.4 关键注意事项

| 注意点 | 说明 |
|--------|------|
| **native 模块** | `better-sqlite3` 和 `sharp` 是原生模块，必须在 `vite.config.js` 的 `external` 和 `package.json` 的 `asarUnpack` 中配置 |
| **preload 格式** | preload 脚本必须输出为 CJS 格式 (`format: 'cjs'`) |
| **路由模式** | 必须使用 `createWebHashHistory`，Electron 本地文件不支持 HTML5 History 模式 |
| **图片协议** | 本地图片通过 `local-image://` 自定义协议加载，不要直接使用 `file://` |
| **contextIsolation** | 始终保持 `true`，所有主进程能力通过 `preload.js` 的 Context Bridge 暴露 |
| **WAL 模式** | SQLite 开启 WAL 模式以提升并发性能，但注意 WAL 文件需要定期 checkpoint |
| **自动保存** | 策划案编辑器使用 2 秒防抖自动保存，避免频繁写入数据库 |

---

> **文档维护**: 当项目结构发生重大变更时，请同步更新本文档。

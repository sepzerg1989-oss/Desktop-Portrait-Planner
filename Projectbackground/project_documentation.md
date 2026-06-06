# Portrait Planner 项目核心资料与开发指南

本指南旨在梳理 **Portrait Planner** (人像拍摄策划案桌面应用) 的核心架构、数据库结构、IPC 通信接口以及前端设计。当前后文窗口超出或由新的 AI 承接任务时，此文档可作为**快速理解项目与启动新任务的黄金指南**。

---

## 1. 项目简介与定位

**Portrait Planner** 是一款专为摄影师、策展人或导演设计的**离线人像拍摄策划案管理工具**。

- **核心逻辑**：基于"工作区 (Workspace)"概念实现数据与图片的本地闭环管理。用户可以管理模特库、场地库、服装库、道具库、妆容库，并拼装出结构化、模块化的拍摄策划案，支持拖拽排序、自动计算黄金日照时刻，以及一键导出长图或策划包数据。
- **当前版本**：`v1.5.1`
- **开发约束**：
  - 代码精简、模块化。
  - 单个页面文件（Vue）代码尽量保持在 **500行以内**，以维护极高的可读性与可扩展性。

---

## 2. 核心技术栈

- **基础平台**：`Electron` (v32.0.0) 提供跨平台桌面能力，运行纯本地服务。
- **前端框架**：`Vue 3` (Composition API, SFC) + `Vue Router` (WebHashHistory)
- **状态管理**：`Pinia` 提供全局状态存储 (`planStore`, `modelStore`, `locationStore`, `clothingStore`, `propsStore`, `makeupStore`, `themeStore`)。
- **数据引擎**：`better-sqlite3`（SQLite3 的原生 C++ 绑定驱动，提供极高的本地读写并发性能）。
- **样式方案**：`Tailwind CSS` + `PostCSS`（界面设计采用高质感的莫兰迪色系，支持 6 套多主题切换，全无边框设计 `frame: false`）。
- **辅助库**：
  - `sharp`：主进程中用于本地图片的压缩与格式优化（目标 ≤300KB），减少图片占用空间。
  - `suncalc`：基于经纬度或行政区自动计算拍摄当日的日出、日落、黄金时间段。
  - `vuedraggable`：前端用于策划案内部模块的拖拽排序。
  - `html2canvas`：前端用于将策划案 Canvas 渲染导出为长图。
  - `electron-store`：管理和记忆基础客户端配置（如上次打开的工作区路径、主题偏好等）。

---

## 3. 工作区架构与可移植性

应用的数据与素材完全跟随**工作区 (Workspace)**。程序启动时使用 `WorkspaceService.tryRestore()` 尝试恢复上一次的工作区。若为首次启动，会弹出对话框强制选择工作区路径。

### 工作区目录结构
选择工作区目录后，程序会在该目录下自动初始化以下结构：

```text
<工作区根目录>/
├── database.sqlite            # SQLite 3 本地数据库
├── exports/                   # 默认的数据导出目录
└── images/                    # 图片素材目录
    ├── models/                # 模特图片文件夹，子文件夹为 models/${modelId}/
    ├── locations/             # 场地图片文件夹，子文件夹为 locations/${locationId}/
    ├── plans/                 # 策划案图片文件夹，子文件夹为 plans/${planId}/
    ├── clothing/              # 服装图片文件夹，子文件夹为 clothing/${clothingId}/
    ├── props/                 # 道具图片文件夹，子文件夹为 props/${propsId}/
    └── makeup/                # 妆容图片文件夹，子文件夹为 makeup/${makeupId}/
```

---

## 4. 数据库表结构设计 (`database.sqlite`)

数据库包含 7 张核心业务数据表，表定义及业务字段如下：

### 4.1 策划案表 (`plans`)
存储策划案基本信息及包含的模块结构。
```sql
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '未命名策划案',
  cover_path TEXT,
  modules_json TEXT DEFAULT '[]',                  -- JSON 数组，存放策划案内部拼装的模块
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);
```

### 4.2 模特库表 (`models`)
存储模特基本档及关联相册。
```sql
CREATE TABLE IF NOT EXISTS models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  tags TEXT DEFAULT '[]',                           -- JSON 数组，如 ["日系", "复古"]
  avatar_path TEXT,                                 -- 头像绝对路径
  model_card_path TEXT,                             -- 模卡绝对路径
  social TEXT DEFAULT '',                           -- 社交账号信息
  region TEXT DEFAULT '',                           -- 地区
  price TEXT DEFAULT '',                            -- 报价/约拍条件
  images_json TEXT DEFAULT '[]',                    -- JSON 数组，关联的个人相册
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
```

### 4.3 场地库表 (`locations`)
存储拍摄场地基本信息。
```sql
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  price TEXT DEFAULT '',                            -- 场地租金
  tags TEXT DEFAULT '[]',                           -- 场地标签 JSON 数组
  cover_path TEXT,                                  -- 场地封面路径
  images_json TEXT DEFAULT '[]',                    -- 场地多张图的 JSON 数组
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
```

### 4.4 模板预设表 (`templates`)
允许将经常使用的策划案结构保存为模板，快速创建新策划。
```sql
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  structure_json TEXT DEFAULT '[]',                 -- 模板模块的结构定义，如 [{"type":"theme", "title":"拍摄主题"}]
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
```

### 4.5 服装库表 (`clothing`)
存储服装搭配信息，用于策划案中引用绑定。
```sql
CREATE TABLE IF NOT EXISTS clothing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  link TEXT DEFAULT '',                             -- 购买链接
  price TEXT DEFAULT '',
  images_json TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
```

### 4.6 道具库表 (`props`)
存储拍摄道具信息。
```sql
CREATE TABLE IF NOT EXISTS props (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  link TEXT DEFAULT '',                             -- 购买链接
  price TEXT DEFAULT '',
  images_json TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
```

### 4.7 妆容库表 (`makeup`)
存储妆面造型信息。
```sql
CREATE TABLE IF NOT EXISTS makeup (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  images_json TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
```

---

## 5. Electron IPC 桥接与 Preload API

前端 Vue 页面通过暴露在 `window.electronAPI` 上的类型安全接口与主进程通信，通信层主要完成了两件事：
1. 数据库 CRUD 交互的安全调用。
2. 规避浏览器沙箱机制对本地文件的限制。

### 5.1 本地图片映射安全协议 (`local-image://`)
为加载本地磁盘中工作区图片，主进程注册了 `local-image://` 协议：
```javascript
// Preload 暴露的转换工具：
window.electronAPI.imageToURL(absolutePath) 
// 输入: "D:\Workspace\images\models\1\avatar.jpg"
// 输出: "local-image://host/D:/Workspace/images/models/1/avatar.jpg"
```
主进程截获此自定义协议并流式读取 (`fs.createReadStream`) 返回文件，这确保了本地图片能正常显示在 Vue 的 `<img>` 标签中且拥有极佳的安全性与性能。

### 5.2 核心 IPC 方法一览 (`preload.js`)

| 业务模块 | 前端暴露方法 | 对应主进程 IPC 处理器 | 说明 |
| :--- | :--- | :--- | :--- |
| **工作区** | `workspace.getPath()` | `workspace:getPath` | 获取当前激活的工作区绝对路径 |
| | `workspace.selectAndSet()` | `workspace:selectAndSet` | 弹出文件夹选择器并切换/初始化工作区 |
| **模特库** | `getModels()` | `db:models:getAll` | 获取所有模特 |
| | `createModel(data)` | `db:models:create` | 写入模特数据 |
| | `updateModel(id, data)` | `db:models:update` | 更新模特数据 |
| | `deleteModel(id)` | `db:models:delete` | 删除模特（同步清理对应的图片文件夹） |
| | `deleteModelsBatch(ids)` | `db:models:deleteBatch` | 批量删除模特 |
| **场地库** | `getLocations()` | `db:locations:getAll` | 获取所有场地 |
| | `createLocation(data)` | `db:locations:create` | 写入场地数据 |
| | `updateLocation(id, data)` | `db:locations:update` | 更新场地数据 |
| | `deleteLocation(id)` | `db:locations:delete` | 删除场地（同步清理对应的图片文件夹） |
| | `deleteLocationsBatch(ids)` | `db:locations:deleteBatch` | 批量删除场地 |
| **服装库** | `getClothings()` | `db:clothing:getAll` | 获取所有服装搭配 |
| | `createClothing(data)` | `db:clothing:create` | 写入服装数据 |
| | `updateClothing(id, data)` | `db:clothing:update` | 更新服装数据 |
| | `deleteClothing(id)` | `db:clothing:delete` | 删除服装（同步清理对应的图片文件夹） |
| | `deleteClothingsBatch(ids)` | `db:clothing:deleteBatch` | 批量删除服装 |
| **道具库** | `getProps()` | `db:props:getAll` | 获取所有道具 |
| | `createProp(data)` | `db:props:create` | 写入道具数据 |
| | `updateProp(id, data)` | `db:props:update` | 更新道具数据 |
| | `deleteProp(id)` | `db:props:delete` | 删除道具（同步清理对应的图片文件夹） |
| | `deletePropsBatch(ids)` | `db:props:deleteBatch` | 批量删除道具 |
| **妆容库** | `getMakeups()` | `db:makeup:getAll` | 获取所有妆容 |
| | `createMakeup(data)` | `db:makeup:create` | 写入妆容数据 |
| | `updateMakeup(id, data)` | `db:makeup:update` | 更新妆容数据 |
| | `deleteMakeup(id)` | `db:makeup:delete` | 删除妆容（同步清理对应的图片文件夹） |
| | `deleteMakeupsBatch(ids)` | `db:makeup:deleteBatch` | 批量删除妆容 |
| **策划案** | `getPlans()` | `db:plans:getAll` | 获取所有策划案 |
| | `createPlan(title)` | `db:plans:create` | 创建默认包含4个核心模块的空策划案 |
| | `createPlanFromTemplate(...)`| `db:plans:createFromTemplate`| 根据所选模板结构初始化策划案 |
| | `getPlanById(id)` | `db:plans:getById` | 获取单条策划案（包含模块 JSON） |
| | `savePlan(id, data)` | `db:plans:save` | 保存策划案并自动更新修改时间 |
| | `deletePlan(id)` | `db:plans:delete` | 删除策划案（同步清理对应图片文件夹） |
| | `deletePlansBatch(ids)` | `db:plans:deleteBatch` | 批量删除策划案 |
| **模板库** | `getTemplates()` | `db:templates:getAll` | 获取所有保存的模板结构列表 |
| | `saveTemplate(name, struct)`| `db:templates:save` | 将当前模块结构保存为预设模板 |
| | `deleteTemplate(id)` | `db:templates:delete` | 删除指定模板 |
| **图片/导出**| `compressImage(path, cat)` | `image:compress` | 选择图片后调用主进程 sharp 压缩存放 |
| | `saveImageFromBuffer(buf, cat)`| `image:saveFromBuffer` | 从 Buffer 保存图片（用于剪贴板等场景） |
| | `deleteImageFile(path)` | `image:deleteFile` | 删除指定图片文件 |
| | `renameImageFolder(old, new)` | `image:renameFolder` | 重命名图片目录（如策划案改名时同步） |
| | `selectImageFiles()` | `image:selectFiles` | 调用主进程文件对话框，选择多张图 |
| | `cleanupTempFolder(cat)` | `image:cleanupTempFolder` | 清理临时图片目录 |
| | `imageToURL(absolutePath)` | (纯本地计算) | 将本地绝对路径转为 `local-image://` 协议 URL |
| | `getFilePath(file)` | (webUtils) | 通过 webUtils 获取拖拽文件的真实路径 |
| | `exportImage(dataUrl, name)`| `system:exportImage` | 传入 Base64 格式，保存长图为 JPEG |
| | `exportData(ids)` | `system:exportData` | 导出选择的策划案打包数据（含图片） |
| | `importData(path)` | `system:importData` | 导入打包的数据包还原为策划案与图片 |
| **主题系统** | `theme.getSavedTheme()` | `theme:getSaved` | 获取上次保存的主题配置 |
| | `theme.saveTheme(name)` | `theme:save` | 持久化保存当前主题 |
| | `theme.setBackgroundColor(hex)`| `theme:setBackgroundColor` | 同步 Electron 窗口底色 |
| **自动更新** | `checkUpdate()` | `update:check` | 手动触发更新检查 |
| | `ignoreVersion(ver)` | `update:ignore` | 忽略指定版本更新 |
| | `startDownload(url)` | `update:download` | 开始下载并安装更新 |
| | `onDownloadProgress(cb)` | `update:download-progress` | 监听下载进度 |
| | `onUpdateAvailable(cb)` | `update:available` | 监听新版本可用事件 |
| **窗口控制** | `window.minimize()` | `window-minimize` | 最小化窗口 |
| | `window.toggleMaximize()` | `window-toggle-maximize` | 切换窗口最大化/还原 |
| | `window.close()` | `window-close` | 关闭窗口 |

---

## 6. 前端模块化与状态设计

前端采用 Vue-Router 控制页面路由，核心视图均映射至独立的状态 Store。所有资源库 Store 均通过 `createLibraryStore` 工厂函数统一生成，消除重复代码。

### 6.1 页面路由与视图分布

- **大厅页 (`/` -> `Dashboard.vue`)**：
  - 展示所有策划案卡片（包含标题、封面图、修改时间）。
  - 支持快捷搜索、批量删除、导入/导出策划案包。
  - 新建策划案：可直接新建空策划案，或选择系统预设模板快速建立。
- **策划编辑器 (`/editor` -> `PlanEditor.vue`)**：
  - 核心**三栏式联动**设计。
  - **左栏**：模块导航栏，支持拖拽排序（通过 `vuedraggable`）、添加模块、删除模块。
  - **中栏**：Canvas 画布，自动根据当前激活的模块类型映射对应的渲染组件。
  - **右栏**：PropertyInspector 属性检查器，自动根据模块类型映射对应的表单编辑控件。
- **模特库页 (`/models` -> `Models.vue`)**：
  - 管理人像模特名录，支持拼音与标签过滤。
  - 编辑模特档案：姓名、地区、价格、社交平台链接、上传模卡、批量添加生活照/样片作为模特相册。
- **场地库页 (`/locations` -> `Locations.vue`)**：
  - 管理场地名录，支持地址、价格、标签管理。
  - 可批量上传场地环境图片。
- **服装搭配库 (`/clothing` -> `Clothing.vue`)**：
  - 管理服装搭配记录，支持描述、标签、购买链接、价格管理。
  - 可批量上传服装参考图片。
- **道具库 (`/props` -> `Props.vue`)**：
  - 管理拍摄道具名录，支持描述、标签、购买链接、价格管理。
  - 可批量上传道具参考图片。
- **妆面造型库 (`/makeup` -> `Makeup.vue`)**：
  - 管理妆面造型记录，支持描述、标签管理。
  - 可批量上传妆容参考图片。
- **设置页 (`/settings` -> `Settings.vue`)**：
  - **工作区存储**：修改/切换工作区目录。
  - **主题切换**：6 套莫兰迪色系主题自由切换。
  - **数据交换**：导入/导出策划案数据包。
  - **更新管理**：自动/手动检查更新升级。

### 6.2 策划案内部模块 (Modules) 详细结构设计

在 `plans` 表的 `modules_json` 中，一个完整的策划案由数个 Module 组成。结构范例如下：

```json
[
  {
    "id": "m1",
    "type": "theme",
    "title": "拍摄主题",
    "data": {
      "title": "情绪复古人像",
      "description": "主要表达午后阳光透入室内的朦胧与复古感...",
      "images": ["D:/Workspace/images/plans/1/theme_0.jpg"]
    }
  },
  {
    "id": "m2",
    "type": "model",
    "title": "拍摄模特",
    "data": {
      "name": "夏茉",
      "avatar": "D:/Workspace/images/models/3/avatar.jpg",
      "tags": ["日系", "甜美"],
      "modelId": 3
    }
  },
  {
    "id": "m3",
    "type": "shoot_time",
    "title": "拍摄时间",
    "data": {
      "date": "2026-06-15",
      "startTime": "14:00",
      "endTime": "18:00",
      "showSunTimes": true,
      "province": "浙江省",
      "city": "杭州市",
      "lat": 30.2741,
      "lng": 120.1551
    }
  }
]
```

#### 支持的模块类型 (`type`)：
1. `theme`（拍摄主题）：包含标题、描述与参考图片。
2. `model`（拍摄模特）：绑定模特档案（选择后同步复制模特卡数据进入模块，用于解耦）。
3. `location`（拍摄场地）：绑定场地档案（选择后同步复制场地数据）。
4. `reference`（参考样片）：多图画廊。
5. `clothing`（模特服装）：服装搭配清单，每个 item 包含名称、描述、标签、价格、购买链接、参考图。
6. `props`（拍摄道具）：道具清单，每个 item 包含名称、描述、标签、价格、购买链接、参考图。
7. `makeup`（拍摄妆容）：妆容名称、描述、标签、参考图。
8. `shoot_time`（拍摄日期）：结合经纬度或城市，调用日照算法自动渲染"黄金时间"、"蓝调时间"、"日出日落"。
9. `custom`（自定义模块）：通用富文本描述与多图。

### 6.3 全局状态 Store 一览

| Store 文件 | Store ID | 职责 |
| :--- | :--- | :--- |
| [planStore.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/store/planStore.js) | `plan` | 策划案列表、当前编辑策划案、模块 CRUD、模板管理 |
| [modelStore.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/store/modelStore.js) | `model` | 模特库 CRUD（基于 `createLibraryStore`） |
| [locationStore.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/store/locationStore.js) | `location` | 场地库 CRUD（基于 `createLibraryStore`） |
| [clothingStore.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/store/clothingStore.js) | `clothing` | 服装库 CRUD（基于 `createLibraryStore`） |
| [propsStore.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/store/propsStore.js) | `props` | 道具库 CRUD（基于 `createLibraryStore`） |
| [makeupStore.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/store/makeupStore.js) | `makeup` | 妆容库 CRUD（基于 `createLibraryStore`） |
| [themeStore.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/store/themeStore.js) | `theme` | 6 套莫兰迪主题切换与持久化 |
| [createLibraryStore.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/store/createLibraryStore.js) | (工厂函数) | 通用资源库 Store 工厂，消除重复代码 |

### 6.4 莫兰迪多主题系统

支持 6 套高质感主题，通过 `themeStore` 管理，`electron-store` 持久化，`data-theme` 属性挂载至 DOM 根节点实现 CSS 变量切换：

| 主题 ID | 主题名称 | 底色 |
| :--- | :--- | :--- |
| `default` | 暖调白棚 (Daylight Studio) | `#E5E0D8` |
| `darkroom` | 电影暗房 (Cinematic Darkroom) | `#121212` |
| `gallery` | 现代画廊 (Plaster Gallery) | `#F5F5F7` |
| `sage` | 灰绿鼠尾草 (The Botanist) | `#D1D5D0` |
| `rose` | 枯玫瑰 (The Romantic) | `#D9CECD` |
| `haze` | 雾霾蓝 (The Melancholy) | `#C6CDD3` |

### 6.5 主进程服务架构

| 服务文件 | 职责 |
| :--- | :--- |
| [WorkspaceService.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/electron/services/WorkspaceService.js) | 工作区的创建、初始化、恢复与持久化 |
| [DatabaseService.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/electron/services/DatabaseService.js) | SQLite 数据库初始化、CRUD、事务、迁移 |
| [ImageService.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/electron/services/ImageService.js) | 图片压缩（sharp, ≤300KB）、存储、删除、重命名 |
| [ExportService.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/electron/services/ExportService.js) | 策划案数据包导出（含图片 Base64 打包）与导入还原 |
| [UpdateService.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/electron/services/UpdateService.js) | 自动/手动更新检测、下载、安装 |

### 6.6 关键组件目录结构

```text
src/components/
├── TopHeader.vue                    # 全局导航头（大厅/资源库页显示）
├── ConfirmModal.vue                 # 通用确认弹窗
├── ResourceDrawer.vue               # 右侧滑出抽屉（资源库新建/编辑表单容器）
├── common/
│   ├── TitleBar.vue                 # 自定义标题栏（窗口控制按钮）
│   ├── FilterPanel.vue              # 通用过滤/排序面板
│   ├── ImageUploader.vue            # 图片上传组件
│   ├── CustomSelect.vue             # 自定义下拉选择器
│   ├── BatchActionBar.vue           # 批量操作工具栏
│   ├── MorandiModal.vue             # 莫兰迪风格通用模态框
│   ├── DataExchangeModal.vue        # 数据导入/导出模态框
│   └── UpdatePromptModal.vue        # 更新提示模态框
├── Models/
│   ├── ModelView.vue                # 模特卡片展示
│   └── ModelForm.vue                # 模特编辑表单
├── Locations/
│   ├── LocationView.vue             # 场地卡片展示
│   └── LocationForm.vue             # 场地编辑表单
├── Clothing/
│   ├── ClothingView.vue             # 服装卡片展示
│   └── ClothingForm.vue             # 服装编辑表单
├── Props/
│   ├── PropsView.vue                # 道具卡片展示
│   └── PropsForm.vue                # 道具编辑表单
├── Makeup/
│   ├── MakeupView.vue               # 妆容卡片展示
│   └── MakeupForm.vue               # 妆容编辑表单
├── PlanEditor/
│   ├── Canvas.vue                   # 策划案画布（模块渲染区）
│   ├── PropertyInspector.vue        # 属性检查器（根据模块类型加载对应 Inspector）
│   ├── ModuleManager.vue            # 左栏模块导航管理器
│   ├── ExportModuleModal.vue        # 导出模块选择弹窗
│   ├── ModelLibraryModal.vue        # 模特库选择弹窗
│   ├── LocationLibraryModal.vue     # 场地库选择弹窗
│   ├── ClothingLibraryModal.vue     # 服装库选择弹窗
│   ├── PropsLibraryModal.vue        # 道具库选择弹窗
│   ├── MakeupLibraryModal.vue       # 妆容库选择弹窗
│   ├── Inspectors/
│   │   ├── ThemeInspector.vue       # 主题模块编辑面板
│   │   ├── ModelInspector.vue       # 模特模块编辑面板
│   │   ├── LocationInspector.vue    # 场地模块编辑面板
│   │   ├── ClothingInspector.vue    # 服装模块编辑面板
│   │   ├── PropsInspector.vue       # 道具模块编辑面板
│   │   ├── MakeupInspector.vue      # 妆容模块编辑面板
│   │   ├── TimeInspector.vue        # 拍摄时间模块编辑面板
│   │   └── GenericInspector.vue     # 通用模块编辑面板
│   └── CanvasModules/
│       ├── ThemeModule.vue          # 主题模块渲染
│       ├── ModelModule.vue          # 模特模块渲染
│       ├── LocationModule.vue       # 场地模块渲染
│       ├── ClothingModule.vue       # 服装模块渲染
│       ├── PropsModule.vue          # 道具模块渲染
│       ├── MakeupModule.vue         # 妆容模块渲染
│       ├── TimeModule.vue           # 时间模块渲染
│       └── GenericModule.vue        # 通用模块渲染
└── settings/
    ├── StorageSettings.vue          # 工作区存储设置
    ├── ThemeSettings.vue            # 主题切换设置
    ├── DataExchangeSettings.vue     # 数据导入/导出设置
    └── UpdateSettings.vue           # 更新管理设置
```

---

## 7. 新 AI 承接新任务的引导指南 (记忆恢复)

如果你是一个刚接入此项目的 AI 助手，请遵循以下步骤快速介入：

1. **阅读本文件**：全面掌握项目的工作区逻辑、SQLite 库结构和 IPC 桥梁。
2. **分析业务诉求**：
   - 如果用户要**修改策划案编辑器中的某项属性**：
     - 去前端 [planStore.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/store/planStore.js) 查看是否需要调整模块结构。
     - 在 [PlanEditor.vue](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/views/PlanEditor.vue) 沟通或开发对应的编辑卡片。
     - 检查对应的 Inspector 组件（如 [ThemeInspector.vue](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/components/PlanEditor/Inspectors/ThemeInspector.vue)）和 CanvasModule 组件。
   - 如果用户要**对某个资源库添加字段**：
     - 需要先去主进程 [DatabaseService.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/electron/services/DatabaseService.js) 的 `_createTables` 和 `VALID_COLUMNS` 中增加对应列的表结构兼容和校验名单。
     - 修改对应 Store（如 [modelStore.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/store/modelStore.js)）的 `extraFields` 配置。
     - 最后修改对应的 View 和 Form 组件。
   - 如果用户要**新增一个资源库类型**：
     - 参考 `clothing`/`props`/`makeup` 的实现模式，使用 `createLibraryStore` 工厂函数快速创建 Store。
     - 在 [DatabaseService.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/electron/services/DatabaseService.js) 中添加新表。
     - 在 [main.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/electron/main.js) 中调用 `registerLibraryCrud('newTable')`。
     - 在 [preload.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/electron/preload.js) 中暴露对应 API。
     - 在 [router/index.js](file:///d:/software_dev/New_Portraitplanner_desktop/APP/src/router/index.js) 中添加路由。
     - 创建对应的 View、View、Form 组件。
3. **保持高水准的开发标准**：
   - 所有的代码更改应当符合 **Tailwind CSS 3.x** 的排版系统。
   - 维持高质感的视觉风格（圆角、平滑阴影、高对比度的中性背景）。
   - **严格遵守 500行 代码限制**。若单文件（特别是视图文件）需要超过 500 行，请务必将其拆分为子组件（如拆分出 `ModuleCard.vue`, `SunTimePanel.vue` 等）并与用户沟通。

---

## 8. 更新记录

| 日期 | 版本 | 更新内容 | 更新人 |
| :--- | :--- | :--- | :--- |
| 2026-06-06 | v1.5.1 | 全面更新文档以匹配当前项目状态：新增 clothing/props/makeup 三个资源库（数据库表、路由、视图、Store、IPC 接口）；新增莫兰迪多主题系统文档；新增 ExportService、UpdateService 服务文档；新增 html2canvas 依赖；更新 IPC 方法一览表（新增批量删除、图片处理、主题、更新、窗口控制等方法）；更新组件目录结构；新增 createLibraryStore 工厂函数文档；补充 Settings 页面 Tab 结构说明；更新模块类型（clothing/props 使用 items 数组结构，新增 makeup 类型）；更新工作区 images 子目录结构 | AI Assistant |
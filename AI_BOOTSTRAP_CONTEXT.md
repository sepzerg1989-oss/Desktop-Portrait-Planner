# Portrait Planner (人像摄影策划助手) — AI 极速接入与架构白皮书

> **文档目的**: 此文档为 AI 助手（及开发人员）专属的极速上下文引导。每当新开聊天窗口时，请直接将本文件作为首要上下文输入，以便 AI 能在 **10秒内** 彻底理清项目全貌、规约和代码风格，从而精准、安全地进行功能迭代与重构。

---

## 1. 项目基本定位与设计规范

*   **定位**: 摄影师专用、完全本地化、纯离线运行的桌面端**人像摄影策划案/模特/场地**管理系统。
*   **底座**: `Electron 32` + `Vue 3.5` + `Vite 8` + `SQLite` (运行于 Electron 主进程)。
*   **设计美学**: 
    *   **窗口设计**: 彻底移除系统默认边框 (`frame: false`)，采用自定义标题栏 `TitleBar.vue`（包含 Mac/Win 风格的最小化、最大化、关闭按钮）。
    *   **配色风格**: 整体采用极具质感的**莫兰迪色系**主题（背景色 `#E2DED0`，辅以优雅的米色、暗绿、淡灰、暖木色）。
*   **🚨 核心开发死理（必须绝对遵守）**:
    1.  **单页面代码精简控制**: 每个页面的代码必须保持高可读性与模块化，**绝对不能超过 500 行**。复杂的表单、抽屉、特定模块属性编辑器，必须拆分为子组件（放入 `src/components/` 对应的子目录）。
    2.  **全部中文回复**: 无论 AI 或人机交互，所有的计划、回复及代码注释必须全部使用中文。
    3.  **Hash 路由模式**: 渲染进程必须使用 `createWebHashHistory`，禁止使用 HTML5 History 模式，否则 Electron 打包后无法定位本地资源。
    4.  **安全图片协议**: 本地图片**禁止使用 `file://`**，必须使用 `window.electronAPI.imageToURL(absolutePath)` 转换为自定义的 `local-image://` 协议 URL 渲染，否则会触发安全沙箱或 CSP 拦截。

---

## 2. 技术栈及关键版本明细

```json
{
  "dependencies": {
    "vue": "^3.5.32",              // 前端核心框架 (Composition API, SFC)
    "vue-router": "^5.0.6",        // 路由 (Hash 模式)
    "pinia": "^3.0.4",             // 状态管理 (大厅与编辑器核心数据联动)
    "better-sqlite3": "^12.9.0",   // 本地 SQLite 驱动 (Node 原生模块)
    "sharp": "^0.34.5",            // 图片极速静默压缩 (Node 原生模块)
    "electron-store": "^11.0.2",   // 桌面级本地配置持久化 (如工作区路径)
    "vuedraggable": "^4.1.0",      // 画布模块及左侧拖拽排序核心
    "html2canvas": "^1.4.1"        // 前端长图导出画布捕获
  },
  "devDependencies": {
    "electron": "^32.0.0",
    "vite": "^8.0.10",
    "vite-plugin-electron": "^0.29.1" // Electron 双进程 Vite 构建插件
  }
}
```

---

## 3. 项目目录树与核心职责

```
APP/
├── package.json              # 项目依赖及打包配置（包含 electron-builder 配置）
├── vite.config.js            # Vite 配置文件，配置了 Electron 主进程与预加载脚本双入口
├── tailwind.config.js        # 莫兰迪色系自定义主题与样式边界
│
├── electron/                 # ═════════ Electron 主进程 (Main Process / Node 环境) ═════════
│   ├── main.js               # 主进程唯一入口：窗口创建、自定义协议注册、IPC 处理器汇聚点
│   ├── preload.js            # 预加载脚本：利用 contextBridge 安全暴露 API 至渲染进程 window.electronAPI
│   └── services/             # 主进程核心服务层
│       ├── DatabaseService.js   # SQL 数据库单例封装：计划、模特、场地、模板的 CRUD
│       ├── ImageService.js      # 图片全自动静默压缩、删除、重命名物理文件夹（Sharp 并发控制 ≤5）
│       ├── WorkspaceService.js  # 工作区管理（引导用户选择外部存储目录，存放 DB 与图片库）
│       ├── ExportService.js     # 策划案数据包（ZIP）导入导出物理服务
│       └── UpdateService.js     # 自动更新与手动检测更新服务
│
└── src/                      # ═════════ 渲染进程 (Renderer Process / 浏览器环境) ══════════
    ├── main.js               # 渲染进程入口：初始化 Vue、Pinia 状态、Router 路由
    ├── App.vue               # 根组件：自定义标题栏 TitleBar.vue 统一置顶，控制整体路由切换
    ├── style.css             # 全局样式：Tailwind 注入与莫兰迪全局背景设置
    │
    ├── router/
    │   └── index.js          # Hash 路由注册表（5大路由：Dashboard, PlanEditor, Models, Locations, Settings）
    │
    ├── store/                # Pinia 数据中心
    │   ├── planStore.js      # ★ 核心状态：编辑器三栏实时联动、自动防抖保存、模板存取
    │   ├── modelStore.js     # 模特库 CRUD 状态及分页/搜索映射
    │   └── locationStore.js  # 场地库 CRUD 状态及分页/搜索映射
    │
    ├── composables/          # 逻辑高度抽离（让单文件保持在 500 行内的关键）
    │   ├── useImageUpload.js # 封装拖拽、粘贴、点击选择图片等统一上传压缩回调
    │   ├── useModal.js       # 全局确认/反馈弹窗的状态统一快捷控制
    │   └── usePasteTarget.js # 粘贴全局拦截逻辑
    │
    ├── views/                # 页面级组件（全控制在 500 行以内）
    │   ├── Dashboard.vue     # 大厅：策划案磁贴墙、模板新建入口、一键导入导出
    │   ├── PlanEditor.vue    # 编辑器主页：经典左-中-右三栏大布局容器
    │   ├── Models.vue        # 模特库：瀑布流卡片墙 + 详情/表单右侧滑出抽屉
    │   ├── Locations.vue     # 场地库：瀑布流卡片墙 + 详情/表单右侧滑出抽屉
    │   └── Settings.vue      # 设置页：切换工作区、检测更新、恢复出厂
    │
    └── components/           # UI 子组件（原子化高复用，保持 View 页面代码精简的核心）
        ├── TitleBar.vue      # 顶层无边框窗口控制器
        ├── TopHeader.vue     # 顶层优雅的导航菜单栏
        ├── ResourceDrawer.vue# 抽屉式弹框包裹容器（模特/场地详情与表单的统一滑出底盘）
        │
        ├── PlanEditor/       # 策划案编辑器专用组件集
        │   ├── ModuleManager.vue       # 【左栏】模块管理器：拖拽排序、增删模块
        │   ├── Canvas.vue              # 【中栏】核心画布预览：根据 type 动态渲染模块布局
        │   ├── PropertyInspector.vue   # 【右栏】属性控制台：分发具体属性编辑器组件
        │   │
        │   ├── Inspectors/   # 模块专属属性编辑器（每个 Inspector 独立，互不耦合）
        │   │   ├── ThemeInspector.vue     # 主题/风格编辑器
        │   │   ├── ModelInspector.vue     # 模特挑选与局部覆盖属性
        │   │   ├── LocationInspector.vue  # 场地挑选与局部覆盖属性
        │   │   ├── GenericInspector.vue   # 自定义服装/道具/文字段落属性
        │   │   └── ShootTimeInspector.vue # 拍摄时间/黄金日照时间计算面板
        │   │
        │   ├── ModelLibraryModal.vue     # 模特库快速导入悬浮弹窗
        │   └── LocationLibraryModal.vue  # 场地库快速导入悬浮弹窗
        │
        └── common/           # 全局高复用基础组件
            └── ImageUploader.vue # 优雅的图片上传接收器（支持裁剪框、拖拽、复制粘贴、多图上传）
```

---

## 4. Electron 双进程通信架构与 IPC 映射表

本项目安全性高，渲染进程完全禁用了 Node 访问权限，所有系统级（文件、数据库、网络）操作全部经由 `preload.js` 的 `Context Bridge` 网关暴露。

### 核心 IPC 通道分类清单

| 通道前缀 | 关联方法 (`window.electronAPI.xxx`) | 主进程服务处理 (`main.js`) | 业务功能描述 |
| :--- | :--- | :--- | :--- |
| **`workspace`** | `.workspace.getPath()` <br> `.workspace.selectAndSet()` | `WorkspaceService` | 获取当前本地工作区物理路径，弹出目录选择器更改工作区。 |
| **`db:plans`** | `.getPlans()` <br> `.createPlan(title)` <br> `.getPlanById(id)` <br> `.savePlan(id, data)` <br> `.deletePlan(id)` | `DatabaseService` | 策划案全套增删改查。数据独立保存在 plans 表的 `modules_json` 中。 |
| **`db:models`** | `.getModels()` <br> `.createModel(data)` <br> `.updateModel(id, data)` <br> `.deleteModel(id)` | `DatabaseService` | 模特档案库 CRUD，同时会在物理路径建立专属图片子目录。 |
| **`db:locations`** | `.getLocations()` <br> `.createLocation(data)` <br> `.updateLocation(id, data)` <br> `.deleteLocation(id)` | `DatabaseService` | 场地档案库 CRUD，同样配合物理路径管理图片目录。 |
| **`db:templates`**| `.getTemplates()` <br> `.saveTemplate(name, structure)` <br> `.deleteTemplate(id)` | `DatabaseService` | 模板库系统。存储模块结构链，不包含模特或场地具体照片。 |
| **`image`** | `.compressImage(src, cat)` <br> `.saveImageFromBuffer(buf, cat)` <br> `.deleteImageFile(path)` <br> `.selectImageFiles()` | `ImageService` | **静默图片处理核心**：接收用户图片路径或粘贴缓存，调用 sharp 压缩，存储至工作区。 |
| **`system`** | `.exportImage(dataUrl, name)` <br> `.exportData(ids)` <br> `.importData(filePath)` | `ExportService` | 策划案长图 JPG 导出；跨工作区导入导出包含所有图片的 ZIP 策划包。 |
| **`window`** | `.window.minimize()` <br> `.window.toggleMaximize()` <br> `.window.close()` | `ipcMain.on` (直接操作主窗口) | 无边框窗口在 Windows/macOS 下的拖动及控制响应。 |

---

## 5. 核心数据模型与数据库 ER 结构

所有数据均落地在用户工作区目录下的 `database.sqlite` 数据库中。

```
                    ┌─────────────────────────┐
                    │         plans           │
                    ├─────────────────────────┤
                    │ PK  id          INTEGER │
                    │     title       TEXT    │
                    │     cover_path  TEXT    │
                    │     modules_json TEXT   │ ◄── 保存该策划案拥有的模块 JSON 数组
                    │     created_at  TEXT    │
                    │     updated_at  TEXT    │
                    └─────────────────────────┘
                                 ▲
                                 │
                                 │ 松散引用
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                 │
┌─────────────────────────┐                       ┌─────────────────────────┐
│        models           │                       │       locations         │
├─────────────────────────┤                       ├─────────────────────────┤
│ PK  id          INTEGER │                       │ PK  id          INTEGER │
│     name        TEXT    │                       │     name        TEXT    │
│     tags        TEXT    │ (JSON 格式标签数组)     │     address     TEXT    │
│     avatar_path TEXT    │                       │     price       TEXT    │
│     model_card_path TEXT│                       │     tags        TEXT    │ (JSON 格式标签数组)
│     social      TEXT    │                       │     cover_path  TEXT    │
│     region      TEXT    │                       │     images_json TEXT    │ (JSON 格式轮播图数组)
│     price       TEXT    │                       │     created_at  TEXT    │
│     images_json TEXT    │ (JSON 格式作品集数组)    └─────────────────────────┘
│     created_at  TEXT    │
└─────────────────────────┘
```

### 5.1 `plans.modules_json` 中的核心模块模型结构
当策划案开启三栏联动时，所有的变动都由前端 Pinia 的 `planStore.js` 管理。其核心是由一个个独立 Module 构成的数组。Module 结构如下：
```javascript
{
  id: "m_1715694291880", // 毫秒戳 ID 标识
  type: "model",         // 模块类型：theme | model | location | reference | shoot_time | clothing | props | custom
  title: "拍摄模特",      // 模块可自定义修改的标题
  data: {                // 数据负载 (完全根据 type 差异化设计)
    name: "模特A",
    avatar: "local-image://C:/workspace/images/models/1/avatar.jpg",
    tags: ["日系", "复古"],
    images: [
      { url: "local-image://...", path: "C:/...", ratio: 1.5 }
    ]
  }
}
```

---

## 6. 三栏联动数据流与 2秒防抖自动保存

编辑器 `PlanEditor.vue` 是整个项目最具技术含量和高交互度的页面，采用 Pinia 作为其唯一数据真理源。

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                            Pinia: planStore                            │
  └──────────────────┬───────────────────────────────────▲─────────────────┘
                     │                                   │
      根据 modules   │                                   │ 修改 activeModule.data
      动态渲染渲染    │                                   │ 即时同步 (Reactive)
                     ▼                                   │
┌───────────────────────────────────────┐     ┌──────────┴────────────────────────┐
│             【中栏 Canvas】            │     │       【右栏 PropertyInspector】   │
│ 按模块顺序瀑布流排布，反映当前策划案实 │     │ 监听 activeModuleId，自动载入对  │
│ 时样貌。双击可激活并定位模块。        │     │ 应的 Inspectors (如 ModelInspector)│
└───────────────────────────────────────┘     └───────────────────────────────────┘
                     ▲                                   │
                     │ 拖拽重排 / 增删                    │
                     │                                   ▼
┌────────────────────┴──────────────────┐     ┌───────────────────────────────────┐
│          【左栏 ModuleManager】       │     │          2秒自动防抖保存机制        │
│ 提供 vuedraggable 模块大纲树，支持随  │     │ 渲染进程检测到 modules 发生改变后 │
│ 时拖曳、新建模块、或删除无用模块。    │     │ 启动 2s 防抖，调用 ipc: db:plans  │
└───────────────────────────────────────┘     └───────────────────────────────────┘
```

---

## 7. 静默图片压缩与工作区管理规范

*   **图片大小高限制**: 所有的图片在导入系统时，都会通过 `ImageService` 调用 native `sharp` 库进行极致静默压缩。
    *   **限制目标**: 每张图片在输出时，体积强制压缩至 **≤ 300KB**，格式统一转为 `.jpg`，极大节约本地磁盘，保障前端百万级像素渲染不卡顿。
*   **物理存储分类**:
    工作区指定后，主进程会在工作区中自动建立 `images/` 子文件夹：
    *   `images/plans/{planId}/` — 策划案引用的零散参考图、服装图、道具图
    *   `images/models/{modelId}/` — 模特库档案下的个人头像、模卡及个人作品集
    *   `images/locations/{locationId}/` — 场地库档案下的封面及场地实景图
*   **物理同步清理**:
    当在数据库中执行删除模特（`db:models:delete`）、删除场地（`db:locations:delete`）、删除策划（`db:plans:delete`）时，主进程会同步调用 `ImageService` **物理销毁**该实体对应的子文件夹，保持工作区绝对整洁，防止产生垃圾文件。

---

## 8. AI 快速开发建议（避坑与快速切入）

当您被要求在这个项目中编写新功能或重构时，请遵循以下开发步骤：

1.  **如果要增加新字段**:
    *   先修改 `DatabaseService.js` 中对应的表结构创建语句。
    *   更新 `DatabaseService.js` 头部的 `VALID_COLUMNS` 合法字段映射，否则 SQLite 插入时会被过滤。
2.  **如果要增加新的模块类型 (例如: 增加"航拍机位"模块)**:
    *   在 `planStore.js` 的 `addModule()` 中为该 type 定义默认 data 数据结构。
    *   在 `src/components/PlanEditor/Inspectors/` 下新建 `DroneInspector.vue` 作为其专属属性编辑器（控制在 300 行以内，引入 `ImageUploader.vue` 用于图示）。
    *   在 `PropertyInspector.vue` 中导入并注册该 Inspector，并根据 `activeModule.type === 'drone'` 进行挂载。
    *   在 `Canvas.vue` 中为该 `module.type === 'drone'` 编写独立的画布渲染排版布局。
    *   在 `ModuleManager.vue` 的新建列表内加入该模块项。
3.  **如果发现代码超出 500 行**:
    *   绝对禁止继续往页面组件（如 `Models.vue`, `PlanEditor.vue`）里塞代码。
    *   将复杂表单（如 `ModelForm.vue`）、详情预览（如 `ModelView.vue`）全部剥离到独立子组件中，使用 `v-model` 或事件进行双向绑定。
    *   把通用的上传、弹窗配置扔进 `src/composables`。

---

> **结语**: AI 助手，请牢记你的设计准则，确保软件在进行任何改动时都保持**轻量化、模块化、无多余依赖**。现在，你可以完全自信地开始你的工作了！

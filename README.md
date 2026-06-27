# Portrait Planner ｜ 人像摄影策划助手

[![Electron](https://img.shields.io/badge/Electron-v32.0.0-blue.svg?style=flat-square)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-v3.5.x-green.svg?style=flat-square)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-v8.x-orange.svg?style=flat-square)](https://vite.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-blueviolet.svg?style=flat-square)](https://github.com/WiseLibs/better-sqlite3)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**Portrait Planner** 是一款专为摄影师、策展人、导演及独立创作者设计的高质感**纯本地离线人像拍摄策划案管理与排版工具**。

应用基于独特的“工作区（Workspace）”概念实现数据与图片文件的本地闭环管理，帮助创作者搭建专属的模特、场地、服装、道具及妆面素材库，并像搭积木一样拼装出结构化、模块化的拍摄策划案，支持自动计算黄金日照时刻，以及一键导出极具质感的策划案长图与备份数据包。

> [!NOTE]
> 本软件是一款**纯本地应用**。所有敏感的模特档案、高清场地样片和策划隐私数据全部保存在您的本地硬盘中，绝不上传至任何云端，保障 100% 的隐私与数据可控权。

---

## 🎨 界面视觉预览
<img width="1280" height="680" alt="image" src="https://github.com/user-attachments/assets/66268149-73e0-48e7-88ac-53ab07af0b40" />

应用拥有一套极具艺术感的**无边框（Frameless）高奢莫兰迪（Morandi）多主题界面设计**，支持 6 套精心调配的莫兰迪色系主题一键切换：

| 暖调白棚 (Daylight Studio) | 电影暗房 (Cinematic Darkroom) | 现代画廊 (Plaster Gallery) |
| :---: | :---: | :---: |
| 灰绿鼠尾草 (The Botanist) | 枯玫瑰 (The Romantic) | 雾霾蓝 (The Melancholy) |

---

## ✨ 核心特性

### 📁 1. 本地优先与工作区概念 (Workspace)
* 数据与素材完全跟随工作区目录移动，支持在多台设备或移动硬盘间即插即用、无缝迁移。
* 初始化工作区时会自动创建 SQLite 本地数据库及结构化图片归类存储目录。

### 👥 2. 五大独立摄影资源库
* **模特库 (Models)**：全面管理模特档案，包含联系方式、地区、合作报价、模卡文件，并支持上传个人样片图集。
<img width="1280" height="676" alt="image" src="https://github.com/user-attachments/assets/c34a746d-73ac-4247-bdc3-c6f47b0a48bd" />

* **场地库 (Locations)**：整理机位与拍摄点位，管理档期价格、详细地址，以及上传场地环境图集。
<img width="1278" height="682" alt="image" src="https://github.com/user-attachments/assets/49d29bb7-36d3-4637-9e66-7f23d4d73832" />

* **服装搭配库 (Clothing)**：记录服装风格、购买链接及参考图，方便随时在策划中绑定。
<img width="1280" height="676" alt="image" src="https://github.com/user-attachments/assets/153ccfd7-0e56-4ae5-9b5a-4b873bbceccd" />

* **拍摄道具库 (Props)**：管理拥有的拍摄道具、参考样式与购买地址。
<img width="1280" height="681" alt="image" src="https://github.com/user-attachments/assets/cca951c5-f23f-473a-8bb5-327e0f18a2b9" />

* **妆面造型库 (Makeup)**：积累妆容灵感、发型造型与参考图集。
<img width="1280" height="679" alt="image" src="https://github.com/user-attachments/assets/23606233-5db6-45d4-8ae2-489e99cad2fe" />

### 📝 3. 积木式模块化策划编辑器 (Drag-and-Drop Canvas)
* 策划案支持一键调用预设模板，或在画布中自由拼装模块。
* 模块支持可视化**拖拽排序**与独立排版。
* **支持 9 种预设模块类型**：拍摄主题 (`theme`)、模特绑定 (`model`)、场地绑定 (`location`)、参考样片 (`reference`)、服装清单 (`clothing`)、道具清单 (`props`)、妆面造型 (`makeup`)、日照时间 (`shoot_time`)、自定义富文本 (`custom`)。

### ☀️ 4. 智能户外日照时刻计算 (Golden Hour Calculator)
* 拍摄日期模块集成了天文学算法 `suncalc`。
* 仅需选择拍摄城市或输入对应经纬度，即可自动计算并可视化渲染拍摄当天的**黄金时间段（Golden Hour）**、**蓝调时间段（Blue Hour）**、日出日落及晨昏蒙影时刻，助您精准掌控外景自然光。
<img width="1280" height="681" alt="image" src="https://github.com/user-attachments/assets/408edb27-ba60-411a-aad2-99ac6920c8f7" />


### 🖼️ 5. 高清长图导出与备份数据包 (Export System)
* **长图导出**：一键将策划案的画布内容排版并渲染导出为一张极具质感的高清长图，方便发送至微信、小红书与模特或客户沟通。
* **数据包导入/导出**：将策划案及关联的所有模特、场地、服装、道具等高清物理图片，一键打包为 `.portrait` 压缩数据包，实现轻松共享或全量备份。
<img width="1280" height="680" alt="image" src="https://github.com/user-attachments/assets/ac3765d5-452c-4b3d-acf8-98925cba7ddd" />

---

## 🛠️ 核心技术栈

* **桌面平台**：[Electron 32.0](https://www.electronjs.org/) 提供无边框本地桌面环境。
* **前端框架**：[Vue 3](https://vuejs.org/) (Composition API) + [Vue Router](https://router.vuejs.org/) + [Pinia](https://pinia.vuejs.org/)。
* **本地数据库**：[better-sqlite3](https://github.com/WiseLibs/better-sqlite3) 提供高性能本地 SQLite3 读写。
* **样式方案**：[Tailwind CSS](https://tailwindcss.com/) + [PostCSS](https://postcss.org/)。
* **图片处理**：[sharp](https://github.com/lovell/sharp) 主进程压缩优化，自动限制图片 ≤300KB，极致缩减空间占用。
* **算法工具**：[suncalc](https://github.com/mourner/suncalc) 太阳轨迹及黄金时刻计算。

---

## 📥 快速开始与开发部署

### 前提条件
您的开发机上需安装 [Node.js](https://nodejs.org/) (建议 `v18` 或以上) 和 `npm`。

### 1. 克隆项目
```bash
git clone https://github.com/sepzerg1989-oss/Desktop-Portrait-Planner.git
cd Desktop-Portrait-Planner
```

### 2. 安装依赖
由于包含 `better-sqlite3` 与 `sharp` 原生 C++ 依赖模块，安装过程中会自动触发编译，请确保您的系统有基础的构建环境（Windows 下会自动通过 node-gyp 处理）：
```bash
npm install
```

### 3. 开发环境运行
运行 Vite 开发服务器与 Electron 窗口：
```bash
npm run dev
```

### 4. 生产环境打包
编译并打包出 NSIS 安装程序（在 Windows 下生成免签名且支持 UAC 自动提权升级的安装程序）：
```bash
npm run build
```
打包输出物将存放在 `dist-release/` 目录下。

---

## 📂 本地工作区目录结构

当您首次打开软件并指定工作区目录时，Portrait Planner 会自动为您生成以下目录以实现数据隔离：

```text
<您的工作区根目录>/
├── database.sqlite            # 本地 SQLite 3 数据库文件（存储所有文本数据和关联索引）
├── exports/                   # 默认的数据打包导出目录（生成的 .portrait 文件）
└── images/                    # 图片素材物理隔离存储目录
    ├── models/                # 模特图片文件夹 (models/${model_name}_${id}/)
    ├── locations/             # 场地图片文件夹 (locations/${location_name}_${id}/)
    ├── clothing/              # 服装图片文件夹 (clothing/${clothing_name}_${id}/)
    ├── props/                 # 道具图片文件夹 (props/${prop_name}_${id}/)
    ├── makeup/                # 妆容图片文件夹 (makeup/${makeup_name}_${id}/)
    └── plans/                 # 策划案图片文件夹 (plans/${plan_title}_${id}/)
```

---

## 🤝 贡献指南

1. **模块化与轻量化**：本项目采用高度解耦的模块化开发，前端的所有核心库管理（Pinia Store）均由通用工厂函数派生。
2. **AI 协同开发**：本项目主要依托 Google DeepMind 的 **Antigravity** 智能编码 Agent 及其底层的 **Gemini** 系列模型协同开发与重构完成，所有代码均由AI编写。
3. **打包验证**：提交 PR 前请确保本地运行 `npm run build` 测试打包能够完全通过，且无 Native C++ 模块的编译与依赖冲突。

---

## 📄 开源许可证

本项目基于 **MIT License** 开源许可证，您可以自由地使用、修改和分发本项目。详情请参阅 [LICENSE](LICENSE) 文件。

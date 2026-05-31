# Portrait Planner — 高奢画廊与独立画册风 UI 开发设计规范指南 (Design Guidelines)

本指南旨在总结本项目在 UI/UX 视觉体系高奢化改造中所沉淀的全部核心设计隐喻、开发标准与代码规约。所有后续接手的 AI 开发者**必须严格遵守**本指南，以确保新功能或模块在视觉调性、操作交互、多主题自适应上与现有高奢艺术风格保持高度一致。

---

## 1. 核心设计理念与视觉隐喻 (Art Direction)

我们彻底屏弃了传统 SaaS 效率工具中死板的“格子化、全包围边框、大面积刺眼对比色”的粗糙观感，为应用确立了以下三个层面的视觉意象：
* **独立艺术画廊 (The Art Gallery)**：空间保持空灵、通透、留白，去除一切无意义的修饰线，让摄影作品与精致的内容文字在柔和的纸张背景上自然呼吸。
* **独立摄影工作室 (The Studio & Darkroom)**：追求如同精密机械硬件般的交互触感。按钮如快门拨盘，输入框如纸面手写辅助线，编辑过程如同在暗房中装裱照片。
* **精装实体画册 (The Fine Art Book)**：强调材质的物理叠放层次（底板、卡纸、相纸），通过极克制的多层微弱投影产生自然的立体凹凸感，而不是通过黑白线条分割。

---

## 2. 莫兰迪全局色彩系统与多主题防隐形规约

### 2.1 语义化主题色彩映射
**绝对禁止使用任何硬编码十六进制色值 (如 `#FFFFFF`, `#121212`)。** 全局共有 6 套精选主题（暖调白棚、电影暗房、现代画廊、灰绿鼠尾草、枯玫瑰、雾霾蓝）。必须锁死使用 `style.css` 及 `tailwind.config.js` 映射的主题语义化类名：
* **`bg-morandi-canvas`**：全局底层壁面、侧栏底色、大厅底板（较暗/较沉的底色）。
* **`bg-morandi-paper`**：实体相纸、抽屉面板、中央编辑器画板（最洁净、最核心的材质呈现色）。
* **`text-morandi-text`**：所有标题与核心文本（在深色主题下会自适应转为浅色）。
* **`text-morandi-muted`**：极精细标签、元信息、次要辅助说明。
* **`border-morandi-border`**：极细的主题分隔线（自适应，浅色主题下为淡墨，深色下为淡白）。
* **`bg-morandi-red` / `bg-morandi-green`**：极为克制的删除警告与成功选中提示色，严禁大面积平铺。

### 2.2 防文字隐形硬防护线 (The Contrast Shield)
* **严禁“硬编码背景 + 语义化字色”混合**：在任何弹窗、属性抽屉、卡片内部，**绝对禁止**使用硬编码的浅色背景（如 `bg-white`）或深色背景。因为在深色模式下，语义化文字（如 `text-morandi-text`）会被翻转为淡白色，若遇上写死的 `bg-white` 就会导致“白字配白底”直接隐形。
* **自适应安全公式**：
  * **容器背景**：必须使用 `bg-morandi-paper`。
  * **容器文字**：必须使用 `text-morandi-text` 或 `text-morandi-muted`。
  * **容器线框**：必须使用 `border-morandi-border` 或利用透明度通道进行微弱叠加，如 `border-morandi-text/10`。
  * **Hover 动态背垫**：必须使用 `hover:bg-morandi-text/5`，切勿使用 `hover:bg-black/5`（否则深色主题下会变成黑中黑）。

---

## 3. 核心交互组件开发标准 (Component Standards)

### 3.1 主操作快门按钮 (The Shutter Button)
* **设计意象**：高级旁轴相机的金属快门按键。
* **规范**：所有主新建、主提交、完成确认等核心动作，**必须**将原本微圆角长方形彻底胶囊化：
  ```html
  <button class="rounded-full px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest transition-all">
    CREATE NEW
  </button>
  ```
* **排版**：强制采用**极小字号 (10px - 11px)、全部大写 (uppercase)、极宽字距 (tracking-widest)**，产生类似打字机铅字印刷的高奢机械质感。
* **“一长一圆”几何错落排版**：大厅“新建策划”等行为，左侧主胶囊动作按钮，与右侧完美的 **正圆形拨按键 (`w-8 h-8 rounded-full`)** 错落搭配（如模板下拉、过滤设置等），呈现精密的硬件美学。
  * *注：下拉菜单定位时，应避免父容器带有 `overflow-hidden`，并采用绝对定位 `z-50` 确保不会被卡片截断。*

### 3.2 极简下划线输入与选择框 (The Ghost Input)
* **设计意象**：卡纸上手工绘制的书写辅助基准线。
* **规范**：所有输入框 (`input`、`textarea`) 及下拉筛选框 (`select`)，**彻底铲除全包围的灰色盒子与填充色**：
  ```html
  <input class="w-full bg-transparent border-b border-morandi-border focus:border-morandi-text text-xs outline-none transition-colors rounded-none px-1 py-2" />
  ```
* **细节**：背景必须保持透明 `bg-transparent`，仅留底边极细线。聚焦时**绝对禁止**闪烁系统蓝色的 Focus 边框（去除 `focus:ring`），而是让底边线安静变深。

### 3.3 裸排打字机标签 (The Typewriter Tags)
* **设计意象**：老式打字机打出的纸条条目。
* **规范**：卡片或面板下方的分类标签，**绝对禁止**套用 SaaS 工具常见的灰色实底圆角小盒子底色：
  * 去除任何背景、任何 padding 填充。
  * 纯文本裸排，字号锁定 `text-[10px]`，颜色使用 `text-morandi-muted`。
  * 多个标签并行时，使用优雅的圆点 `·` 或短横线 `-` 进行细小分隔。

### 3.4 艺术装裱画布与激活红线 (The Matboard Canvas)
* **设计意象**：美术馆里厚实考究的艺术照片装裱卡纸。
* **规范**：编辑器中的图片或内容模块，在被点击选中激活时：
  * **彻底废弃**突兀蓝色 Focus ring（去除 `ring-2 ring-morandi-blue`）。
  * 模块本身必须保持直角（`rounded-none` 或微弱 `rounded-[2px]`），应用双层物理软阴影。
  * **激活指向**：仅在被选中模块的 **最左侧边缘** 附加一根极细的红线：
    ```html
    :class="[isSelected ? 'border-l-2 border-morandi-red' : 'border-l-2 border-transparent']"
    ```
    以极其克制、安静的暗房语言表达聚焦，使整体画面毫不杂乱。

---

## 4. 策展级批量管理交互标准 (Curator Management)

当处于“批量管理”状态时，页面应褪去传统管理后台的厚重感，向优雅高级的画廊陈列看齐。

### 4.1 深色底部悬浮胶囊 (The Floating Capsule)
* **规范**：彻底摒弃传统横跨底部、死板苍白的巨幅白色矩形操作板。重构为漂浮在视口最底部中央的“墨色高奢胶囊”：
  ```html
  <div class="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-3 bg-morandi-text text-morandi-paper rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.15)] z-50">
    <span class="text-xs tracking-wider">已选择 X 项</span>
    <div class="w-[1px] h-4 bg-white/20"></div> <!-- 极细竖半透明分割线 -->
    <!-- 右侧为操作动作 -->
  </div>
  ```
* **退出功能合一**：一旦进入批量管理模式，右上角触发该模式的普通“批量管理”按钮必须**自动隐藏**。退出批量模式的入口应**全部收归**到底部悬浮胶囊中的极简“退出”文字按钮上，彻底消除视觉冗余。

### 4.2 卡片柔化选中态 (Soft Selection)
* **规范**：为了让摄影作品不受视觉侵染，选中卡片时**绝对禁止**套用生硬刺眼的红色全包围粗外框。
* **选中状态表达**：卡片在被勾选时，仅通过微小的轻盈浮起高度与投影变深来优雅表达：
  ```html
  :class="[isItemSelected ? 'shadow-xl -translate-y-1' : 'shadow-sm']"
  ```

### 4.3 硬件感圆形复选框 (Circular Checklist Button)
* **规范**：抛弃原生或常规的方形红底 checkbox，卡片左上角的复选框重塑为精致的漂浮圆形微型钮：
  * **未选中**：`w-5 h-5 rounded-full border border-black/10 bg-morandi-paper`，极细浅色圆边，完全隐身于卡片纸张材质中。
  * **选中**：`bg-morandi-text scale-105 shadow-md`，演化为深墨色正圆盘，内部透出一只亮米色的精细 `✓` 对勾，展现精密相机的五金质感。

---

## 5. 常见控制面板与属性 Inspector 改造指南

针对属性编辑面板（如时间面板、表单选项等），需要特别提炼以下几点防雷规约：

### 5.1 原生下拉 `<select>` 弹层防隐形
在 Electron/Chromium 平台中，若 `<select>` 使用了 `text-morandi-text`（在深色暗房主题下其颜色值是淡白 `#E5E0D8`），它会被 option 元素直接继承。若不强制声明，在系统的白底下拉框中，浅白字会完全看不见。
* **全局补丁**：必须确保全局 `style.css` 中有如下属性，使原生下拉浮层自适应于当前莫兰迪背景与墨色：
  ```css
  select option {
    background-color: var(--color-paper);
    color: var(--color-ink);
  }
  ```

### 5.2 标签下拉筛选面板 (Popover)
过滤栏中标签浮层（如按常用标签筛选的展开框）：
* **背景与边框**：外层容器必须使用 `bg-morandi-paper`，并且边框使用自适应的 `border-morandi-border`（替代死板的 `border-black/5`）。
* **幽灵按钮**：未激活的标签按钮必须为 `bg-transparent border-morandi-text/10 text-morandi-muted`，Hover 态必须为 `hover:bg-morandi-text/5 hover:text-morandi-text`，避免在深色主题下发生悬浮黑块和边线隐形。

### 5.3 彻底干掉原生 Checkbox
* 属性面板中的 Checkbox 强制用自定义小方块替换。
* 未选中：极细边框的小方块 `w-4 h-4 border border-morandi-text/20 rounded-[2px] bg-transparent`。
* 选中：微微加深底色，内部用极细的白色 SVG 或符号呈现 `✓`。
* 文字配合：文字缩小为 `text-xs`，颜色使用 `text-morandi-muted`，选中高亮为 `text-morandi-text`。

### 5.4 紧凑的时间输入区 (Time Range Picker)
* 彻底删除多余的时钟 SVG 图标。
* 将开始和结束时间输入框合并。**彻底去除**它们各自的背景色与全包围线框，仅保留底部一条极细的统一贯穿线 `border-b border-morandi-border/30`。
* 输入框固定微小宽度并居中对齐 `w-12 text-center`，两者通过极简文字“至”字连结，展现像实体表格一般的干练排版。

---

## 6. AI 开发严格护栏 (STRICT GUARDRAILS)

当后续 AI 在为该软件开发新模块或修改老组件时，必须谨记以下底线护栏，违者将导致项目重塑失败：

1. **业务逻辑与状态“零触碰”**：绝对禁止修改 `<script setup>` 中与 Pinia 状态管理、生命周期、过滤搜索等相关的核心算法和响应式变量，只可增删用于控制 UI 视觉表现的非侵入式临时变量（如 `isCollapsed` 展开收起状态）。
2. **Vue 指令完整性**：在优化 `<template>` 时，必须 100% 完整保留原有的一切指令（如 `v-if`、`v-for`、`v-model`、各种绑定的 `@click` 事件等）。
3. **保持模块化与精简 (KISS)**：所有组件应高度聚焦，在实现高奢界面的同时极力压缩代码量，**确保单个组件文件代码一般不超过 500 行**。若因负责功能必须突破该限制，必须以模块化拆分（子组件化）为首要设计手段。
4. **拒绝任何占位符**：对于需要配图说明的 UI 细节，严禁使用粗糙无趣的临时灰色占位字块，优先采用具有艺术装裱感的极微弱内投影占位盒子（凹陷感装裱框），体现一流的工匠精神。

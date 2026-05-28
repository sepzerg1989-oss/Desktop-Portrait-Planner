import { dialog, BrowserWindow, app } from 'electron'
import fs from 'fs'
import path from 'path'
import DatabaseService from './DatabaseService.js'
import WorkspaceService from './WorkspaceService.js'

/**
 * 数据导出与导入服务
 */
class ExportService {
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
        timestamp: new Date().toISOString(),
        data: { plans: [], models: [], locations: [] },
        images: {} // 结构 { absolutePath: base64 }
      }

      // 提取图片的辅助方法
      const addImage = (absPath) => {
        if (!absPath || exportData.images[absPath]) return;
        try {
          if (fs.existsSync(absPath)) {
            exportData.images[absPath] = fs.readFileSync(absPath, 'base64');
          }
        } catch (err) {
          console.warn('[ExportService] 读取图片失败:', absPath, err);
        }
      }

      // 导出策划案
      if (ids.planIds && Array.isArray(ids.planIds)) {
        for (const id of ids.planIds) {
          const plan = DatabaseService.getById('plans', id);
          if (plan) {
            exportData.data.plans.push(plan);
            if (plan.cover_path) addImage(plan.cover_path);
            const modules = JSON.parse(plan.modules_json || '[]');
            modules.forEach(m => {
              if (m.data?.images) m.data.images.forEach(img => addImage(img.path));
              if (m.data?.avatar) addImage(m.data.avatar);
              if (m.data?.modelCard) addImage(m.data.modelCard);
            });
          }
        }
      }

      // 导出模特
      if (ids.modelIds && Array.isArray(ids.modelIds)) {
        for (const id of ids.modelIds) {
          const model = DatabaseService.getById('models', id);
          if (model) {
            exportData.data.models.push(model);
            if (model.avatar_path) addImage(model.avatar_path);
            if (model.model_card_path) addImage(model.model_card_path);
            const images = JSON.parse(model.images_json || '[]');
            images.forEach(img => addImage(img.path));
          }
        }
      }

      // 导出场地
      if (ids.locationIds && Array.isArray(ids.locationIds)) {
        for (const id of ids.locationIds) {
          const loc = DatabaseService.getById('locations', id);
          if (loc) {
            exportData.data.locations.push(loc);
            if (loc.cover_path) addImage(loc.cover_path);
            const images = JSON.parse(loc.images_json || '[]');
            images.forEach(img => addImage(img.path));
          }
        }
      }

      const result = await dialog.showSaveDialog(win, {
        title: '导出数据',
        defaultPath: 'PortraitPlanner_Data.ppexport',
        filters: [{ name: 'PortraitPlanner Export File', extensions: ['ppexport'] }]
      });

      if (result.canceled || !result.filePath) return { success: false, error: 'User canceled' };

      fs.writeFileSync(result.filePath, JSON.stringify(exportData));
      return { success: true, filePath: result.filePath };
    } catch (e) {
      console.error('[ExportService] 导出失败:', e);
      return { success: false, error: e.message };
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
          title: '导入数据',
          properties: ['openFile'],
          filters: [{ name: 'PortraitPlanner Export File', extensions: ['ppexport'] }]
        });

        if (result.canceled || result.filePaths.length === 0) return { success: false, error: 'User canceled' };
        finalFilePath = result.filePaths[0];
      }

      const fileContent = fs.readFileSync(finalFilePath, 'utf-8');
      const exportData = JSON.parse(fileContent);

      if (exportData.type !== 'portraitplanner-export') {
        throw new Error('无效的导出文件格式');
      }

      // 准备图片目标目录
      const importedImagesDir = path.join(WorkspaceService.getPath(), 'images', 'imported');
      if (!fs.existsSync(importedImagesDir)) {
        fs.mkdirSync(importedImagesDir, { recursive: true });
      }

      const pathMapping = {}; // 旧绝对路径 -> 新绝对路径
      
      // 1. 还原所有 Base64 图片为本地物理文件
      if (exportData.images) {
        for (const [oldPath, base64Str] of Object.entries(exportData.images)) {
          const buffer = Buffer.from(base64Str, 'base64');
          // 生成随机防冲突文件名
          const hash = Math.random().toString(36).substring(2, 10);
          const ext = path.extname(oldPath) || '.jpg';
          const fileName = `${Date.now()}_${hash}${ext}`;
          const targetPath = path.join(importedImagesDir, fileName);
          fs.writeFileSync(targetPath, buffer);
          pathMapping[oldPath] = targetPath;
        }
      }

      // 替换路径的辅助方法
      const replacePath = (oldPath) => {
        if (!oldPath) return oldPath;
        return pathMapping[oldPath] || oldPath; // 如果没找到映射，可能原图片就没有打包，保留原路径或清理
      };

      // 2. 插入模特记录
      if (exportData.data.models) {
        for (const model of exportData.data.models) {
          const newModel = {};
          DatabaseService.constructor.VALID_COLUMNS.models.forEach(key => {
            if (key !== 'id' && model[key] !== undefined) newModel[key] = model[key];
          });
          
          newModel.avatar_path = replacePath(newModel.avatar_path);
          newModel.model_card_path = replacePath(newModel.model_card_path);
          
          const images = JSON.parse(newModel.images_json || '[]');
          images.forEach(img => img.path = replacePath(img.path));
          newModel.images_json = JSON.stringify(images);

          DatabaseService.insert('models', newModel);
        }
      }

      // 3. 插入场地记录
      if (exportData.data.locations) {
        for (const loc of exportData.data.locations) {
          const newLoc = {};
          DatabaseService.constructor.VALID_COLUMNS.locations.forEach(key => {
            if (key !== 'id' && loc[key] !== undefined) newLoc[key] = loc[key];
          });
          
          newLoc.cover_path = replacePath(newLoc.cover_path);
          
          const images = JSON.parse(newLoc.images_json || '[]');
          images.forEach(img => img.path = replacePath(img.path));
          newLoc.images_json = JSON.stringify(images);

          DatabaseService.insert('locations', newLoc);
        }
      }

      // 4. 插入策划案记录
      if (exportData.data.plans) {
        for (const plan of exportData.data.plans) {
          const newPlan = {};
          DatabaseService.constructor.VALID_COLUMNS.plans.forEach(key => {
            if (key !== 'id' && plan[key] !== undefined) newPlan[key] = plan[key];
          });
          
          newPlan.cover_path = replacePath(newPlan.cover_path);
          
          const modules = JSON.parse(newPlan.modules_json || '[]');
          modules.forEach(m => {
            if (m.data?.images) m.data.images.forEach(img => img.path = replacePath(img.path));
            if (m.data?.avatar) m.data.avatar = replacePath(m.data.avatar);
            if (m.data?.modelCard) m.data.modelCard = replacePath(m.data.modelCard);
          });
          newPlan.modules_json = JSON.stringify(modules);

          DatabaseService.insert('plans', newPlan);
        }
      }

      return { success: true };
    } catch (e) {
      console.error('[ExportService] 导入失败:', e);
      return { success: false, error: e.message };
    }
  }
}

export default new ExportService();

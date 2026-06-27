import { dialog, BrowserWindow, app } from 'electron'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import DatabaseService from './DatabaseService.js'
import WorkspaceService from './WorkspaceService.js'
import {
  getImagePath,
  validateImportPackage
} from './DataSafety.js'

// 清理文件名中的非法字符，用于生成安全的文件夹名称
const sanitize = (name) => (name || '').replace(/[\\\/:*?"<>|]/g, '_').trim() || 'unnamed';

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
        data: { plans: [], models: [], locations: [], clothing: [], props: [], makeup: [] },
        images: {} // 结构 { absolutePath: base64 }
      }

      // 提取图片的辅助方法
      const addImage = (imageValue) => {
        const absPath = getImagePath(imageValue);
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
              if (m.data?.images) m.data.images.forEach(img => addImage(img));
              if (m.data?.avatar) addImage(m.data.avatar);
              if (m.data?.avatarPath) addImage(m.data.avatarPath);
              if (m.data?.modelCard) addImage(m.data.modelCard);
              if (m.data?.modelCardPath) addImage(m.data.modelCardPath);
              if (m.data?.items) {
                m.data.items.forEach(item => {
                  if (item.images) {
                    item.images.forEach(img => addImage(img));
                  }
                });
              }
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
            images.forEach(img => addImage(img));
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
            images.forEach(img => addImage(img));
          }
        }
      }

      // 导出服装 (Clothing)
      if (ids.clothingIds && Array.isArray(ids.clothingIds)) {
        for (const id of ids.clothingIds) {
          const item = DatabaseService.getById('clothing', id);
          if (item) {
            exportData.data.clothing.push(item);
            const images = JSON.parse(item.images_json || '[]');
            images.forEach(img => addImage(img));
          }
        }
      }

      // 导出道具 (Props)
      if (ids.propsIds && Array.isArray(ids.propsIds)) {
        for (const id of ids.propsIds) {
          const item = DatabaseService.getById('props', id);
          if (item) {
            exportData.data.props.push(item);
            const images = JSON.parse(item.images_json || '[]');
            images.forEach(img => addImage(img));
          }
        }
      }

      // 导出妆容 (Makeup)
      if (ids.makeupIds && Array.isArray(ids.makeupIds)) {
        for (const id of ids.makeupIds) {
          const item = DatabaseService.getById('makeup', id);
          if (item) {
            exportData.data.makeup.push(item);
            const images = JSON.parse(item.images_json || '[]');
            images.forEach(img => addImage(img));
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
    let importTempDir = null;
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

      const fileStat = fs.statSync(finalFilePath);
      const fileContent = fs.readFileSync(finalFilePath, 'utf-8');
      const exportData = JSON.parse(fileContent);

      validateImportPackage(exportData, fileStat.size);

      // 准备临时图片解压目录
      importTempDir = path.join(WorkspaceService.getPath(), 'images', 'import_temp');
      if (!fs.existsSync(importTempDir)) {
        fs.mkdirSync(importTempDir, { recursive: true });
      }

      const tempPathMapping = {}; // 旧绝对路径 -> 临时绝对路径
      
      // 1. 还原所有 Base64 图片为本地临时物理文件
      if (exportData.images) {
        for (const [oldPath, base64Str] of Object.entries(exportData.images)) {
          const buffer = Buffer.from(base64Str, 'base64');
          // 生成随机防冲突文件名
          const hash = crypto.randomBytes(8).toString('hex');
          const ext = path.extname(oldPath) || '.jpg';
          const fileName = `${Date.now()}_${hash}${ext}`;
          const targetPath = path.join(importTempDir, fileName);
          fs.writeFileSync(targetPath, buffer);
          tempPathMapping[oldPath] = targetPath;
          const normalizedOldPath = getImagePath(oldPath);
          if (normalizedOldPath) {
            tempPathMapping[normalizedOldPath] = targetPath;
          }
        }
      }

      // 获取临时路径的辅助方法
      const getTempPath = (imageValue) => {
        const oldPath = getImagePath(imageValue);
        if (!oldPath) return oldPath;
        return tempPathMapping[oldPath] || oldPath;
      };

      const importImageValue = (imageValue, tableName, entityId, name, index) => {
        const oldPath = getImagePath(imageValue);
        if (!oldPath) return imageValue;

        let newPath = getTempPath(oldPath);
        if (newPath && newPath !== oldPath) {
          newPath = copyToEntityDir(newPath, tableName, entityId, name, index);
        }

        if (imageValue && typeof imageValue === 'object') {
          return {
            ...imageValue,
            path: newPath,
            url: pathToLocalImageURL(newPath)
          };
        }
        return {
          path: newPath,
          url: pathToLocalImageURL(newPath),
          ratio: 1
        };
      };

      // 复制临时图片到目标实体目录的辅助方法
      const copyToEntityDir = (tempPath, tableName, entityId, name = '', index = 0) => {
        if (!tempPath || !fs.existsSync(tempPath)) return tempPath;
        
        // 构建与前端一致的 `${sanitize(name)}_${id}` 格式，如果名字为空则使用 `id`
        const sanitizedName = name ? sanitize(name) : '';
        const folderName = sanitizedName && sanitizedName !== 'unnamed' 
          ? `${sanitizedName}_${entityId}` 
          : String(entityId);
        
        const targetDir = path.join(WorkspaceService.getPath(), 'images', tableName, folderName);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const ext = path.extname(tempPath) || '.jpg';
        const fileName = `${Date.now()}_${index}${ext}`;
        const targetPath = path.join(targetDir, fileName);
        
        try {
          fs.copyFileSync(tempPath, targetPath);
          return targetPath;
        } catch (err) {
          console.error('[ExportService] 复制文件失败:', err);
          return tempPath;
        }
      };

      // 将物理路径转换为 local-image:// 协议链接
      const pathToLocalImageURL = (absolutePath) => {
        if (!absolutePath) return '';
        return `local-image://host/${absolutePath.replace(/\\/g, '/')}`;
      };

      // 2. 在事务中插入所有记录并归档图片，失败时自动回滚
      DatabaseService.transaction(() => {
        if (exportData.data.models) {
          for (const model of exportData.data.models) {
            const newModel = {};
            DatabaseService.constructor.VALID_COLUMNS.models.forEach(key => {
              if (key !== 'id' && key !== 'created_at' && model[key] !== undefined) newModel[key] = model[key];
            });
            
            // 插入一条临时记录获取 id
            const record = DatabaseService.insert('models', newModel);
            const newId = record.id;
            
            // 复制头像和模卡
            let avatarPath = getTempPath(newModel.avatar_path);
            if (avatarPath && avatarPath !== newModel.avatar_path) {
              avatarPath = copyToEntityDir(avatarPath, 'models', newId, record.name, 'avatar');
            }
            let modelCardPath = getTempPath(newModel.model_card_path);
            if (modelCardPath && modelCardPath !== newModel.model_card_path) {
              modelCardPath = copyToEntityDir(modelCardPath, 'models', newId, record.name, 'modelcard');
            }
            
            // 复制作品照片组
            const images = JSON.parse(newModel.images_json || '[]');
            const finalImages = images.map((img, idx) => importImageValue(img, 'models', newId, record.name, `photo_${idx}`));
            
            // 更新该记录
            DatabaseService.update('models', newId, {
              avatar_path: avatarPath,
              model_card_path: modelCardPath,
              images_json: JSON.stringify(finalImages)
            });
          }
        }

        if (exportData.data.locations) {
          for (const loc of exportData.data.locations) {
            const newLoc = {};
            DatabaseService.constructor.VALID_COLUMNS.locations.forEach(key => {
              if (key !== 'id' && key !== 'created_at' && loc[key] !== undefined) newLoc[key] = loc[key];
            });
            
            const record = DatabaseService.insert('locations', newLoc);
            const newId = record.id;
            
            let coverPath = getTempPath(newLoc.cover_path);
            if (coverPath && coverPath !== newLoc.cover_path) {
              coverPath = copyToEntityDir(coverPath, 'locations', newId, record.name, 'cover');
            }
            
            const images = JSON.parse(newLoc.images_json || '[]');
            const finalImages = images.map((img, idx) => importImageValue(img, 'locations', newId, record.name, `photo_${idx}`));
            
            DatabaseService.update('locations', newId, {
              cover_path: coverPath,
              images_json: JSON.stringify(finalImages)
            });
          }
        }

        if (exportData.data.plans) {
          for (const plan of exportData.data.plans) {
            const newPlan = {};
            DatabaseService.constructor.VALID_COLUMNS.plans.forEach(key => {
              if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && plan[key] !== undefined) newPlan[key] = plan[key];
            });
            
            const record = DatabaseService.insert('plans', newPlan);
            const newId = record.id;
            
            let coverPath = getTempPath(newPlan.cover_path);
            if (coverPath && coverPath !== newPlan.cover_path) {
              coverPath = copyToEntityDir(coverPath, 'plans', newId, record.title, 'cover');
            }
            
            const modules = JSON.parse(newPlan.modules_json || '[]');
            modules.forEach((m, mIdx) => {
              if (m.data?.images) {
                m.data.images = m.data.images.map((img, imgIdx) => (
                  importImageValue(img, 'plans', newId, record.title, `mod_${mIdx}_img_${imgIdx}`)
                ));
              }
              if (m.data?.avatar) {
                let p = getTempPath(m.data.avatarPath || m.data.avatar);
                if (p && p !== (m.data.avatarPath || m.data.avatar)) {
                  p = copyToEntityDir(p, 'plans', newId, record.title, `mod_${mIdx}_avatar`);
                }
                if (m.data.avatarPath) {
                  m.data.avatarPath = p;
                  m.data.avatar = pathToLocalImageURL(p);
                } else {
                  m.data.avatar = p;
                  if (m.data.avatar && !m.data.avatar.startsWith('local-image://')) {
                    m.data.avatar = pathToLocalImageURL(p);
                  }
                }
              }
              if (m.data?.modelCard) {
                let p = getTempPath(m.data.modelCardPath || m.data.modelCard);
                if (p && p !== (m.data.modelCardPath || m.data.modelCard)) {
                  p = copyToEntityDir(p, 'plans', newId, record.title, `mod_${mIdx}_modelcard`);
                }
                if (m.data.modelCardPath) {
                  m.data.modelCardPath = p;
                  m.data.modelCard = pathToLocalImageURL(p);
                } else {
                  m.data.modelCard = p;
                  if (m.data.modelCard && !m.data.modelCard.startsWith('local-image://')) {
                    m.data.modelCard = pathToLocalImageURL(p);
                  }
                }
              }
              if (m.data?.items) {
                m.data.items.forEach((item, itemIdx) => {
                  if (item.images) {
                    item.images = item.images.map((img, imgIdx) => (
                      importImageValue(img, 'plans', newId, record.title, `mod_${mIdx}_item_${itemIdx}_img_${imgIdx}`)
                    ));
                  }
                });
              }
            });
            
            DatabaseService.update('plans', newId, {
              cover_path: coverPath,
              modules_json: JSON.stringify(modules)
            });
          }
        }

        if (exportData.data.clothing) {
          for (const item of exportData.data.clothing) {
            const newItem = {};
            DatabaseService.constructor.VALID_COLUMNS.clothing.forEach(key => {
              if (key !== 'id' && key !== 'created_at' && item[key] !== undefined) newItem[key] = item[key];
            });
            
            const record = DatabaseService.insert('clothing', newItem);
            const newId = record.id;
            
            const images = JSON.parse(newItem.images_json || '[]');
            const finalImages = images.map((img, idx) => importImageValue(img, 'clothing', newId, record.name, `photo_${idx}`));
            
            DatabaseService.update('clothing', newId, {
              images_json: JSON.stringify(finalImages)
            });
          }
        }

        if (exportData.data.props) {
          for (const item of exportData.data.props) {
            const newItem = {};
            DatabaseService.constructor.VALID_COLUMNS.props.forEach(key => {
              if (key !== 'id' && key !== 'created_at' && item[key] !== undefined) newItem[key] = item[key];
            });
            
            const record = DatabaseService.insert('props', newItem);
            const newId = record.id;
            
            const images = JSON.parse(newItem.images_json || '[]');
            const finalImages = images.map((img, idx) => importImageValue(img, 'props', newId, record.name, `photo_${idx}`));
            
            DatabaseService.update('props', newId, {
              images_json: JSON.stringify(finalImages)
            });
          }
        }

        if (exportData.data.makeup) {
          for (const item of exportData.data.makeup) {
            const newItem = {};
            DatabaseService.constructor.VALID_COLUMNS.makeup.forEach(key => {
              if (key !== 'id' && key !== 'created_at' && item[key] !== undefined) newItem[key] = item[key];
            });
            
            const record = DatabaseService.insert('makeup', newItem);
            const newId = record.id;
            
            const images = JSON.parse(newItem.images_json || '[]');
            const finalImages = images.map((img, idx) => importImageValue(img, 'makeup', newId, record.name, `photo_${idx}`));
            
            DatabaseService.update('makeup', newId, {
              images_json: JSON.stringify(finalImages)
            });
          }
        }
      });

      // 3. 清理临时文件夹
      if (fs.existsSync(importTempDir)) {
        try {
          fs.rmSync(importTempDir, { recursive: true, force: true });
        } catch (e) {
          console.warn('[ExportService] 清理临时文件夹失败:', e);
        }
      }

      return { success: true };
    } catch (e) {
      console.error('[ExportService] 导入失败:', e);
      return { success: false, error: e.message };
    } finally {
      if (importTempDir && fs.existsSync(importTempDir)) {
        try {
          fs.rmSync(importTempDir, { recursive: true, force: true });
        } catch (e) {
          console.warn('[ExportService] 清理临时文件夹失败:', e);
        }
      }
    }
  }
}

export default new ExportService();

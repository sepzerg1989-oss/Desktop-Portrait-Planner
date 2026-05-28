import Database from 'better-sqlite3'
import path from 'path'

/**
 * 数据库服务 — 基于 better-sqlite3 的 SQLite 封装
 * 负责初始化表结构与提供通用/业务级的 CRUD 方法
 */
class DatabaseService {
  constructor() {
    this.db = null
  }

  /**
   * 初始化数据库连接并创建表结构
   * @param {string} workspacePath - 用户工作区目录的绝对路径
   */
  init(workspacePath) {
    const dbPath = path.join(workspacePath, 'database.sqlite')
    this.db = new Database(dbPath)

    // 开启 WAL 模式，提升并发读写性能
    this.db.pragma('journal_mode = WAL')

    this._createTables()
  }

  /** 创建所有核心业务数据表 */
  _createTables() {
    this.db.exec(`
      -- 策划案表
      CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '未命名策划案',
        cover_path TEXT,
        modules_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now','localtime')),
        updated_at TEXT DEFAULT (datetime('now','localtime'))
      );

      -- 模特库表
      CREATE TABLE IF NOT EXISTS models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        avatar_path TEXT,
        model_card_path TEXT,
        social TEXT DEFAULT '',
        region TEXT DEFAULT '',
        price TEXT DEFAULT '',
        images_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now','localtime'))
      );

      -- 场地库表
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT DEFAULT '',
        price TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        cover_path TEXT,
        images_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now','localtime'))
      );

      -- 模板预设表（从 localStorage 迁移）
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        structure_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now','localtime'))
      );
    `)

    // 数据库迁移逻辑：尝试为老数据库的 models 表增加新字段
    try { this.db.exec("ALTER TABLE models ADD COLUMN region TEXT DEFAULT ''") } catch(e) {}
    try { this.db.exec("ALTER TABLE models ADD COLUMN price TEXT DEFAULT ''") } catch(e) {}
    try { this.db.exec("ALTER TABLE models ADD COLUMN model_card_path TEXT DEFAULT ''") } catch(e) {}
    try { this.db.exec("ALTER TABLE models ADD COLUMN images_json TEXT DEFAULT '[]'") } catch(e) {}
  }

  // ==================== 通用 CRUD ====================

  /** 允许操作的表白名单 — 防御性校验 */
  static VALID_TABLES = ['plans', 'models', 'locations', 'templates']

  static VALID_COLUMNS = {
    plans: ['id', 'title', 'cover_path', 'modules_json', 'created_at', 'updated_at'],
    models: ['id', 'name', 'tags', 'avatar_path', 'model_card_path', 'social', 'region', 'price', 'images_json', 'created_at'],
    locations: ['id', 'name', 'address', 'price', 'tags', 'cover_path', 'images_json', 'created_at'],
    templates: ['id', 'name', 'structure_json', 'created_at'],
  }

  _validateTable(table) {
    if (!DatabaseService.VALID_TABLES.includes(table)) {
      throw new Error(`[DatabaseService] 非法表名: ${table}`)
    }
  }

  _validateColumns(table, keys) {
    const allowed = DatabaseService.VALID_COLUMNS[table]
    if (!allowed) {
      throw new Error(`[DatabaseService] 未知表: ${table}`)
    }
    for (const key of keys) {
      if (!allowed.includes(key)) {
        throw new Error(`[DatabaseService] 非法列名: ${table}.${key}`)
      }
    }
  }

  /** 获取表中所有记录 */
  getAll(table) {
    this._validateTable(table)
    return this.db.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC`).all()
  }

  /** 按 ID 获取单条记录 */
  getById(table, id) {
    this._validateTable(table)
    return this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id)
  }

  /** 插入一条记录，返回插入后的完整记录 */
  insert(table, data) {
    this._validateTable(table)
    const keys = Object.keys(data)
    this._validateColumns(table, keys)
    const placeholders = keys.map(() => '?').join(', ')
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
    const result = this.db.prepare(sql).run(...keys.map(k => data[k]))
    return this.getById(table, result.lastInsertRowid)
  }

  update(table, id, data) {
    this._validateTable(table)
    const keys = Object.keys(data)
    this._validateColumns(table, keys)
    const setClause = keys.map(k => `${k} = ?`).join(', ')
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`
    this.db.prepare(sql).run(...keys.map(k => data[k]), id)
    return this.getById(table, id)
  }

  /** 删除一条记录 */
  delete(table, id) {
    this._validateTable(table)
    this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
    return { success: true }
  }

  /** 批量删除记录 (使用 SQLite 事务) */
  deleteBatch(table, ids) {
    this._validateTable(table)
    const stmt = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`)
    const deleteTx = this.db.transaction((targetIds) => {
      for (const id of targetIds) {
        stmt.run(id)
      }
    })
    deleteTx(ids)
    return { success: true }
  }

  // ==================== 策划案业务方法 ====================

  /** 保存策划案 (含更新时间戳) */
  savePlan(id, data) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    return this.update('plans', id, { ...data, updated_at: now })
  }

  /** 创建空策划案 */
  createEmptyPlan(title = '未命名策划案') {
    return this.insert('plans', {
      title,
      modules_json: JSON.stringify([
        { id: 'm1', type: 'theme', title: '拍摄主题', data: { title: title, description: '', images: [] } },
        { id: 'm2', type: 'model', title: '拍摄模特', data: { name: '', avatar: '', tags: [] } },
        { id: 'm3', type: 'location', title: '拍摄场地', data: { name: '', address: '', images: [] } },
        { id: 'm4', type: 'reference', title: '参考样片', data: { images: [] } }
      ])
    })
  }

  // ==================== 模板业务方法 ====================

  /** 保存为模板 */
  saveTemplate(name, structureJson) {
    return this.insert('templates', {
      name,
      structure_json: JSON.stringify(structureJson)
    })
  }

  /** 获取所有模板 */
  getTemplates() {
    return this.getAll('templates')
  }

  /** 关闭数据库连接 */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

export default new DatabaseService()

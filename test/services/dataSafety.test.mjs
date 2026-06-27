import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'

import {
  getImagePath,
  isAllowedImagePath,
  validateImportPackage
} from '../../electron/services/DataSafety.js'

test('getImagePath accepts string, path object, url object, and local-image urls', () => {
  assert.equal(getImagePath('D:/Workspace/images/plans/1/a.jpg'), 'D:/Workspace/images/plans/1/a.jpg')
  assert.equal(getImagePath({ path: 'D:/Workspace/images/models/1/a.png' }), 'D:/Workspace/images/models/1/a.png')
  assert.equal(getImagePath({ url: 'D:/Workspace/images/props/1/a.webp' }), 'D:/Workspace/images/props/1/a.webp')
  assert.equal(
    getImagePath({ url: 'local-image://host/D:/Workspace/images/makeup/1/a.jpg' }),
    'D:/Workspace/images/makeup/1/a.jpg'
  )
  assert.equal(getImagePath({ path: '', url: '' }), '')
})

test('getImagePath normalizes local-image keys for import image lookup', () => {
  const packageKey = 'local-image://host/D:/Workspace/images/plans/1/ref.jpg'
  const moduleValue = { path: 'D:/Workspace/images/plans/1/ref.jpg' }

  assert.equal(getImagePath(packageKey), getImagePath(moduleValue))
})

test('isAllowedImagePath only allows supported images inside workspace images folder', () => {
  const workspace = path.resolve('D:/Workspace')
  const inside = path.join(workspace, 'images', 'models', '1', 'avatar.jpg')
  const outside = path.resolve('D:/Other/images/models/1/avatar.jpg')
  const wrongType = path.join(workspace, 'images', 'models', '1', 'notes.txt')

  assert.equal(isAllowedImagePath(inside, workspace), true)
  assert.equal(isAllowedImagePath(outside, workspace), false)
  assert.equal(isAllowedImagePath(wrongType, workspace), false)
})

test('validateImportPackage rejects invalid shape and oversized image payloads', () => {
  assert.throws(
    () => validateImportPackage({ type: 'other', images: {} }, 10),
    /无效的导出文件格式/
  )

  const imageLimit = 25 * 1024 * 1024
  const tooLargeBase64 = Buffer.alloc(imageLimit + 1).toString('base64')
  assert.throws(
    () => validateImportPackage({
      type: 'portraitplanner-export',
      data: {},
      images: { 'D:/Workspace/images/a.jpg': tooLargeBase64 }
    }, 1024),
    /单张图片过大/
  )
})

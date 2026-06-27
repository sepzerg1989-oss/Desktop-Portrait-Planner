import assert from 'node:assert/strict'
import test from 'node:test'
import { reactive } from 'vue'

import { createThemeCopyPayload } from '../../src/utils/aiPayload.js'

test('theme copy payload converts Vue reactive image objects into cloneable plain data', () => {
  const formData = reactive({
    title: '雨夜霓虹',
    description: '冷色街灯与潮湿路面',
    images: [
      reactive({
        path: 'D:/Workspace/images/plans/1/theme.jpg',
        url: 'local-image://host/D:/Workspace/images/plans/1/theme.jpg',
        ratio: 1.5,
        transient: () => 'not cloneable'
      })
    ]
  })

  assert.throws(() => structuredClone(formData.images[0]), /could not be cloned/)

  const payload = createThemeCopyPayload(formData)

  assert.deepEqual(payload, {
    title: '雨夜霓虹',
    description: '冷色街灯与潮湿路面',
    images: [
      {
        path: 'D:/Workspace/images/plans/1/theme.jpg',
        url: 'local-image://host/D:/Workspace/images/plans/1/theme.jpg',
        ratio: 1.5
      }
    ]
  })
  assert.deepEqual(structuredClone(payload), payload)
})

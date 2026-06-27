import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..', '..')

const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8')

test('canvas copy preserves line breaks and breaks long unspaced text', () => {
  const styles = read('src/style.css')

  assert.match(styles, /\.canvas-copy\s*\{/)
  assert.match(styles, /white-space:\s*pre-wrap;/)
  assert.match(styles, /overflow-wrap:\s*anywhere;/)
  assert.match(styles, /word-break:\s*break-word;/)
})

test('canvas modules use canvas copy styling for editable descriptions', () => {
  const modules = [
    'src/components/PlanEditor/CanvasModules/MakeupModule.vue',
    'src/components/PlanEditor/CanvasModules/GenericModule.vue',
    'src/components/PlanEditor/CanvasModules/ClothingModule.vue',
    'src/components/PlanEditor/CanvasModules/PropsModule.vue',
    'src/components/PlanEditor/CanvasModules/ThemeModule.vue'
  ]

  for (const modulePath of modules) {
    assert.match(read(modulePath), /canvas-copy/, `${modulePath} should wrap long canvas text`)
  }
})

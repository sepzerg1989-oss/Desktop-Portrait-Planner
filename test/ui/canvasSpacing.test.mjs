import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..', '..')
const canvas = readFileSync(path.join(root, 'src/components/PlanEditor/Canvas.vue'), 'utf8')

test('canvas viewport uses tighter surrounding space', () => {
  const containerLine = canvas.split('\n').find((line) => line.includes('id="canvas-container"'))

  assert.match(containerLine, /\bpx-8\b/)
  assert.match(containerLine, /\bpy-10\b/)
})

test('export paper uses compact padding for phone viewing', () => {
  const exportLine = canvas.split('\n').find((line) => line.includes('id="export-canvas"'))

  assert.match(exportLine, /\bp-8\b/)
})

test('module content does not add one-sided horizontal spacing', () => {
  const moduleLine = canvas.split('\n').find((line) => line.includes('py-16 border-t border-morandi-border'))

  assert.doesNotMatch(moduleLine, /\bpl-6\b/)
  assert.doesNotMatch(moduleLine, /\bborder-l-2\b/)
})

test('active module marker sits outside the content edge', () => {
  assert.match(canvas, /active-module-marker/)
  assert.match(canvas, /left:\s*-14px;/)
  assert.match(canvas, /width:\s*2px;/)
})

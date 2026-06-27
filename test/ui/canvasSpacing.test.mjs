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
  const moduleLine = canvas.split('\n').find((line) => line.includes('group transition-all duration-500'))

  assert.doesNotMatch(moduleLine, /\bpl-6\b/)
  assert.doesNotMatch(moduleLine, /\bborder-l-2\b/)
})

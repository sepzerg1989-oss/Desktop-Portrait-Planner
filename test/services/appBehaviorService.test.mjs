import assert from 'node:assert/strict'
import test from 'node:test'

import { AppBehaviorService } from '../../electron/services/AppBehaviorService.js'

function createStore(initial = {}) {
  const state = { ...initial }
  return {
    get(key, fallback) {
      return Object.prototype.hasOwnProperty.call(state, key) ? state[key] : fallback
    },
    set(key, value) {
      state[key] = value
    }
  }
}

test('returns safe default app behavior settings', () => {
  const service = AppBehaviorService.createForTest({ store: createStore() })

  assert.deepEqual(service.getSettings(), {
    closeBehavior: 'tray',
    showCloseToTrayNotice: true,
    autoLaunch: false
  })
})

test('normalizes invalid persisted settings', () => {
  const service = AppBehaviorService.createForTest({
    store: createStore({
      appBehavior: {
        closeBehavior: 'hide-forever',
        showCloseToTrayNotice: 'yes',
        autoLaunch: 1
      }
    })
  })

  assert.deepEqual(service.getSettings(), {
    closeBehavior: 'tray',
    showCloseToTrayNotice: true,
    autoLaunch: false
  })
})

test('saves only known app behavior settings', () => {
  const store = createStore()
  const service = AppBehaviorService.createForTest({ store })

  const saved = service.saveSettings({
    closeBehavior: 'quit',
    showCloseToTrayNotice: false,
    autoLaunch: true,
    unknown: 'ignored'
  })

  assert.deepEqual(saved, {
    closeBehavior: 'quit',
    showCloseToTrayNotice: false,
    autoLaunch: true
  })
  assert.deepEqual(store.get('appBehavior'), saved)
})

test('reports platform-specific behavior copy', () => {
  const winService = AppBehaviorService.createForTest({ store: createStore(), platform: 'win32' })
  const macService = AppBehaviorService.createForTest({ store: createStore(), platform: 'darwin' })

  assert.equal(winService.getCapabilities().backgroundTargetLabel, '系统托盘')
  assert.equal(macService.getCapabilities().backgroundTargetLabel, '菜单栏')
  assert.equal(winService.getCapabilities().platform, 'win32')
  assert.equal(macService.getCapabilities().platform, 'darwin')
})

test('decides whether close should hide or quit', () => {
  const service = AppBehaviorService.createForTest({ store: createStore() })

  assert.equal(service.shouldHideOnClose(), true)
  service.saveSettings({ closeBehavior: 'quit' })
  assert.equal(service.shouldHideOnClose(), false)
  service.markQuitting()
  service.saveSettings({ closeBehavior: 'tray' })
  assert.equal(service.shouldHideOnClose(), false)
})

test('requests renderer notice instead of hiding immediately on first close', () => {
  const sentMessages = []
  let didPreventDefault = false
  let hideCount = 0
  const service = AppBehaviorService.createForTest({ store: createStore(), platform: 'win32' })
  service.bindWindow({
    on() {},
    isDestroyed: () => false,
    hide: () => {
      hideCount += 1
    },
    webContents: {
      isDestroyed: () => false,
      send: (channel, payload) => {
        sentMessages.push({ channel, payload })
      }
    }
  })

  const result = service.handleWindowClose({
    preventDefault: () => {
      didPreventDefault = true
    }
  })

  assert.equal(result, 'notice')
  assert.equal(didPreventDefault, true)
  assert.equal(hideCount, 0)
  assert.equal(sentMessages.length, 1)
  assert.equal(sentMessages[0].channel, 'app-behavior:show-close-notice')
  assert.equal(sentMessages[0].payload.backgroundTargetLabel, '系统托盘')
})

test('resolves renderer close notice by hiding or quitting', () => {
  let hideCount = 0
  let quitCount = 0
  const store = createStore()
  const service = AppBehaviorService.createForTest({
    store,
    app: {
      quit: () => {
        quitCount += 1
      }
    }
  })
  service.bindWindow({
    on() {},
    isDestroyed: () => false,
    hide: () => {
      hideCount += 1
    }
  })

  service.resolveCloseNotice({ action: 'hide', dontShowAgain: true })
  assert.equal(hideCount, 1)
  assert.equal(quitCount, 0)
  assert.equal(store.get('appBehavior').showCloseToTrayNotice, false)

  service.resolveCloseNotice({ action: 'quit', dontShowAgain: false })
  assert.equal(quitCount, 1)
})

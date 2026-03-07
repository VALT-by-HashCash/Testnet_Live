/**
 * Global test setup — runs before every test file.
 * Provides localStorage/sessionStorage mocks, jest-dom matchers,
 * and suppresses expected console noise.
 */

import '@testing-library/jest-dom'
import { vi, beforeEach, afterAll } from 'vitest'

// ---------------------------------------------------------------------------
// localStorage / sessionStorage mocks
// ---------------------------------------------------------------------------

function createStorageMock() {
  let store = {}
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    setItem(key, value) {
      store[key] = String(value)
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    },
    key(i) {
      return Object.keys(store)[i] ?? null
    },
    get length() {
      return Object.keys(store).length
    }
  }
}

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
  writable: true
})

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
  writable: true
})

// ---------------------------------------------------------------------------
// Reset state before every test
// ---------------------------------------------------------------------------

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Suppress noisy console output in tests
// (errors/warns are still readable if a test fails — access via vi.spyOn)
// ---------------------------------------------------------------------------

const _consoleError = console.error.bind(console)
const _consoleWarn = console.warn.bind(console)
const _consoleLog = console.log.bind(console)

vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'log').mockImplementation(() => {})

afterAll(() => {
  console.error = _consoleError
  console.warn = _consoleWarn
  console.log = _consoleLog
})

// ---------------------------------------------------------------------------
// Stub window.dispatchEvent so components can call it without error
// ---------------------------------------------------------------------------

if (!window.dispatchEvent._isMockFunction) {
  const _dispatch = window.dispatchEvent.bind(window)
  window.dispatchEvent = vi.fn(_dispatch)
}

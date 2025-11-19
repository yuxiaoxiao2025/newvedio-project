/**
 * 测试环境设置文件
 * 提供全局测试工具和Mock环境
 */

import { vi } from 'vitest'

// Mock performance API for Node.js environment
global.performance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 2048 * 1024 * 1024
  },
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => [])
}

// Mock localStorage for testing
global.localStorage = {
  data: {},
  getItem: vi.fn((key) => global.localStorage.data[key] || null),
  setItem: vi.fn((key, value) => {
    global.localStorage.data[key] = String(value)
  }),
  removeItem: vi.fn((key) => {
    delete global.localStorage.data[key]
  }),
  clear: vi.fn(() => {
    global.localStorage.data = {}
  })
}

// Mock URL constructor for File API
global.URL = {
  createObjectURL: vi.fn(() => 'mock-blob-url'),
  revokeObjectURL: vi.fn()
}

// Mock Blob for file operations
global.Blob = vi.fn((content, options) => {
  return {
    content,
    options,
    size: content ? content.length : 0,
    type: options?.type || 'text/plain'
  }
})

// Mock File API
global.File = vi.fn((bits, name, options) => {
  return {
    name,
    size: bits ? bits.length : 0,
    type: options?.type || 'text/plain',
    lastModified: Date.now(),
    arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(8)))
  }
})

// Mock FileReader
global.FileReader = vi.fn(() => {
  const reader = {
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    result: null,
    onload: null,
    onerror: null
  }

  // Simulate async reading
  setTimeout(() => {
    if (reader.readAsDataURL.mockData) {
      reader.result = reader.readAsDataURL.mockData
      if (reader.onload) reader.onload({ target: reader })
    }
  }, 0)

  return reader
})

// Mock WebSocket for testing
global.WebSocket = vi.fn(() => {
  return {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1, // OPEN
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  }
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16)
})

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id)
})

// Mock fetch API for testing
global.fetch = vi.fn()
global.Response = vi.fn()

// 设置默认Mock响应
global.fetch.mockResolvedValue({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Map(),
  json: vi.fn(() => Promise.resolve({})),
  text: vi.fn(() => Promise.resolve(''))
})

// 测试工具函数
export const createMockVideoFile = (options = {}) => {
  const defaultOptions = {
    name: 'test-video.mp4',
    size: 50 * 1024 * 1024, // 50MB
    type: 'video/mp4',
    lastModified: Date.now(),
    category: 'personal'
  }

  return new File([], { ...defaultOptions, ...options })
}

export const createMockFormData = (data = {}) => {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value)
    } else if (typeof value === 'string') {
      formData.append(key, value)
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
    }
  })

  return formData
}

export const createMockWebSocket = () => {
  const callbacks = new Map()

  return {
    send: vi.fn((data) => {
      // Mock sending data
    }),
    close: vi.fn(() => {
      // Mock closing connection
    }),
    addEventListener: vi.fn((event, callback) => {
      callbacks.set(event, callback)
    }),
    removeEventListener: vi.fn((event, callback) => {
      callbacks.delete(event, callback)
    }),
    dispatchEvent: vi.fn((event, data) => {
      const callback = callbacks.get(event)
      if (callback) {
        callback({ data })
      }
    }),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  }
}

export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const flushPromises = () => new Promise(resolve => setImmediate(resolve))

// 测试断言工具
export const expectComponent = (component) => {
  return {
    toBeMounted: () => {
      expect(component).toBeDefined()
      expect(typeof component.setup).toBe('function')
    },
    toHaveProp: (propName, expectedValue) => {
      const props = component.props || {}
      expect(props[propName]).toBe(expectedValue)
    },
    toHaveEmitted: (eventName) => {
      expect(component.emitted?.[eventName]).toBeDefined()
    }
  }
}

// 测试环境变量
export const TEST_CONFIG = {
  API_BASE: 'http://localhost:8005',
  WS_BASE: 'ws://localhost:8005',
  TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3,
  MAX_FILE_SIZE: 300 * 1024 * 1024, // 300MB
  SUPPORTED_FORMATS: ['mp4', 'avi']
}

// 测试清理工具
export const cleanup = () => {
  vi.clearAllMocks()
  localStorage.clear()
}

// 全局测试工具
export const testUtils = {
  createMockVideoFile,
  createMockFormData,
  createMockWebSocket,
  waitFor,
  flushPromises,
  expectComponent,
  cleanup,
  TEST_CONFIG
}
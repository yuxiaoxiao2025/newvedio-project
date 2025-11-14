import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

export function useWebSocket(sessionId) {
  const socket = ref(null)
  const connected = ref(false)
  const progress = ref({
    overallStatus: 'pending',
    totalProgress: 0,
    completedFiles: 0,
    failedFiles: 0,
    currentFile: null,
    message: ''
  })

  // Progress events
  const onProgress = ref(null)
  const onCompleted = ref(null)
  const onError = ref(null)

  // Connect to WebSocket
  const connect = () => {
    if (!sessionId) {
      console.warn('WebSocket: No sessionId provided')
      return
    }

    console.log('WebSocket: Connecting to session', sessionId)

    socket.value = io('http://localhost:8005', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    })

    socket.value.on('connect', () => {
      connected.value = true
      console.log('WebSocket connected')

      // Join session room
      socket.value.emit('join-session', sessionId)
    })

    socket.value.on('disconnect', () => {
      connected.value = false
      console.log('WebSocket disconnected')
    })

    socket.value.on('upload-progress', (data) => {
      console.log('WebSocket progress update received:', data)

      progress.value = {
        ...progress.value,
        ...data
      }

      // Update files array with current file progress
      if (data.currentFile) {
        progress.value.currentFile = data.currentFile
        console.log('Current file progress updated:', data.currentFile)
      }

      // Emit progress event
      if (onProgress.value) {
        onProgress.value(data)
      }

      // Check if upload is completed
      if (data.overallStatus === 'completed') {
        console.log('Upload completed via WebSocket')
        if (onCompleted.value) {
          onCompleted.value(data)
        }
        disconnect()
      }
    })

    socket.value.on('error', (error) => {
      console.error('WebSocket error:', error)
      connected.value = false
      if (onError.value) {
        onError.value(error)
      }
    })

    socket.value.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      connected.value = false
      // 如果连接失败，设置一个默认的进度状态
      progress.value.message = 'WebSocket连接失败，使用HTTP轮询模式'
      progress.value.totalProgress = 10 // 设置一个初始进度
    })

    // 设置连接超时
    setTimeout(() => {
      if (!connected.value && progress.value.totalProgress === 0) {
        console.warn('WebSocket connection timeout, falling back to HTTP polling')
        progress.value.message = '连接超时，切换到HTTP轮询模式'
        progress.value.totalProgress = 10 // 设置一个初始进度
      }
    }, 3000)
  }

  // Disconnect from WebSocket
  const disconnect = () => {
    if (socket.value && sessionId) {
      socket.value.emit('leave-session', sessionId)
      socket.value.disconnect()
      socket.value = null
      connected.value = false
    }
  }

  // Auto connect on mount
  onMounted(() => {
    if (sessionId) {
      connect()
    }
  })

  // Auto disconnect on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    connected,
    progress,
    onProgress,
    onCompleted,
    onError,
    connect,
    disconnect
  }
}
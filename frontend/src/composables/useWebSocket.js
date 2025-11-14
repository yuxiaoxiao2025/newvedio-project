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
    if (!sessionId) return

    socket.value = io('http://localhost:8005', {
      transports: ['websocket', 'polling']
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
      console.log('Progress update:', data)

      progress.value = {
        ...progress.value,
        ...data
      }

      // Update files array with current file progress
      if (data.currentFile) {
        progress.value.currentFile = data.currentFile
      }

      // Emit progress event
      if (onProgress.value) {
        onProgress.value(data)
      }

      // Check if upload is completed
      if (data.overallStatus === 'completed') {
        if (onCompleted.value) {
          onCompleted.value(data)
        }
        disconnect()
      }
    })

    socket.value.on('error', (error) => {
      console.error('WebSocket error:', error)
      if (onError.value) {
        onError.value(error)
      }
    })
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
    connect()
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
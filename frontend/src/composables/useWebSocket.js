import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

export function useWebSocket(sessionId) {
  const socket = ref(null)
  const connected = ref(false)
  const connectionPromise = ref(null)
  const progress = ref({
    overallStatus: 'pending',
    totalProgress: 0,
    completedFiles: 0,
    failedFiles: 0,
    currentFile: null,
    message: '',
    sessionId: sessionId
  })

  // Progress events
  const onProgress = ref(null)
  const onCompleted = ref(null)
  const onError = ref(null)

  // Connect to WebSocket with Promise for better control
  const connect = () => {
    if (connectionPromise.value) {
      return connectionPromise.value
    }

    connectionPromise.value = new Promise((resolve, reject) => {
      if (socket.value && socket.value.connected) {
        connected.value = true
        resolve(socket.value)
        return
      }

      socket.value = io(`http://localhost:8005`, {
        transports: ['websocket', 'polling'],
        forceNew: true,
        timeout: 8000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 2000
      })

      const connectTimeout = setTimeout(() => {
        if (!connected.value) {
          connected.value = false
          progress.value.message = 'WebSocket连接超时，将使用HTTP轮询'
          progress.value.totalProgress = 5
          reject(new Error('WebSocket connection timeout'))
        }
      }, 8000)

      socket.value.on('connect', () => {
        clearTimeout(connectTimeout)
        connected.value = true
        console.log('WebSocket connected successfully')
        progress.value.message = 'WebSocket已连接，准备接收进度更新'
        resolve(socket.value)
      })

      socket.value.on('disconnect', (reason) => {
        connected.value = false
        console.log('WebSocket disconnected:', reason)
        if (reason === 'io server disconnect') {
          // 服务器主动断开，需要重新连接
          progress.value.message = '与服务器的连接断开，尝试重新连接...'
          socket.value.connect()
        }
      })

      socket.value.on('connect_error', (error) => {
        clearTimeout(connectTimeout)
        connected.value = false
        console.error('WebSocket connection error:', error)
        progress.value.message = 'WebSocket连接失败，将使用HTTP轮询模式'
        progress.value.totalProgress = 5
        reject(error)
      })

      socket.value.on('reconnect', (attemptNumber) => {
        console.log('WebSocket reconnected after', attemptNumber, 'attempts')
        connected.value = true
        progress.value.message = 'WebSocket已重新连接'
      })

      socket.value.on('reconnect_error', (error) => {
        console.error('WebSocket reconnection error:', error)
        progress.value.message = 'WebSocket重连失败，继续尝试...'
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
          progress.value.message = '文件上传完成！'
          if (onCompleted.value) {
            onCompleted.value(data)
          }
          // 延迟断开连接，给用户时间看到完成状态
          setTimeout(() => {
            disconnect()
          }, 3000)
        }
      })

      socket.value.on('error', (error) => {
        console.error('WebSocket error:', error)
        if (onError.value) {
          onError.value(error)
        }
      })
    })

    return connectionPromise.value
  }

  const joinSession = async (sid) => {
    try {
      const sock = await connect()
      if (sock && sid) {
        sock.emit('join-session', sid)
        console.log('Joined session:', sid)
        progress.value.message = '已加入上传会话，等待开始上传...'
      }
      return sock
    } catch (error) {
      console.error('Failed to join session:', error)
      progress.value.message = '加入会话失败，将使用HTTP轮询'
      return null
    }
  }

  const leaveSession = (sid) => {
    if (socket.value && sid) {
      socket.value.emit('leave-session', sid)
      console.log('Left session:', sid)
    }
  }

  // Disconnect from WebSocket
  const disconnect = () => {
    if (socket.value) {
      if (sessionId) {
        socket.value.emit('leave-session', sessionId)
      }
      socket.value.disconnect()
      socket.value = null
    }
    connected.value = false
    connectionPromise.value = null
    console.log('WebSocket disconnected')
  }

  // 确保连接并加入会话的便捷方法
  const ensureConnection = async () => {
    if (!connected.value && sessionId) {
      try {
        await joinSession(sessionId)
      } catch (error) {
        console.error('Failed to ensure WebSocket connection:', error)
        // 不抛出错误，允许继续使用HTTP轮询
      }
    }
  }

  // Auto connect on mount
  onMounted(() => {
    if (sessionId) {
      // 延迟连接，确保组件完全挂载
      setTimeout(() => {
        joinSession(sessionId)
      }, 200)
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
    disconnect,
    joinSession,
    leaveSession,
    ensureConnection // 新增的方法，确保连接可用
  }
}
'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface User {
  id: string
  name: string
  projectId: string
}

interface CursorPosition {
  line: number
  column: number
}

export function useSocket(projectId: string | null, user: User | null) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [cursors, setCursors] = useState<{ [userId: string]: CursorPosition }>({})
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({})

  useEffect(() => {
    if (!projectId || !user) return

    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling']
    })

    const socket = socketRef.current

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('join-project', { projectId, user })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    // Room events
    socket.on('room-state', (data: { users: User[]; cursors: { [userId: string]: CursorPosition } }) => {
      setOnlineUsers(data.users)
      setCursors(data.cursors)
    })

    socket.on('user-joined', (data: { user: User; users: User[] }) => {
      setOnlineUsers(data.users)
    })

    socket.on('user-left', (data: { userId: string; users: User[] }) => {
      setOnlineUsers(data.users)
      setCursors(prev => {
        const newCursors = { ...prev }
        delete newCursors[data.userId]
        return newCursors
      })
      setTypingUsers(prev => {
        const newTypingUsers = { ...prev }
        delete newTypingUsers[data.userId]
        return newTypingUsers
      })
    })

    // Code collaboration events
    socket.on('code-change', (data: { fileId: string; content: string; userId: string }) => {
      // This will be handled by the component
    })

    // Cursor events
    socket.on('cursor-move', (data: { userId: string; line: number; column: number; fileId: string }) => {
      setCursors(prev => ({
        ...prev,
        [data.userId]: { line: data.line, column: data.column }
      }))
    })

    // File operation events
    socket.on('file-created', (data: { file: any; userId: string }) => {
      // This will be handled by the component
    })

    socket.on('file-deleted', (data: { fileId: string; userId: string }) => {
      // This will be handled by the component
    })

    socket.on('file-renamed', (data: { fileId: string; newName: string; userId: string }) => {
      // This will be handled by the component
    })

    // Terminal events
    socket.on('terminal-command', (data: { command: string; userId: string }) => {
      // This will be handled by the component
    })

    // Typing indicator events
    socket.on('typing-start', (data: { userId: string; fileId: string }) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.fileId
      }))
    })

    socket.on('typing-stop', (data: { userId: string; fileId: string }) => {
      setTypingUsers(prev => {
        const newTypingUsers = { ...prev }
        delete newTypingUsers[data.userId]
        return newTypingUsers
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [projectId, user])

  // Socket methods
  const sendCodeChange = (fileId: string, content: string, userId: string) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('code-change', {
        projectId,
        fileId,
        content,
        userId
      })
    }
  }

  const sendCursorMove = (fileId: string, line: number, column: number, userId: string) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('cursor-move', {
        projectId,
        fileId,
        line,
        column,
        userId
      })
    }
  }

  const sendFileCreated = (file: any, userId: string) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('file-created', {
        projectId,
        file,
        userId
      })
    }
  }

  const sendFileDeleted = (fileId: string, userId: string) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('file-deleted', {
        projectId,
        fileId,
        userId
      })
    }
  }

  const sendFileRenamed = (fileId: string, newName: string, userId: string) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('file-renamed', {
        projectId,
        fileId,
        newName,
        userId
      })
    }
  }

  const sendTerminalCommand = (command: string, userId: string) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('terminal-command', {
        projectId,
        command,
        userId
      })
    }
  }

  const sendTypingStart = (fileId: string, userId: string) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('typing-start', {
        projectId,
        fileId,
        userId
      })
    }
  }

  const sendTypingStop = (fileId: string, userId: string) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('typing-stop', {
        projectId,
        fileId,
        userId
      })
    }
  }

  return {
    isConnected,
    onlineUsers,
    cursors,
    typingUsers,
    sendCodeChange,
    sendCursorMove,
    sendFileCreated,
    sendFileDeleted,
    sendFileRenamed,
    sendTerminalCommand,
    sendTypingStart,
    sendTypingStop
  }
}
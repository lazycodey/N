import { Server } from 'socket.io'

interface User {
  id: string
  name: string
  projectId: string
}

interface ProjectRoom {
  [projectId: string]: {
    users: User[]
    cursors: { [userId: string]: { line: number; column: number } }
  }
}

const projectRooms: ProjectRoom = {}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join project room
    socket.on('join-project', (data: { projectId: string; user: User }) => {
      const { projectId, user } = data
      
      socket.join(projectId)
      socket.data.projectId = projectId
      socket.data.user = user

      // Initialize room if not exists
      if (!projectRooms[projectId]) {
        projectRooms[projectId] = {
          users: [],
          cursors: {}
        }
      }

      // Add user to room
      if (!projectRooms[projectId].users.find(u => u.id === user.id)) {
        projectRooms[projectId].users.push(user)
      }

      // Notify all users in the room
      io.to(projectId).emit('user-joined', {
        user,
        users: projectRooms[projectId].users
      })

      // Send current room state to the new user
      socket.emit('room-state', {
        users: projectRooms[projectId].users,
        cursors: projectRooms[projectId].cursors
      })
    })

    // Handle code changes
    socket.on('code-change', (data: {
      projectId: string
      fileId: string
      content: string
      userId: string
    }) => {
      socket.to(data.projectId).emit('code-change', {
        fileId: data.fileId,
        content: data.content,
        userId: data.userId
      })
    })

    // Handle cursor movements
    socket.on('cursor-move', (data: {
      projectId: string
      fileId: string
      line: number
      column: number
      userId: string
    }) => {
      const { projectId, userId, line, column } = data
      
      if (projectRooms[projectId]) {
        projectRooms[projectId].cursors[userId] = { line, column }
        
        socket.to(projectId).emit('cursor-move', {
          userId,
          line,
          column,
          fileId: data.fileId
        })
      }
    })

    // Handle file operations
    socket.on('file-created', (data: {
      projectId: string
      file: any
      userId: string
    }) => {
      socket.to(data.projectId).emit('file-created', {
        file: data.file,
        userId: data.userId
      })
    })

    socket.on('file-deleted', (data: {
      projectId: string
      fileId: string
      userId: string
    }) => {
      socket.to(data.projectId).emit('file-deleted', {
        fileId: data.fileId,
        userId: data.userId
      })
    })

    socket.on('file-renamed', (data: {
      projectId: string
      fileId: string
      newName: string
      userId: string
    }) => {
      socket.to(data.projectId).emit('file-renamed', {
        fileId: data.fileId,
        newName: data.newName,
        userId: data.userId
      })
    })

    // Handle terminal commands
    socket.on('terminal-command', (data: {
      projectId: string
      command: string
      userId: string
    }) => {
      socket.to(data.projectId).emit('terminal-command', {
        command: data.command,
        userId: data.userId
      })
    })

    // Handle typing indicators
    socket.on('typing-start', (data: {
      projectId: string
      fileId: string
      userId: string
    }) => {
      socket.to(data.projectId).emit('typing-start', {
        userId: data.userId,
        fileId: data.fileId
      })
    })

    socket.on('typing-stop', (data: {
      projectId: string
      fileId: string
      userId: string
    }) => {
      socket.to(data.projectId).emit('typing-stop', {
        userId: data.userId,
        fileId: data.fileId
      })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
      
      const projectId = socket.data.projectId
      const user = socket.data.user

      if (projectId && user && projectRooms[projectId]) {
        // Remove user from room
        projectRooms[projectId].users = projectRooms[projectId].users.filter(
          u => u.id !== user.id
        )
        
        // Remove cursor
        delete projectRooms[projectId].cursors[user.id]

        // Notify remaining users
        io.to(projectId).emit('user-left', {
          userId: user.id,
          users: projectRooms[projectId].users
        })

        // Clean up empty rooms
        if (projectRooms[projectId].users.length === 0) {
          delete projectRooms[projectId]
        }
      }
    })

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Replit Clone collaboration server',
      socketId: socket.id
    })
  })
}
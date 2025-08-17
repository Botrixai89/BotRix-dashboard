import { NextRequest } from 'next/server'
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | undefined

const SocketHandler = (req: NextRequest) => {
  if (!io) {
    console.log('*First use, starting Socket.IO server...*')
    
    // Get the response object to access the socket
    const res = (req as any).socket?.server
    
    if (!res) {
      return new Response('Socket.IO server could not be initialized', { status: 500 })
    }

    io = new SocketIOServer(res, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    })

    // Basic Socket.io event handling
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })

      // Echo back any message for testing
      socket.on('message', (data) => {
        socket.emit('message', data)
      })
    })

    console.log('Socket.IO server started successfully')
  }

  return new Response('Socket.IO server is running', { status: 200 })
}

export { SocketHandler as GET, SocketHandler as POST }
import { NextRequest } from 'next/server'
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { SocketServer } from '@/lib/socket-server'

let io: SocketIOServer
let socketServer: SocketServer

export async function GET(req: NextRequest) {
  if (!io) {
    console.log('*First use, starting Socket.IO server...*')
    
    // Get the HTTP server from Next.js
    const httpServer: NetServer = (req as any).socket?.server?.httpServer || (req as any).socket?.server
    
    if (!httpServer) {
      console.error('Could not get HTTP server from Next.js')
      return new Response('Internal Server Error', { status: 500 })
    }

    // Create Socket.IO server
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    })

    // Initialize our custom SocketServer with the io instance
    socketServer = new (class extends SocketServer {
      constructor(server: any) {
        // We'll pass the io instance directly instead of creating a new one
        super(server)
        // Replace the internal io with our configured one
        ;(this as any).io = io
      }
    })(httpServer)

    console.log('Socket.IO server started successfully')
  }

  return new Response('Socket.IO server is running', { status: 200 })
}
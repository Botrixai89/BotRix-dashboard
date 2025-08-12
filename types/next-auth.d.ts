import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      avatar?: string
      provider?: string
    }
  }

  interface User {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    name?: string
    email?: string
    avatar?: string
    provider?: string
    googleId?: string
  }
} 
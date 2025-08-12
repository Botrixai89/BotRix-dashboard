import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/lib/auth'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email }: any) {
      console.log('🔐 NextAuth signIn callback triggered:', { 
        provider: account?.provider, 
        email: user.email,
        profileId: profile?.sub,
        hasProfile: !!profile,
        hasAccount: !!account
      })
      
      if (account?.provider === 'google') {
        try {
          console.log('📡 Connecting to database...')
          await dbConnect()
          console.log('✅ Database connected successfully')
          
          // Check if user already exists
          const existingUser = await User.findOne({ email: user.email })
          console.log('🔍 Existing user check:', { 
            exists: !!existingUser, 
            email: user.email,
            userId: existingUser?._id 
          })
          
          if (!existingUser) {
            // Create new user with Google data
            console.log('👤 Creating new Google user...')
            const newUser = new User({
              email: user.email,
              name: user.name,
              avatar: user.image,
              googleId: profile?.sub, // Store Google ID
              lastLogin: new Date(),
            })
            
            await newUser.save()
            console.log('✅ New Google user created:', { 
              email: user.email, 
              id: newUser._id,
              googleId: profile?.sub 
            })
          } else {
            // Update existing user with Google info if needed
            console.log('🔄 Updating existing user...')
            let updated = false
            
            if (!existingUser.googleId) {
              existingUser.googleId = profile?.sub
              updated = true
              console.log('🔗 Linked existing user with Google ID')
            }
            
            if (user.image && existingUser.avatar !== user.image) {
              existingUser.avatar = user.image
              updated = true
              console.log('🖼️ Updated user avatar')
            }
            
            existingUser.lastLogin = new Date()
            updated = true
            
            if (updated) {
              await existingUser.save()
              console.log('✅ Existing user updated:', { email: user.email })
            } else {
              console.log('ℹ️ No updates needed for existing user')
            }
          }
          
          console.log('✅ Google sign in successful')
          return true
        } catch (error) {
          console.error('❌ Error during Google sign in:', error)
          
          // Log specific error details
          if (error instanceof Error) {
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name
            })
          }
          
          // Return false to prevent sign in
          return false
        }
      }
      
      console.log('✅ Non-Google sign in successful')
      return true
    },
    
    async jwt({ token, user, account, profile }: any) {
      console.log('🎫 NextAuth JWT callback:', { 
        hasUser: !!user, 
        hasAccount: !!account, 
        provider: account?.provider,
        tokenEmail: token.email
      })
      
      if (account?.provider === 'google' && user) {
        try {
          console.log('📡 Fetching user data for JWT...')
          await dbConnect()
          const dbUser = await User.findOne({ email: user.email }).select('-password')
          
          if (dbUser) {
            token.id = dbUser._id.toString()
            token.name = dbUser.name
            token.email = dbUser.email
            token.avatar = dbUser.avatar
            token.provider = 'google'
            token.googleId = dbUser.googleId
            console.log('✅ JWT token updated with user data:', { 
              email: user.email, 
              id: dbUser._id,
              name: dbUser.name 
            })
          } else {
            console.error('❌ User not found in database for JWT:', user.email)
          }
        } catch (error) {
          console.error('❌ Error fetching user in JWT callback:', error)
        }
      }
      
      return token
    },
    
    async session({ session, token }: any) {
      console.log('🔄 NextAuth session callback:', { 
        hasToken: !!token, 
        hasSession: !!session,
        tokenId: token.id,
        tokenEmail: token.email,
        tokenKeys: token ? Object.keys(token) : []
      })
      
      if (token) {
        // Ensure all user data is properly set
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.avatar = token.avatar as string
        session.user.provider = token.provider as string
        
        console.log('✅ Session updated with user data:', {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          provider: session.user.provider
        })
      } else {
        console.log('⚠️ No token available in session callback')
      }
      
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code: any, ...message: any[]) {
      console.error('❌ NextAuth Error:', code, ...message)
    },
    warn(code: any, ...message: any[]) {
      console.warn('⚠️ NextAuth Warning:', code, ...message)
    },
    debug(code: any, ...message: any[]) {
      console.log('🐛 NextAuth Debug:', code, ...message)
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 
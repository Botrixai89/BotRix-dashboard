import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/lib/auth'

// Check if Google OAuth credentials are configured
const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (!hasGoogleCredentials) {
  console.warn('⚠️ Google OAuth credentials not configured. Google sign-in will be disabled.');
}

const authOptions: NextAuthOptions = {
  providers: [
    ...(hasGoogleCredentials ? [
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
      })
    ] : []),
  ],
  callbacks: {
    async signIn({ user, account, profile, email }: any) {
      const emailAddr = user?.email ?? profile?.email ?? email?.email
      console.log('🔐 NextAuth signIn callback triggered:', {
        provider: account?.provider,
        email: emailAddr,
        profileId: profile?.sub,
        hasProfile: !!profile,
        hasAccount: !!account
      })

      if (account?.provider === 'google') {
        if (!emailAddr) {
          console.error('❌ Google sign in: no email in user or profile')
          return false
        }
        const displayName = user?.name ?? profile?.name ?? profile?.email ?? emailAddr
        try {
          console.log('📡 Connecting to database...')
          await dbConnect()
          console.log('✅ Database connected successfully')

          const existingUser = await User.findOne({
            $or: [{ email: emailAddr }, { googleId: profile?.sub }]
          })
          console.log('🔍 Existing user check:', {
            exists: !!existingUser,
            email: emailAddr,
            userId: existingUser?._id
          })

          if (!existingUser) {
            console.log('👤 Creating new Google user...')
            const newUser = new User({
              email: emailAddr,
              name: displayName,
              avatar: user?.image ?? profile?.picture ?? null,
              googleId: profile?.sub ?? null,
              lastLogin: new Date()
            })

            await newUser.save()
            console.log('✅ New Google user created:', {
              email: emailAddr,
              id: newUser._id,
              googleId: profile?.sub
            })
          } else {
            console.log('🔄 Updating existing user...')
            let updated = false

            if (profile?.sub && !existingUser.googleId) {
              existingUser.googleId = profile.sub
              updated = true
              console.log('🔗 Linked existing user with Google ID')
            }

            if (user?.image && existingUser.avatar !== user.image) {
              existingUser.avatar = user.image
              updated = true
              console.log('🖼️ Updated user avatar')
            }

            existingUser.lastLogin = new Date()
            updated = true

            if (updated) {
              await existingUser.save()
              console.log('✅ Existing user updated:', { email: emailAddr })
            } else {
              console.log('ℹ️ No updates needed for existing user')
            }
          }

          console.log('✅ Google sign in successful')
          return true
        } catch (error) {
          console.error('❌ Error during Google sign in:', error)

          if (error instanceof Error) {
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name
            })
          }
          if (error && typeof (error as any).code !== 'undefined') {
            console.error('MongoDB/code:', (error as any).code)
          }

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
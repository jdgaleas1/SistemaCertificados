import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8001"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
        name: "credentials",
        credentials: {
            email: { label: "Email", type: "email", placeholder: "user@email.com" },
            password: { label: "Password", type: "password" }
          },
        async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) {
                console.log("Missing credentials")
                return null
            }

            try {
                console.log("Attempting to authenticate with backend:", BACKEND_URL)
                
                // Authenticate with FastAPI backend
                const response = await fetch(`${BACKEND_URL}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                    }),
                })

                console.log("Backend response status:", response.status)

                if (!response.ok) {
                    const errorText = await response.text()
                    console.error("Backend error:", errorText)
                    return null
                }

                const data = await response.json()
                console.log("Authentication successful for user:", data.user.email)
                
                // Return user object that will be stored in the JWT
                return {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.nombre_completo,
                    role: data.user.rol,
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                }
            } catch (error) {
                console.error("Authentication error:", error)
                // Check if it's a connection error
                if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
                    console.error("Backend connection failed. Make sure the backend is running on", BACKEND_URL)
                }
                return null
            }
        },
    }),
  ],
  pages: {
    signIn: "/auth/login"
  },
  callbacks: {
    async jwt({ token, user }) {
        // Store user data in JWT token
        if (user) {
            token.accessToken = user.accessToken
            token.refreshToken = user.refreshToken
            token.role = user.role
            token.id = user.id
        }
        return token
    },
    async session({ session, token }) {
        // Send properties to the client
        session.accessToken = token.accessToken
        session.refreshToken = token.refreshToken
        session.user.role = token.role
        session.user.id = token.id
        return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful login
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }
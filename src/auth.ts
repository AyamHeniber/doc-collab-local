import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'owner' | 'editor' | 'viewer';
    } & DefaultSession['user'];
  }
  interface User {
    role?: 'owner' | 'editor' | 'viewer';
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Mock Login',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'owner@example.com' },
        name: { label: 'Name', type: 'text', placeholder: 'John Doe' },
        role: { label: 'Role', type: 'text', placeholder: 'owner' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email as string;
        const name = (credentials.name as string) || 'Test User';
        const roleInput = (credentials.role as string) || 'viewer';
        const role = (['owner', 'editor', 'viewer'].includes(roleInput) ? roleInput : 'viewer') as 'owner' | 'editor' | 'viewer';

        try {
          // Check if user exists in the database
          const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (!existingUser) {
            // Upsert the user automatically on credentials login for local testing convenience
            await db.insert(users).values({
              id: email, // simple unique ID
              email,
              name,
              role,
            });
          } else if (existingUser.role !== role || existingUser.name !== name) {
            // Update role/name if modified in form
            await db.update(users).set({ name, role }).where(eq(users.email, email));
          }

          return {
            id: email,
            name,
            email,
            role,
          };
        } catch (error) {
          console.error('Auth DB Upsert Error, proceeding with fallback mock user:', error);
          // Fallback if database is not active yet (resilient flow)
          return {
            id: email,
            name,
            email,
            role,
          };
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'viewer';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as 'owner' | 'editor' | 'viewer') || 'viewer';
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
});

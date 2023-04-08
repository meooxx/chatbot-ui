import NextAuth, { Session } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';

import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { compare } from 'bcrypt';
import { JWT } from 'next-auth/jwt';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      type: 'credentials',
      id: 'credentials',
      name: 'credentials',
      credentials: {
        username: { label: 'username', type: 'text' },
        pwd: { label: 'PWD', type: 'password' },
      },
      // @ts-ignore
      async authorize(credentials = {}, req) {
        const { username, pwd } = credentials;
        if (!username || !pwd) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: {
            username,
          },
        });

        // if user doesn't exist or password doesn't match
        if (!user || !(await compare(`${pwd}${pwd}`, user.pwd))) {
          return null;
        }
        return user;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.user = user;
        return token;
      }
      return token;
    },
    // @ts-expect-error
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & {
        user: {
          username?: string;
          id?: string;
        };
      };
    }) {
      // @ts-expect-error
      session.accessToken = token.sub;
      session.user = {
        // @ts-expect-error
        username: token.user.username,
        userId: token.user.id,
      };
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  debug: process.env.NODE_ENV !== 'production',
};
export default NextAuth(authOptions);

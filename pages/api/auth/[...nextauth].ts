import NextAuth, { Session } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';

import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { compare } from 'bcrypt';
import { JWT } from 'next-auth/jwt';
type User = {
  username?: string;
  userId?: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      type: 'credentials',
      name: '',
      credentials: {
        username: { label: 'username', type: 'text' },
        pwd: { label: 'PWD', type: 'password' },
      },
      // @ts-ignore
      async authorize(credentials = {}, req) {
        const { username, pwd } = credentials;
        if (!username || !pwd) {
          throw new Error('Missing username or password');
        }
        const user = await prisma.user.findUnique({
          where: {
            username,
          },
        });

        // if user doesn't exist or password doesn't match
        if (!user || !(await compare(`${pwd}${pwd}`, user.pwd))) {
          throw {
            message: 'Invalid username or password',
          };
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
      session.accessToken = token.sub;
      session.user = {
        username: token.user.username,
        userId: token.user.id,
      };
      return session;
    },
  },
};
export default NextAuth(authOptions);

import type { DefaultUser, Session as DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';
declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface User extends DefaultUser {
    username: string;
    id: string;
  }
  interface Session {
    user?: User;
  }
}

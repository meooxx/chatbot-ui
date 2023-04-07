import { withAuth } from 'next-auth/middleware';
import { NextResponse, NextMiddleware } from 'next/server';

// export const config = {
//   matcher: ['/api/chat', '/api/models'],
// };
const authFn = withAuth({
  callbacks: {
    async authorized({ req, token }) {
      try {
        if (token) return true;
        const json = (await req.json().catch((e) => {
          console.log(e);
        })) as {
          key: string;
        };
        if (json?.key) return true; // If there is a token, the user is authenticated
      } catch (e) {
        console.log(e, 'parse token');
      }
      return false;
    },
  },
});
const middleware = async (...args: Parameters<NextMiddleware>) => {
  const [request] = args;

  const host = request.headers.get('host') as string;
  // redirect to the host in config
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes(host)) {
    return NextResponse.redirect(process.env.NEXTAUTH_URL);
  }
  const urlObj = new URL(request.nextUrl);
  if (urlObj.pathname.startsWith('/api')) {
    // @ts-expect-error
    return await authFn(...args);
  }
  return NextResponse.next();
};
export default middleware;

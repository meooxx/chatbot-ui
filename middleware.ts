import { withAuth } from 'next-auth/middleware';

export const config = {
  matcher: ['/api/chat', '/api/models'],
};

export default withAuth({
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

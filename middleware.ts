import { withAuth } from 'next-auth/middleware';

export const config = {
  matcher: ['/api/chat', '/api/models'],
};

export default withAuth({
  callbacks: {
    async authorized({ req, token }) {
      
      try {
        const { key } = (await req.json()) as {
          key: string;
        };
        if (token || key) return true; // If there is a token, the user is authenticated
      } catch (e) {
        console.log(e);
      }

      return false;
    },
  },
});

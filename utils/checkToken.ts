import { NextApiRequest } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';
type Token = {
  user: {
    id: string;
    username: string;
    pwd: string;
  };
};
import { User } from 'next-auth';
export const checkToken = async (
  req: NextApiRequest,
): Promise<[true, User] | [false]> => {
  const token = (await getToken({ req })) as Token;

  const userId = token.user.id;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (user && user?.id == token.user.id && user?.pwd == token.user.pwd) {
    return [true, user];
  }
  return [false];
};

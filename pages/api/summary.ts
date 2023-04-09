import { ChatBody, Message } from '@/types/chat';
import { OpenAIError } from '@/utils/server';
import { PythonShell } from 'python-shell';
import { encode } from 'gpt-3-encoder';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import type { Balance } from '@prisma/client';
import { checkToken } from '@/utils/checkToken';
import { User } from 'next-auth';
export const config = {};
const handler = async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<Response | void> => {
  let balance: Balance | null = null;
  let user: User | null = null;
  try {
    const { model, messages, key, prompt } = req.body as ChatBody;
    if (!key) {
      const [valid, u] = await checkToken(req);
      if (!valid) {
        res.status(401);
        res.end();
        return;
      }
      balance = await prisma.balance.findUnique({
        where: { userId: u.id },
      });
      user = u;
    }

    // role name + every reply is primed with <im_start>assistant
    let tokenCount = 4 + 2;
    let messagesToSend: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = encode(message.content);
      tokenCount += tokens.length;
      if (tokenCount + 1000 > model.maxLength) {
        break;
      }
      messagesToSend = [message].concat(messagesToSend);
      if (message.isSummary) {
        break;
      }
    }
    if (!key) {
      if (tokenCount > (balance?.amount || 0)) {
        res.status(403);
        res.end(`还剩${balance?.amount || 0}, 不够本次${tokenCount}消耗`);
        return;
      }
    }

    if (tokenCount >= 1000) {
      type MessageItem = [{ input: string }, { output: string }];
      const messageData: MessageItem[] = [];

      for (let msgIndex = 0; msgIndex < messages.length - 1; msgIndex++) {
        const item: MessageItem = [
          { input: messages[msgIndex++].content },
          { output: '' },
        ];

        if (messages[msgIndex].role !== 'user') {
          item[1] = { output: messages[msgIndex].content };
        }

        messageData.push(item);
      }

      const summary = await new Promise<string>((resolve, reject) => {
        const text = <Buffer[]>[];
        let pyshell = new PythonShell('./lib/main.py', {
          // mode: 'binary',
          pythonPath: 'python3',
          encoding: 'utf8',
        });
        pyshell.send(JSON.stringify(messageData));
        pyshell.on('message', function (message) {
          text.push(message);
        });

        pyshell.end(function (err, code, signal) {
          if (err) reject(err);
          console.log('The exit code was: ' + code);
          console.log('The exit signal was: ' + signal);
          resolve(text.join(''));
        });
      });
      res.send({ ok: true, summary });
    } else {
      res.send({ ok: false });
    }

    if (!key) {
      await prisma.$transaction([
        prisma.balance.update({
          where: { userId: user?.id },
          data: { amount: { decrement: tokenCount } },
        }),
      ]);
    }
    return;
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      // return new Response('Error', { status: 500, statusText: error.message });
      res.status(500).end(error.message);
    } else {
      res.status(500).end('Error');
    }
  }
};

export default handler;

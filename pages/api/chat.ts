import { ChatBody, Message } from '@/types/chat';
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';
// import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
// import {
// Tiktoken,
// init
// } from '@dqbd/tiktoken/lite/init';
// const { Tiktoken } = require('@dqbd/tiktoken/lite');
// const { load } = require('@dqbd/tiktoken/load');
// const registry = require('@dqbd/tiktoken/registry.json');
// const models = require('@dqbd/tiktoken/model_to_encoding.json');
const { encode, decode } = require('gpt-3-encoder');

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
//// @ts-expect-error
// import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';
import { getToken } from 'next-auth/jwt';
import type { Balance } from '@prisma/client';

export const config = {};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<Response | void> => {
  type Token = {
    user: {
      id: string;
    };
  };
  let balance: Balance | null = null;
  let token: Token | null = null;
  try {
    const { model, messages, key, prompt } = req.body as ChatBody;
    if (!key) {
      token = (await getToken({ req })) as Token;

      const userId = token.user.id;
      balance = await prisma.balance.findUnique({
        where: { userId },
      });
    }

    // await init((imports) => WebAssembly.instantiate(wasm, imports));
    // const tiktokenModel = await load(registry[models['gpt-3.5-turbo']]);
    // const encoding = new Tiktoken(
    //   tiktokenModel.bpe_ranks,
    //   tiktokenModel.special_tokens,
    //   tiktokenModel.pat_str,
    // );

    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }

    const prompt_tokens = encode(promptToSend);

    let tokenCount = prompt_tokens.length;
    let messagesToSend: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = encode(message.content);
      if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
        break;
      }
      tokenCount += tokens.length;
      messagesToSend = [message, ...messagesToSend];
    }
    if (!key) {
      if (tokenCount > (balance?.amount || 0)) {
        res.status(403);
        res.end('对不起您的token消耗完毕');
      }
      return;
    }

    const readstream = await OpenAIStream(
      model,
      promptToSend,
      key,
      messagesToSend,
    );
    if (!key) {
      await prisma.balance.update({
        where: {
          userId: token!.user.id,
        },
        data: {
          amount: balance!.amount - tokenCount,
        },
      });
    }

    for await (const chunk of readstream.values()) {
      const bf = Buffer.from(chunk);
      res.write(bf);
    }
    res.end();
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      // return new Response('Error', { status: 500, statusText: error.message });
      res.status(500).end('Error');
    } else {
      res.status(500).end('Error');
    }
  }
};

export default handler;

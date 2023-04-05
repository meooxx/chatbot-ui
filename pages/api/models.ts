import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai';
import { OPENAI_API_HOST } from '@/utils/app/const';
import baseFetchOptions from '@/utils/proxy';
import { NextApiResponse } from 'next';
import fetch from 'node-fetch';
export const config = {
  // runtime: 'edge',
};

const handler = async (
  req: Request,
  res: NextApiResponse,
): Promise<NextApiResponse | void> => {
  try {
    const { key } = req.body as unknown as {
      key: string;
    };

    const response = await fetch(`${OPENAI_API_HOST}/v1/models`, {
      ...baseFetchOptions,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`,
        ...(process.env.OPENAI_ORGANIZATION && {
          'OpenAI-Organization': process.env.OPENAI_ORGANIZATION,
        }),
      },
    }).catch((e) => {
      res.status(500).end(e);
      return;
    });
    if (response?.status === 401) {
      return res.status(500).end(response.body);
    } else if (response?.status !== 200) {
      console.error(
        `OpenAI API returned an error ${
          response?.status
        }: ${await response?.text()}`,
      );
      throw new Error('OpenAI API returned an error');
    }

    const json = (await response.json()) as {
      data: (OpenAIModel | undefined)[];
    };

    const models: OpenAIModel[] = json.data
      .map((model: any) => {
        for (const [key, value] of Object.entries(OpenAIModelID)) {
          if (value === model.id) {
            return {
              id: model.id,
              name: OpenAIModels[value].name,
            };
          }
        }
      })
      .filter(Boolean);
    res.status(200).json(models);
  } catch (error) {
    console.error(error);
    return res.status(500).end('Error');
  }
};

export default handler;

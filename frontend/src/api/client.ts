// APIクライアント設定

import ky from 'ky';

export const api = ky.create({
  prefixUrl: '/api',
  timeout: 30000,
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response) {
          try {
            const body = await response.json() as { error?: { message?: string } };
            if (body.error?.message) {
              error.message = body.error.message;
            }
          } catch {
            // JSONパースエラーは無視
          }
        }
        return error;
      },
    ],
  },
});


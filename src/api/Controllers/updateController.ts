import { Request, Response } from 'express';

export default async function updateController(req: Request, res: Response): Promise<void> {
  if (!req.user || req.isUnauthenticated() || !req.user.guilds || !req.user.refreshToken) {
    res.status(401).json({ status: 401 });
  } else {
    (await import('../index.js')).passportOAuth2Refresh.requestNewAccessToken(
      'discord',
      req.user.refreshToken,
      (err, accessToken, refreshToken) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ status: 500 });
        }
        req.user!.accessToken = accessToken;
        req.user!.refreshToken = refreshToken;
        return res.json({ status: 200 });
      }
    );
  }
}

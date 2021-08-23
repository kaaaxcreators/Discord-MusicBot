import { Request, Response } from 'express';

export default async function serversController(req: Request, res: Response): Promise<void> {
  const { config } = await import('../../index');
  res.render('servers', {
    locale: config.LOCALE,
    filename: 'servers',
    title: 'Servers | Discord Music Bot'
  });
}

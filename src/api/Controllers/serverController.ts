import { Request, Response } from 'express';

export default async function serverController(req: Request, res: Response): Promise<void> {
  if (!req.user!.guilds!.find((x) => x.id == req.params.id)) {
    return res.redirect('/servers');
  }
  const { config } = await import('../../index.js');
  res.render('server', {
    locale: config.LOCALE,
    filename: 'server',
    title: 'Server | Discord Music Bot',
    socket: true,
    csrf: req.session.csrf
  });
}

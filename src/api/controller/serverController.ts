import { Request, Response } from 'express';

import { config } from '../../index';

export default function serverController(req: Request, res: Response): void {
  if (!req.user!.guilds!.find((x) => x.id == req.params.id)) {
    return res.redirect('/servers');
  }
  res.render('server', {
    locale: config.LOCALE,
    filename: 'server',
    title: 'Server | Discord Music Bot',
    socket: true,
    csrf: req.session.csrf
  });
}

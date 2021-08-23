import { Request, Response } from 'express';

import { config } from '../../index';

export default function serversController(req: Request, res: Response): void {
  res.render('servers', {
    locale: config.LOCALE,
    filename: 'servers',
    title: 'Servers | Discord Music Bot'
  });
}

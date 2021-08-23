import { Request, Response } from 'express';

import { config } from '../../index';

export default function dashboardController(req: Request, res: Response): void {
  res.render('dashboard', {
    lang: config.LOCALE,
    filename: 'dashboard',
    title: 'Dashboard | Discord Music Bot',
    socket: true
  });
}

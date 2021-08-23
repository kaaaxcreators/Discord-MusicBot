import { Request, Response } from 'express';

import { config } from '../../index';

export default function NotFoundController(req: Request, res: Response): void {
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', { layout: false, lang: config.LOCALE, title: '404' });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.json({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
}

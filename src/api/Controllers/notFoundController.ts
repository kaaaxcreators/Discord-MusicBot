import { Request, Response } from 'express';

export default async function NotFoundController(req: Request, res: Response): Promise<void> {
  const { config } = await import('../../index.js');
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

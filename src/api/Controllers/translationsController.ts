import { Request, Response } from 'express';
import i18next from 'i18next';

export default async function translationsController(req: Request, res: Response): Promise<void> {
  const { config } = await import('../../index.js');
  res.send({
    translations: i18next.getDataByLanguage(config.LOCALE)?.translation
  });
}

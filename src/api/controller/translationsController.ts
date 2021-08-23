import { Request, Response } from 'express';
import i18next from 'i18next';

import { config } from '../../index';

export default function translationsController(req: Request, res: Response): void {
  res.send({
    translations: i18next.getDataByLanguage(config.LOCALE)?.translation
  });
}

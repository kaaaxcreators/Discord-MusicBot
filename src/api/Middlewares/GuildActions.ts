import { NextFunction, Request, Response } from 'express';

import { config } from '../../index';

/**
 * Check if Guild Actions are enabled
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 */
const GuildActions = (req: Request, res: Response, next: NextFunction): void => {
  if (config.GUILDACTIONS) {
    next();
  } else {
    res.status(403).send('Guild Actions are disabled');
  }
};

export default GuildActions;

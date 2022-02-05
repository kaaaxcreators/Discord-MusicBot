import { NextFunction, Request, Response } from 'express';

import { config } from '../../index.js';

/**
 * Check if User is logged in
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 */
const Auth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.isUnauthenticated()) {
    return res.redirect(config.CALLBACK);
  } else {
    next();
  }
};

export default Auth;

import { randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Generate CSRF Token
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 */
const CSRF = (req: Request, res: Response, next: NextFunction): void => {
  // Generate CSRF Token if not present
  if (req.session.csrf === undefined) {
    req.session.csrf = randomBytes(100).toString('base64');
  }
  next();
};

export default CSRF;

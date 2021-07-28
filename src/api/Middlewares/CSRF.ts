import { randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Generate CSRF Token
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 */
const Generate = (req: Request, res: Response, next: NextFunction): void => {
  // Generate CSRF Token if not present
  if (req.session.csrf === undefined) {
    req.session.csrf = randomBytes(100).toString('base64');
  }
  next();
};

const Verify = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.query.csrf) {
    res.status(400).json({ status: 400, error: 'CSRF Token missing' });
  } else if (req.query.csrf !== req.session.csrf) {
    res.status(403).json({ status: 403, error: 'CSRF Token invalid' });
  } else {
    next();
  }
};

export { Generate, Verify };

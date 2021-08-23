import { Request, Response } from 'express';

export default function logoutController(req: Request, res: Response): void {
  if (req.user) {
    req.logout();
  }
  res.redirect('/');
}

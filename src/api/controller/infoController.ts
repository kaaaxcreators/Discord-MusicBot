import { Request, Response } from 'express';

import { client, config } from '../../index';

export default function infoController(req: Request, res: Response): void {
  res.send({
    ClientID: client.user?.id,
    Permissions: config.PERMISSION,
    Scopes: config.SCOPES,
    Website: config.WEBSITE,
    CallbackURL: config.CALLBACK,
    GuildActions: config.GUILDACTIONS
  });
}

import { Request, Response } from 'express';

export default async function infoController(req: Request, res: Response): Promise<void> {
  const { client, config } = await import('../../index.js');
  res.send({
    ClientID: client.user?.id,
    Permissions: config.PERMISSION,
    Scopes: config.SCOPES,
    Website: config.WEBSITE,
    CallbackURL: config.CALLBACK,
    GuildActions: config.GUILDACTIONS
  });
}

import { Request, Response } from 'express';

import { client, commands, config } from '../../index';

export default function MainController(req: Request, res: Response): void {
  const Commands = Array.from(commands.mapValues((value) => value.info).values());

  const url = `https://discord.com/oauth2/authorize?client_id=${client.user?.id}&permissions=${
    config.PERMISSION
  }&scope=${config.SCOPES.join('%20')}&redirect_uri=${config.WEBSITE}${
    config.CALLBACK
  }&response_type=code`;

  res.render('main', {
    lang: config.LOCALE,
    filename: 'main',
    title: 'Discord Music Bot',
    url: url,
    commands: Commands.filter((v) => !v.hidden)
  });
}

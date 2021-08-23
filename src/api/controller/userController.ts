import { User } from '@oauth-everything/passport-discord/dist/ApiData';
import { Permissions } from 'discord.js';
import DiscordOauth2 from 'discord-oauth2';
import { Request, Response } from 'express';

import { client, config } from '../../index';

const oauth = new DiscordOauth2();

export default async function userController(req: Request, res: Response): Promise<unknown> {
  if (!req.user) {
    return res.send({});
  }
  // Update every 5 Minutes or if lastUpdated doesnt exist
  if (
    !req.user.lastUpdated ||
    diff_minutes(new Date().toUTCString(), req.user.lastUpdated) >= config.UPDATEDIFF
  ) {
    const userGuilds = await oauth.getUserGuilds(req.user.accessToken!);
    req.user.guilds = userGuilds;
    req.user.lastUpdated = new Date().toUTCString();
    req.user!.guilds!.map((g) => {
      g.hasPerms = !!(
        g.permissions && new Permissions(BigInt(g.permissions)).has('MANAGE_GUILD', true)
      );
      g.inGuild = client.guilds.cache.has(g.id);
      return g;
    });
  }
  const merged = { ...req.user, ...(<User>req.user._json) };
  res.send({ user: merged });
}

/**
 * Calculate Difference in Minutes of two UTC Strings
 * @author <https://www.w3resource.com/javascript-exercises/javascript-date-exercise-44.php> - Modified
 */
function diff_minutes(dt2: string, dt1: string) {
  let diff = (Date.parse(dt2) - Date.parse(dt1)) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

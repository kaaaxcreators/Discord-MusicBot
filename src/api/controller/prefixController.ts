import { Request, Response } from 'express';

import { config } from '../../index';
import database, { getGuild } from '../../util/database';

export default async function prefixController(req: Request, res: Response): Promise<unknown> {
  const { prefix, id } = req.params;
  const guildDB = await getGuild(id);
  // Check if valid request
  if (
    typeof prefix !== 'string' ||
    typeof Number.parseInt(id) !== 'number' ||
    isNaN(Number.parseInt(id))
  ) {
    return res.status(400).json({ status: 400 });
  } else if (!req.user || req.isUnauthenticated() || !req.user.guilds) {
    res.status(401).json({ status: 401 });
  } else if (
    // check if is in guild and has perms and guild prefix is enabled
    (req.user.guilds
      .map((guildInfo) => ({
        id: guildInfo.id,
        hasPerms: guildInfo.hasPerms
      }))
      .find((arr) => arr.id == id) &&
      !req.user.guilds
        .map((guildInfo) => ({
          id: guildInfo.id,
          hasPerms: guildInfo.hasPerms
        }))
        .find((arr) => arr.id == id)!.hasPerms) ||
    !config.GUILDPREFIX
  ) {
    res.status(403).json({ status: 403 });
  } else if (!guildDB) {
    res.status(500).json({ status: 500 });
  } else if (prefix == guildDB.prefix) {
    res.status(304).json({ status: 304 });
  } else {
    database.set(id, { prefix: prefix });
    return res.json({ prefix: prefix });
  }
}

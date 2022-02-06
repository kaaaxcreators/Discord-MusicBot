import { Request, Response } from 'express';

export default async function prefixController(req: Request, res: Response): Promise<void> {
  const { prefix, id } = req.params;
  const { default: database, getGuild } = await import('../../util/database');
  const guildDB = await getGuild(id);
  const { config } = await import('../../index');
  // Check if valid request
  if (
    typeof prefix !== 'string' ||
    typeof Number.parseInt(id) !== 'number' ||
    isNaN(Number.parseInt(id))
  ) {
    res.status(400).json({ status: 400 });
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
    await database.set(id, { prefix: prefix });
    res.json({ prefix: prefix });
  }
}

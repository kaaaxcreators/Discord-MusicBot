import { Request, Response } from 'express';

export default async function skipController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (
    typeof id !== 'string' ||
    typeof Number.parseInt(id) !== 'number' ||
    isNaN(Number.parseInt(id))
  ) {
    res.status(400).json({ status: 400 });
  } else if (!req.user || req.isUnauthenticated() || !req.user.guilds) {
    res.status(401).json({ status: 401 });
  } else if (
    // check if is in guild
    !req.user.guilds
      .map((guildInfo) => ({
        id: guildInfo.id,
        hasPerms: guildInfo.hasPerms
      }))
      .find((arr) => arr.id == id)
  ) {
    res.status(403).json({ status: 403 });
  } else {
    const serverQueue = (await import('../../index.js')).queue.get(id);
    if (serverQueue && serverQueue.voiceConnection && serverQueue.audioPlayer) {
      try {
        serverQueue.skip();
      } catch {
        serverQueue.voiceChannel.guild.me?.voice.disconnect();
        (await import('../../index.js')).queue.delete(id);
      }
    } else {
      res.status(501).json({ status: 501 });
    }
  }
}

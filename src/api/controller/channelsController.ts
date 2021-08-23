import { Request, Response } from 'express';

export default async function channelsController(req: Request, res: Response): Promise<void> {
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
    const client = (await import('../../index')).client;
    const guild = client.guilds.cache.get(id) || (await client.guilds.fetch(id));
    const user = guild.members.cache.get(req.user.id) || (await guild.members.fetch(req.user.id)!);
    const channels = guild.channels.cache!;
    const currentVoiceChannel = user.voice.channel;
    const textChannels = channels
      ?.filter(
        (channel) =>
          channel.type == 'GUILD_TEXT' &&
          !!channel.permissionsFor(user) &&
          channel.permissionsFor(user)!.has('SEND_MESSAGES')
      )
      .map((v) => ({ id: v.id, name: v.name }));
    const voiceChannels = channels
      ?.filter(
        (channel) =>
          channel.type == 'GUILD_VOICE' &&
          !!channel.permissionsFor(user) &&
          channel.permissionsFor(user)!.has('SPEAK')
      )
      .map((v) => ({ id: v.id, name: v.name }));
    res.json({
      status: 200,
      channels: textChannels?.concat(voiceChannels),
      textChannels,
      voiceChannels,
      currentVoiceChannel
    });
  }
}

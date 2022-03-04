import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { MessageEmbed, TextChannel, VoiceChannel } from 'discord.js';
import { Request, Response } from 'express';
import i18next from 'i18next';
import pMS from 'pretty-ms';

import sendError from '../../util/error';
import { MusicSubscription, Track } from '../../util/Music';

export default async function songController(req: Request, res: Response): Promise<void> {
  const { id, song } = req.params;
  const vchannel = <string>req.query.vchannel;
  const mchannel = <string>req.query.mchannel;
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
    let subscription = (await import('../../index.js')).queue.get(id);
    const { Stats, client } = await import('../../index.js');
    const user = await client.users.fetch(req.user.id);
    const Song = await Track.from(
      [escapeRegExp(song)],
      { author: user },
      {
        onStart(info) {
          const embed = new MessageEmbed()
            .setAuthor({
              name: i18next.t('music.started'),
              iconURL:
                'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
            })
            .setThumbnail(info.img)
            .setColor('BLUE')
            .addField(i18next.t('music.name'), `[${info.title}](${info.url})`, true)
            .addField(
              i18next.t('music.duration'),
              info.live
                ? i18next.t('nowplaying.live')
                : pMS(info.duration, { secondsDecimalDigits: 0 }),
              true
            )
            .addField(i18next.t('music.request'), info.req.tag, true)
            .setFooter({ text: `${i18next.t('music.views')} ${info.views} | ${info.ago}` });
          subscription!.textChannel.send({ embeds: [embed] });
        },
        onFinish() {
          Stats.songsPlayed++;
        },
        onError(error) {
          console.error(error);
          return sendError(error.message, subscription!.textChannel);
        }
      }
    );
    if (subscription) {
      subscription.enqueue(Song);
      const embed = new MessageEmbed()
        .setAuthor({
          name: 'Song has been added to queue from Dashboard',
          iconURL:
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        })
        .setThumbnail(Song.img!)
        .setColor('YELLOW')
        .addField(i18next.t('play.embed.name'), `[${Song.title}](${Song.url})`, true)
        .addField(
          i18next.t('play.embed.duration'),
          Song.live
            ? i18next.t('nowplaying.live')
            : pMS(Song.duration, { secondsDecimalDigits: 0 }),
          true
        )
        .addField(i18next.t('play.embed.request'), Song.req.tag, true)
        .setFooter({ text: `${i18next.t('play.embed.views')} ${Song.views} | ${Song.ago}` });
      subscription.textChannel.send({ embeds: [embed] });
      res.json(Song);
    } else {
      if (mchannel && vchannel) {
        const textChannel =
          <TextChannel>client.channels.cache.get(mchannel) ||
          <TextChannel>await client.channels.fetch(mchannel);
        const voiceChannel =
          <VoiceChannel>client.channels.cache.get(vchannel) ||
          <VoiceChannel>await client.channels.fetch(vchannel);
        const guildMember =
          client.guilds.cache.get(id)?.members.cache.get(user.id) ||
          (await (await client.guilds.fetch(id)).members.fetch(user.id));
        if (!guildMember) {
          return void res.status(401).json({ status: 401 });
        }
        if (
          // check if channels are valid and if user has perms
          textChannel?.type === 'GUILD_TEXT' &&
          voiceChannel?.type === 'GUILD_VOICE' &&
          textChannel.permissionsFor(guildMember)?.has('SEND_MESSAGES') &&
          voiceChannel.permissionsFor(guildMember)?.has('SPEAK')
        ) {
          subscription = new MusicSubscription(
            joinVoiceChannel({
              channelId: voiceChannel.id,
              guildId: id,
              adapterCreator: guildMember.guild.voiceAdapterCreator
            }),
            voiceChannel,
            textChannel
          );
          subscription.voiceConnection.on('error', (error) => {
            console.warn(error);
          });
          (await import('../../index.js')).queue.set(id, subscription);
          subscription.enqueue(Song);
          try {
            await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 10e3);
          } catch (error) {
            console.error(error);
            return void res
              .status(500)
              .json({ status: 'Failed to Join the Voice Channel within 10 seconds' });
          }
          res.json({ status: 200 });
        } else {
          res.status(400).json({ status: 400 });
        }
      } else {
        res.status(400).json({ status: 400 });
      }
    }
  }
}

/**
 * Escape Regex String
 * @author <https://stackoverflow.com/a/3561711> - Modified
 */
function escapeRegExp(string: string) {
  return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
}

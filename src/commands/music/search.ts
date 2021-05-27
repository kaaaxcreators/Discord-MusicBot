import { Client, Collection, Message, MessageEmbed, MessageEmbedOptions, Util } from 'discord.js';
import i18n from 'i18n';
import pMS from 'pretty-ms';
import YouTube, { Video } from 'youtube-sr';

import { Command, config, IQueue, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';
import play, { Song } from '../../util/playing';
module.exports = {
  info: {
    name: 'search',
    description: i18n.__('search.description'),
    usage: i18n.__('search.usage'),
    aliases: ['sc'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'CONNECT', 'SPEAK'],
      member: []
    }
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const channel = message.member!.voice.channel!;
    if (!channel) return sendError(i18n.__('error.needvc'), message.channel);

    const searchString = args.join(' ');
    if (!searchString) return sendError(i18n.__('search.missingargs'), message.channel);

    const serverQueue = queue.get(message.guild!.id);
    let response: Collection<string, Message> = new Collection<string, Message>();
    let video: Video;
    try {
      const searchtext = await message.channel.send({
        embed: { description: ':mag: Searching...' } as MessageEmbedOptions
      });
      const searched = await YouTube.search(searchString, { limit: 10, type: 'video' });
      if (searched[0] == undefined) return sendError(i18n.__('search.notfound'), message.channel);
      let index = 0;
      const embed = new MessageEmbed()
        .setColor('BLUE')
        .setAuthor(
          i18n.__mf('search.result.author', { args: args.join(' ') }),
          message.author.displayAvatarURL()
        )
        .setDescription(
          `${searched
            .map(
              (video) =>
                `**\`${++index}\`  |** [\`${video.title}\`](${video.url}) - \`${
                  video.durationFormatted
                }\``
            )
            .join('\n')}`
        )
        .setFooter(i18n.__('search.result.footer'));
      (searchtext.editable ? searchtext.edit(embed) : message.channel.send(embed)).then((m) =>
        m.delete({ timeout: 15000 })
      );
      try {
        response = await message.channel.awaitMessages(
          (message) => message.content > 0 && message.content < 11,
          {
            max: 1,
            time: 20000,
            errors: ['time']
          }
        );
      } catch (err) {
        // console.error(err); spams console when user doesn't select anything
        return message.channel.send({
          embed: {
            color: 'RED',
            description: i18n.__('search.selected')
          }
        });
      }
      const videoIndex = parseInt(response.first()!.content);
      video = searched[videoIndex - 1];
    } catch (err) {
      console.error(err);
      return message.channel.send({
        embed: {
          color: 'RED',
          description: i18n.__('search.noresults')
        }
      });
    }

    const songInfo = video;

    const song: Song = {
      id: songInfo.id!,
      title: Util.escapeMarkdown(songInfo.title!),
      views: String(songInfo.views).padStart(10, ' ').trim(),
      ago: songInfo.uploadedAt!,
      duration: songInfo.duration,
      url: `https://www.youtube.com/watch?v=${songInfo.id}`,
      img: songInfo.thumbnail!.url!,
      req: message.author
    };

    if (serverQueue) {
      serverQueue.songs.push(song);
      const embed = new MessageEmbed()
        .setAuthor(
          i18n.__('play.embed.author'),
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setThumbnail(song.img)
        .setColor('YELLOW')
        .addField(i18n.__('play.embed.name'), `[${song.title}](${song.url})`, true)
        .addField(i18n.__('play.embed.duration'), pMS(song.duration), true)
        .addField(i18n.__('play.embed.request'), song.req.tag, true)
        .setFooter(`${i18n.__('play.embed.views')} ${song.views} | ${song.ago}`);
      return message.channel.send(embed);
    }

    const queueConstruct: IQueue = {
      textChannel: message.channel,
      voiceChannel: channel,
      connection: null,
      songs: [],
      volume: 80,
      playing: true,
      loop: false
    };
    queue.set(message.guild!.id, queueConstruct);
    queueConstruct.songs.push(song);

    try {
      const connection = await channel.join();
      queueConstruct.connection = connection;
      play.play(queueConstruct.songs[0], message);
    } catch (error) {
      console.error(`${i18n.__('error.join')} ${error}`);
      queue.delete(message.guild!.id);
      await channel.leave();
      return sendError(`${i18n.__('error.join')} ${error}`, message.channel);
    }
  }
} as Command;

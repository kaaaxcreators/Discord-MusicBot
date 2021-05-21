import { Client, Message, MessageEmbed } from 'discord.js';

import { Command, config, queue as Queue } from '../../index';
import sendError from '../../util/error';
import Util from '../../util/pagination';

module.exports = {
  info: {
    name: 'queue',
    description: 'To show the server songs queue',
    usage: '',
    aliases: ['q', 'list', 'songlist', 'song-list'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'ADD_REACTIONS'],
      member: []
    }
  },
  run: async function (client: Client, message: Message) {
    const queue = Queue.get(message.guild!.id);
    if (!queue) return sendError('There is nothing playing in this server.', message.channel);

    const que = queue.songs.map(
      (t, i) => `\`${++i}.\` | [\`${t.title}\`](${t.url}) - [<@${t.req.id}>]`
    );

    const chunked = Util.chunk(que, 10).map((x) => x.join('\n'));

    const embed = new MessageEmbed()
      .setAuthor(
        'Server Songs Queue',
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setThumbnail(message.guild!.iconURL()!)
      .setColor('BLUE')
      .setDescription(chunked[0])
      .addField('Now Playing', `[${queue.songs[0].title}](${queue.songs[0].url})`, true)
      .addField('Text Channel', queue.textChannel, true)
      .addField('Voice Channel', queue.voiceChannel, true)
      .setFooter(`Currently Server Volume is ${queue.volume} Page 1 of ${chunked.length}.`);
    if (queue.songs.length === 1)
      embed.setDescription(
        `No songs to play next add songs by \`\`${config.prefix}play <song_name>\`\``
      );

    try {
      const queueMsg = await message.channel.send(embed);
      if (chunked.length > 1) await Util.pagination(queueMsg, message.author, chunked);
    } catch (e) {
      message.channel.send(`An error occurred: ${e.message}.`);
    }
  }
} as Command;

import { Client, Message, MessageEmbed } from 'discord.js';

import { Command, queue } from '../../index';
import sendError from '../../util/error';
import { Song } from '../../util/playing';
import ProgressBar from '../../util/ProgressBar';

module.exports = {
  info: {
    name: 'nowplaying',
    description: 'Get music which is currently playing',
    usage: '',
    aliases: ['np'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue) return sendError('There is nothing playing in this server.', message.channel);
    const song: Song = serverQueue.songs[0];
    let Progress: Progress;
    if (song.live) {
      Progress = {
        Bar: '▇—▇—▇—▇—▇—',
        percentageText: 'LIVE'
      };
    } else {
      Progress = ProgressBar(serverQueue.connection!.dispatcher.streamTime, song.duration, 10);
    }
    const embed = new MessageEmbed()
      .setAuthor(
        'Now Playing',
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setThumbnail(song.img)
      .setColor('BLUE')
      .addField('Name', song.title, true)
      .addField('Progress', Progress.Bar, true)
      .addField('Percentage', Progress.percentageText, true)
      .addField('Requested by', song.req.tag, true)
      .setFooter(`Views: ${song.views} | ${song.ago}`);
    return message.channel.send(embed);
  }
} as Command;

export interface Progress {
  Bar: string;
  percentageText: string;
}

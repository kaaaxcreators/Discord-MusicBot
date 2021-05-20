import { Client, Message, MessageEmbed } from 'discord.js';

import { Command } from '../..';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'leave',
    aliases: ['goaway', 'disconnect'],
    description: 'Leave The Voice Channel!',
    usage: '',
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    const channel = message.member!.voice.channel;
    if (!channel)
      return sendError("I'm sorry but you need to be in a voice channel!", message.channel);
    if (!message.guild!.me!.voice.channel)
      return sendError('I Am Not In Any Voice Channel!', message.channel);

    try {
      await message.guild!.me!.voice.channel.leave();
    } catch (error) {
      await message.guild!.me!.voice.kick(message.guild!.me!.id);
      return sendError('Trying To Leave The Voice Channel...', message.channel);
    }

    const Embed = new MessageEmbed()
      .setAuthor(
        'Leave Voice Channel',
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('GREEN')
      .setTitle('Success')
      .setDescription('🎶 Left The Voice Channel.')
      .setTimestamp();

    return message.channel
      .send(Embed)
      .catch(() => message.channel.send('🎶 Left The Voice Channel :C'));
  }
} as Command;

import { Client, Message, MessageEmbed } from 'discord.js';

import { Command, config } from '../../index';

module.exports = {
  info: {
    name: 'count',
    description: 'See how many Servers the Bot is in',
    usage: '',
    aliases: ['servercount'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },
  run: async function (client: Client, message: Message) {
    const embed = new MessageEmbed()
      .setColor('YELLOW')
      .setDescription(`The Bot is currently in ${client.guilds.cache.size} Servers`)
      .setFooter(`Use ${config.prefix}invite to add/invite the Bot to your server`);
    return message.channel.send(embed);
  }
} as Command;

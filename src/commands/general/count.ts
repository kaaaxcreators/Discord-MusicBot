import { Client, Message, MessageEmbed } from 'discord.js';

import { config } from '../../index';

module.exports = {
  info: {
    name: 'count',
    description: 'See how many Servers the Bot is in',
    usage: '',
    aliases: ['servercount']
  },
  run: async function (client: Client, message: Message) {
    const count = new MessageEmbed()
      .setColor('YELLOW')
      .setDescription(`The Bot is currently in ${client.guilds.cache.size} Servers`)
      .setFooter(`Use ${config.prefix}invite to add/invite the Bot to your server`);
    return message.channel.send(count);
  }
};

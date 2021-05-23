import { Client, Message, MessageEmbed } from 'discord.js';

import { Command, config } from '../../index';

module.exports = {
  info: {
    name: 'ping',
    description: 'Get Network Information',
    usage: '',
    aliases: ['latency'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },
  run: async function (client: Client, message: Message) {
    return message.channel.send('Loading data').then(async (msg) => {
      msg.deletable ? msg.delete() : null;
      const embed = new MessageEmbed()
        .setColor('RANDOM')
        .setDescription(`Pong! 🏓`)
        .addField('Latency', msg.createdTimestamp - message.createdTimestamp + 'ms', true)
        .addField('WebSocket', Math.round(client.ws.ping) + 'ms', true)
        .setFooter(`Use ${config.prefix}invite to add/invite the Bot to your server`);
      message.channel.send(embed);
    });
  }
} as Command;

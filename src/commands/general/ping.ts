import { Client, Message, MessageEmbed } from 'discord.js';

import { config } from '../../index';

module.exports = {
  info: {
    name: 'ping',
    description: 'Pong!',
    usage: '',
    aliases: ['latency'],
    categorie: 'general'
  },
  run: async function (client: Client, message: Message) {
    return message.channel.send('Loading data').then(async (msg) => {
      msg.deletable ? msg.delete() : null;
      const ping = new MessageEmbed()
        .setColor('RANDOM')
        .setDescription(`Pong! 🏓`)
        .addField('Latency', msg.createdTimestamp - message.createdTimestamp + 'ms', true)
        .addField('WebSocket', Math.round(client.ws.ping) + 'ms', true)
        .setFooter(`Use ${config.prefix}invite to add/invite the Bot to your server`);
      message.channel.send(ping);
    });
  }
};

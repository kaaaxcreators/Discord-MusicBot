import { Client, Message, MessageEmbed } from 'discord.js';

import { Command } from '../..';

module.exports = {
  info: {
    name: 'invite',
    description: 'Add/invite the bot to your server',
    usage: '',
    aliases: ['inv'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    //set the permissions id here (https://discordapi.com/permissions.html)
    const permissions = 2205280320;

    const embed = new MessageEmbed()
      .setTitle(`Invite ${client.user!.username}`)
      .setDescription(
        `Want me in your server? Invite me today! \n\n [Invite Link](https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=${permissions}&scope=applications.commands%20bot)`
      )
      .setURL(
        `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=${permissions}&scope=applications.commands%20bot`
      )
      .setColor('BLUE');
    return message.channel.send(embed);
  }
} as Command;

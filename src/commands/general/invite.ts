import { Client, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, config } from '../../index';

module.exports = {
  info: {
    name: 'invite',
    description: i18next.t('invite.description'),
    usage: '',
    aliases: ['inv'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    let url: string;
    if (config.DISABLEWEB) {
      url = `https://discord.com/oauth2/authorize?client_id=${client.user!.id}&permissions=${
        config.PERMISSION
      }&scope=bot`;
    } else {
      url = `https://discord.com/oauth2/authorize?client_id=${client.user!.id}&permissions=${
        config.PERMISSION
      }&scope=bot%20${config.SCOPES.join('%20')}&redirect_url=${config.WEBSITE}${
        config.CALLBACK
      }&response_type=code`;
    }
    const embed = new MessageEmbed()
      .setTitle(`${i18next.t('invite.embed.title')} ${client.user!.username}`)
      .setDescription(i18next.t('invite.embed.description', { url: url }))
      .setURL(url)
      .setColor('BLUE');
    return message.channel.send(embed);
  }
} as Command;

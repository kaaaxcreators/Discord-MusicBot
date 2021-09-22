import { MessageEmbed } from 'discord.js';
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
  run: async function (client, message) {
    const url = generateURL(client.user!.id);
    const embed = new MessageEmbed()
      .setTitle(`${i18next.t('invite.embed.title')} ${client.user!.username}`)
      .setDescription(
        i18next.t('invite.embed.description', { url: url, interpolation: { escapeValue: false } })
      )
      .setURL(url)
      .setColor('BLUE');
    return message.channel.send({ embeds: [embed] });
  },
  interaction: {
    options: [],
    run: async function (client, interaction) {
      const url = generateURL(client.user!.id);
      const embed = new MessageEmbed()
        .setTitle(`${i18next.t('invite.embed.title')} ${client.user!.username}`)
        .setDescription(
          i18next.t('invite.embed.description', { url: url, interpolation: { escapeValue: false } })
        )
        .setURL(url)
        .setColor('BLUE');
      return interaction.reply({ embeds: [embed] });
    }
  }
} as Command;

/**
 * Generate Invite URL with our without Redirect URL
 * @param {string} clientID Discord Client ID
 * @returns {string} url The Discord Invite URL
 */
function generateURL(clientID: string): string {
  if (config.DISABLEWEB) {
    return `https://discord.com/oauth2/authorize?client_id=${clientID}&permissions=${
      config.PERMISSION
    }&scope=bot%20${config.SCOPES.join('%20')}`;
  } else {
    return `https://discord.com/oauth2/authorize?client_id=${clientID}&permissions=${
      config.PERMISSION
    }&scope=bot%20${config.SCOPES.join('%20')}&redirect_url=${config.WEBSITE}${
      config.CALLBACK
    }&response_type=code`;
  }
}

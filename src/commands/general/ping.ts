import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command } from '../../index.js';
import { getPrefix } from '../../util/database.js';

export default {
  info: {
    name: 'ping',
    description: i18next.t('ping.description'),
    usage: '',
    aliases: ['latency'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },
  run: async function (client, message) {
    return message.channel.send(i18next.t('ping.loading')!).then(async (msg) => {
      msg.deletable ? msg.delete() : null;
      const embed = new MessageEmbed()
        .setColor('RANDOM')
        .setDescription(i18next.t('ping.embed.description'))
        .addField(
          i18next.t('ping.embed.latency'),
          msg.createdTimestamp - message.createdTimestamp + 'ms',
          true
        )
        .addField('WebSocket', Math.round(client.ws.ping) + 'ms', true)
        .setFooter(i18next.t('ping.embed.footer', { prefix: await getPrefix(message) }));
      message.channel.send({ embeds: [embed] });
    });
  },
  interaction: {
    options: [],
    run: async function (client, interaction, { isMessage }) {
      const reply = await interaction.reply({
        content: i18next.t('ping.loading'),
        fetchReply: true
      });
      if (!isMessage(reply)) {
        return;
      }
      const embed = new MessageEmbed()
        .setColor('RANDOM')
        .setDescription(i18next.t('ping.embed.description'))
        .addField(
          i18next.t('ping.embed.latency'),
          reply.createdTimestamp - interaction.createdTimestamp + 'ms',
          true
        )
        .addField('WebSocket', Math.round(client.ws.ping) + 'ms', true)
        .setFooter(i18next.t('ping.embed.footer', { prefix: await getPrefix(interaction) }));
      interaction.editReply({ content: null, embeds: [embed] });
    }
  }
} as Command;

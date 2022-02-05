import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index.js';
import sendError from '../../util/error.js';

module.exports = {
  info: {
    name: 'resume',
    description: i18next.t('resume.description'),
    usage: '',
    aliases: [],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client, message) {
    if (
      !message.member?.voice.channel ||
      message.member?.voice.channel != message.guild?.me?.voice.channel
    ) {
      return sendError(i18next.t('error.samevc'), message.channel);
    }
    const serverQueue = queue.get(message.guild!.id);
    if (serverQueue && serverQueue.paused) {
      serverQueue.resume();
      const embed = new MessageEmbed()
        .setDescription(i18next.t('resume.embed.description'))
        .setColor('YELLOW')
        .setAuthor(
          i18next.t('resume.embed.author'),
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        );
      return message.channel.send({ embeds: [embed] });
    }
    return sendError(i18next.t('error.nopause'), message.channel);
  },
  interaction: {
    options: [],
    run: async function (client, interaction, { isGuildMember }) {
      if (!isGuildMember(interaction.member)) {
        return;
      }
      if (
        !interaction.member?.voice.channel ||
        interaction.member?.voice.channel != interaction.guild?.me?.voice.channel
      ) {
        return sendError(i18next.t('error.samevc'), interaction);
      }
      const serverQueue = queue.get(interaction.guild!.id);
      if (serverQueue && serverQueue.paused) {
        serverQueue.resume();
        const embed = new MessageEmbed()
          .setDescription(i18next.t('resume.embed.description'))
          .setColor('YELLOW')
          .setAuthor(
            i18next.t('resume.embed.author'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          );
        return interaction.reply({ embeds: [embed] });
      }
      return sendError(i18next.t('error.nopause'), interaction);
    }
  }
} as Command;

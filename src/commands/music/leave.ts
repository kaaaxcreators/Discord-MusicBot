import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'leave',
    aliases: ['goaway', 'disconnect'],
    description: i18next.t('leave.description'),
    usage: '',
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client, message) {
    const channel = message.member!.voice.channel;
    if (!channel) {
      return sendError(i18next.t('error.needvc'), message.channel);
    }
    if (!message.guild!.me!.voice.channel) {
      return sendError(i18next.t('leave.notinvc'), message.channel);
    }

    try {
      queue.delete(message.guild!.id);
      await message.guild!.me!.voice.disconnect();
    } catch (error) {
      return sendError(i18next.t('leave.trying'), message.channel);
    }

    const embed = new MessageEmbed()
      .setAuthor({
        name: i18next.t('leave.embed.author'),
        iconURL: 'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      })
      .setColor('GREEN')
      .setTitle(i18next.t('leave.embed.title'))
      .setDescription(i18next.t('leave.embed.description'))
      .setTimestamp();

    return message.channel
      .send({ embeds: [embed] })
      .catch(() => message.channel.send(i18next.t('leave.left')!));
  },
  interaction: {
    options: [],
    run: async function (client, interaction, { isGuildMember }) {
      if (!isGuildMember(interaction.member)) {
        return;
      }
      const channel = interaction.member?.voice.channel;
      if (!channel) {
        return sendError(i18next.t('error.needvc'), interaction);
      }
      if (!interaction.guild?.me?.voice.channel) {
        return sendError(i18next.t('leave.notinvc'), interaction);
      }

      try {
        queue.delete(interaction.guild!.id);
        await interaction.guild?.me?.voice.disconnect();
      } catch (error) {
        return sendError(i18next.t('leave.trying'), interaction);
      }

      const embed = new MessageEmbed()
        .setAuthor({
          name: i18next.t('leave.embed.author'),
          iconURL:
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        })
        .setColor('GREEN')
        .setTitle(i18next.t('leave.embed.title'))
        .setDescription(i18next.t('leave.embed.description'))
        .setTimestamp();

      return interaction
        .reply({ embeds: [embed] })
        .catch(() => interaction.reply(i18next.t('leave.left')!));
    }
  }
} as Command;

import { MessageEmbedOptions } from 'discord.js';
import i18next from 'i18next';

import { Command, queue as Queue } from '../../index.js';
import { getPrefix } from '../../util/database.js';
import sendError from '../../util/error.js';
import console from '../../util/logger.js';

module.exports = {
  info: {
    name: 'remove',
    description: i18next.t('remove.description'),
    usage: i18next.t('remove.usage'),
    aliases: ['rm'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client, message, args) {
    if (
      !message.member?.voice.channel ||
      message.member?.voice.channel != message.guild?.me?.voice.channel
    ) {
      return sendError(i18next.t('error.samevc'), message.channel);
    }
    const queue = Queue.get(message.guild!.id);
    if (!queue) {
      return sendError(i18next.t('error.noqueue'), message.channel).catch(console.error);
    }
    const prefix = await getPrefix(message);
    if (!args.length) {
      return sendError(i18next.t('remove.missingargs', { prefix: prefix }), message.channel);
    }
    if (isNaN(Number(args[0]))) {
      return sendError(i18next.t('remove.missingargs', { prefix: prefix }), message.channel);
    }
    if (queue.queue.length == 1) {
      return sendError(i18next.t('error.noqueue'), message.channel).catch(console.error);
    }
    if (Number(args[0]) > queue.queue.length) {
      return sendError(
        i18next.t('remove.short', { songs: queue.queue.length }),
        message.channel
      ).catch(console.error);
    }
    try {
      const song = queue.queue.splice(Number(args[0]) - 1, 1);
      queue.textChannel
        .send({
          embeds: [
            {
              color: 'RED',
              description: i18next.t('remove.embed.description', { song: song[0].title })
            } as MessageEmbedOptions
          ]
        })
        .catch(console.error);
      message.react('✅');
    } catch (error) {
      return sendError(`:notes: ${i18next.t('error.possible')} ${error}`, message.channel);
    }
  },
  interaction: {
    options: [
      {
        name: 'songs',
        description: 'Songs to skip',
        type: 'INTEGER',
        required: true
      }
    ],
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
      const queue = Queue.get(interaction.guild!.id);
      if (!queue) {
        return sendError(i18next.t('error.noqueue'), interaction).catch(console.error);
      }
      if (queue.queue.length == 1) {
        return sendError(i18next.t('error.noqueue'), interaction).catch(console.error);
      }
      const songs = interaction.options.getInteger('songs', true);
      if (songs > queue.queue.length) {
        return sendError(
          i18next.t('remove.short', { songs: queue.queue.length }),
          interaction
        ).catch(console.error);
      }
      try {
        const song = queue.queue.splice(songs - 1, 1);
        queue.textChannel
          .send({
            embeds: [
              {
                color: 'RED',
                description: i18next.t('remove.embed.description', { song: song[0].title })
              } as MessageEmbedOptions
            ]
          })
          .catch(console.error);
        interaction.reply('✅');
      } catch (error) {
        return sendError(`:notes: ${i18next.t('error.possible')} ${error}`, interaction);
      }
    }
  }
} as Command;

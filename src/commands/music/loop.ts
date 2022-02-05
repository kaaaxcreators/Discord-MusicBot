import { MessageEmbedOptions } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index.js';
import sendError from '../../util/error.js';

module.exports = {
  info: {
    name: 'loop',
    description: i18next.t('loop.description'),
    usage: '',
    aliases: ['l'],
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
    if (serverQueue) {
      serverQueue.loop = !serverQueue.loop;
      return message.channel.send({
        embeds: [
          {
            color: 'GREEN',
            description: i18next.t('loop.status', {
              status:
                serverQueue.loop === true ? i18next.t('loop.enabled') : i18next.t('loop.disabled')
            })
          } as MessageEmbedOptions
        ]
      });
    }
    return sendError(i18next.t('error.noqueue'), message.channel);
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
      if (serverQueue) {
        serverQueue.loop = !serverQueue.loop;
        return interaction.reply({
          embeds: [
            {
              color: 'GREEN',
              description: i18next.t('loop.status', {
                status:
                  serverQueue.loop === true ? i18next.t('loop.enabled') : i18next.t('loop.disabled')
              })
            } as MessageEmbedOptions
          ]
        });
      }
      return sendError(i18next.t('error.noqueue'), interaction);
    }
  }
} as Command;

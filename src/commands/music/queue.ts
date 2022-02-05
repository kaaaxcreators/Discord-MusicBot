import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, queue as Queue } from '../../index.js';
import { getPrefix } from '../../util/database.js';
import sendError from '../../util/error.js';
import Util from '../../util/pagination.js';

export default {
  info: {
    name: 'queue',
    description: i18next.t('queue.description'),
    usage: '',
    aliases: ['q', 'list', 'songlist', 'song-list'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'ADD_REACTIONS'],
      member: []
    }
  },
  run: async function (client, message) {
    const queue = Queue.get(message.guild!.id);
    if (!queue || !queue.currentResource) {
      return sendError(i18next.t('error.noqueue'), message.channel);
    }

    const que = queue.queue.map(
      (t, i) => `\`${++i}.\` | [\`${t.title}\`](${t.url}) - [<@${t.req.id}>]`
    );

    const chunked = Util.chunk(que, 10).map((x) => x.join('\n'));

    const embed = new MessageEmbed()
      .setAuthor(
        i18next.t('queue.embed.author'),
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setThumbnail(message.guild!.iconURL()!)
      .setColor('BLUE')
      .setDescription(chunked[0])
      .addField(
        i18next.t('queue.embed.now'),
        `[${queue.queue[0].title}](${queue.queue[0].url})`,
        true
      )
      .addField(i18next.t('queue.embed.text'), queue.textChannel.toString(), true)
      .addField(i18next.t('queue.embed.voice'), queue.voiceChannel.toString(), true)
      .setFooter(i18next.t('queue.embed.footer', { volume: queue.volume, pages: chunked.length }));
    if (queue.queue.length === 1) {
      embed.setDescription(
        i18next.t('queue.embed.description', { prefix: await getPrefix(message) })
      );
    }

    try {
      const queueMsg = await message.channel.send({ embeds: [embed] });
      if (chunked.length > 1) {
        await Util.pagination(queueMsg, message.author, chunked);
      }
    } catch (e) {
      if (e instanceof Error) {
        message.channel.send(`An error occurred: ${e.message}.`);
      }
    }
  },
  interaction: {
    options: [],
    run: async function (client, interaction, { isMessage }) {
      const queue = Queue.get(interaction.guild!.id);
      if (!queue || !queue.currentResource) {
        return sendError(i18next.t('error.noqueue'), interaction);
      }

      const que = queue.queue.map(
        (t, i) => `\`${++i}.\` | [\`${t.title}\`](${t.url}) - [<@${t.req.id}>]`
      );

      const chunked = Util.chunk(que, 10).map((x) => x.join('\n'));

      const embed = new MessageEmbed()
        .setAuthor(
          i18next.t('queue.embed.author'),
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setThumbnail(interaction.guild!.iconURL()!)
        .setColor('BLUE')
        .setDescription(chunked[0])
        .addField(
          i18next.t('queue.embed.now'),
          `[${queue.queue[0].title}](${queue.queue[0].url})`,
          true
        )
        .addField(i18next.t('queue.embed.text'), queue.textChannel.toString(), true)
        .addField(i18next.t('queue.embed.voice'), queue.voiceChannel.toString(), true)
        .setFooter(
          i18next.t('queue.embed.footer', { volume: queue.volume, pages: chunked.length })
        );
      if (queue.queue.length === 1) {
        embed.setDescription(
          i18next.t('queue.embed.description', { prefix: await getPrefix(interaction) })
        );
      }

      try {
        const queueMsg = await interaction.reply({ embeds: [embed], fetchReply: true });
        if (!isMessage(queueMsg)) {
          return;
        }
        if (chunked.length > 1) {
          await Util.pagination(queueMsg, interaction.user, chunked);
        }
      } catch (e) {
        if (e instanceof Error) {
          interaction.reply(`An error occurred: ${e.message}.`);
        }
      }
    }
  }
} as Command;

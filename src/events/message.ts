import didYouMean from 'didyoumean2';
import { Client, Message, MessageEmbed, NewsChannel, TextChannel } from 'discord.js';
import events from 'events';
import i18next from 'i18next';

import { commands, config, Stats } from '../index';
import { getGuild } from '../util/database';
import sendError from '../util/error';

module.exports = async (client: Client, message: Message) => {
  if (message.author.bot) {
    return;
  }

  let botprefix = config.prefix;

  // prefix from db if server
  if (message.channel.type != 'dm' && config.GUILDPREFIX) {
    const guildDB = await getGuild(message.guild!.id);
    if (guildDB && guildDB.prefix) {
      botprefix = guildDB.prefix;
    }
  }

  // Respond to Prefix or Tag
  const prefixMention = new RegExp(`^<@!?${client.user?.id}> `);
  const prefix = message.content.match(prefixMention)
    ? message.content.match(prefixMention)![0]
    : botprefix;

  // prefix has to be at start
  if (message.content.indexOf(prefix) !== 0) {
    return;
  }

  // Get Args after Prefix
  const args = message.content.slice(prefix.length).trim().split(/ +/g);

  // Making the command lowerCase because our file name will be in lowerCase
  const command = args.shift()!.toLowerCase();

  // Searching a command with Name or Alias
  const cmd =
    commands.get(command) ||
    commands.find((x) => x && x.info && x.info.aliases && x.info.aliases.includes(command!));

  process.on('unhandledRejection', (reason: Error, promise) => {
    try {
      console.error('Unhandled Rejection at: ', promise, 'reason: ', reason?.stack || reason);
    } catch {
      console.error(reason);
    }
  });
  events.EventEmitter.defaultMaxListeners = 25;

  // Executing the command with Context and Arguments
  if (cmd && cmd.run) {
    // Only run General Commands in DM
    if (cmd.info.categorie != 'general' && message.channel.type == 'dm') {
      return sendError(i18next.t('message.onlygeneral'), message.channel);
    }
    // Check for Bot Permissions only on Servers
    if (cmd.info.permissions && message.channel.type != 'dm') {
      message.channel = <TextChannel | NewsChannel>message.channel;
      if (
        cmd.info.permissions.channel &&
        !message.channel.permissionsFor(client.user!)?.has(cmd.info.permissions.channel)
      ) {
        return sendError(
          i18next.t('message.permissions.member') +
            cmd.info.permissions.channel.map((perm) => `• ${perm}`).join('\n'),
          message.channel
        );
      }
      // Check for Member Permissions
      if (
        cmd.info.permissions.member &&
        !message.channel.permissionsFor(message.member!)?.has(cmd.info.permissions.member)
      ) {
        return sendError(
          i18next.t('message.permissions.member') +
            cmd.info.permissions.member.map((perm) => `• ${perm}`).join('\n'),
          message.channel
        );
      }
    }
    Stats.commandsRan++;
    cmd.run(client, message, args);
  } else if (config.DIDYOUMEAN) {
    try {
      const result = didYouMean(
        command,
        commands.map((value) => value.info.name)
      );
      if (result) {
        const embed = new MessageEmbed()
          .setTitle('🤔 didyoumean')
          .setTimestamp()
          .setDescription(i18next.t('message.dym', { command: result }))
          .addField(
            i18next.t('help.spec.description'),
            commands.get(result)?.info.description || i18next.t('error.something')
          )
          .setColor('DARK_VIVID_PINK')
          .setFooter(message.author.username, message.author.avatarURL()!);
        return message.channel.send(embed);
      } else {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err.message || err);
    }
  } else {
    return;
  }
};

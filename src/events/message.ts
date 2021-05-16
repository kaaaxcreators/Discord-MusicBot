import { Client, Message } from 'discord.js';
import events from 'events';

import { commands, config } from '../index';

module.exports = async (client: Client, message: Message) => {
  if (message.author.bot) return;

  // Respond to Prefix or Tag
  const prefixMention = new RegExp(`^<@!?${client.user?.id}> `);
  const prefix = message.content.match(prefixMention)
    ? message.content.match(prefixMention)![0]
    : config.prefix;

  if (message.content.indexOf(prefix) !== 0) return;

  // Get Args after Prefix
  const args = message.content.slice(prefix.length).trim().split(/ +/g);

  // Making the command lowerCase because our file name will be in lowerCase
  const command = args.shift()?.toLowerCase();

  // Searching a command with Name or Alias
  const cmd =
    commands.get(command!) ||
    commands.find((x) => x && x.info && x.info.aliases && x.info.aliases.includes(command!));

  process.on('unhandledRejection', (reason: Error, promise) => {
    try {
      console.error('Unhandled Rejection at: ', promise, 'reason: ', reason?.stack || reason);
    } catch {
      console.error(reason);
    }
  });
  events.EventEmitter.defaultMaxListeners = 25;

  // Executing the command with Context and args
  if (cmd && cmd.run) {
    cmd.run(client, message, args);
  } else return;
};

import { Client, Message } from 'discord.js';

import { commands, config } from '../index';

module.exports = async (client: Client, message: Message) => {
  if (message.author.bot) return;

  //Prefixes also have mention match
  const prefixMention = new RegExp(`^<@!?${client.user?.id}> `);
  const prefix = message.content.match(prefixMention)
    ? message.content.match(prefixMention)![0]
    : config.prefix;

  if (message.content.indexOf(prefix) !== 0) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  //Making the command lowerCase because our file name will be in lowerCase
  const command = args.shift()?.toLowerCase();

  //Searching a command
  const cmd =
    commands.get(command!) ||
    commands.find((x) => x && x.info && x.info.aliases && x.info.aliases.includes(command!));

  process.on('unhandledRejection', (reason: Reason, promise) => {
    try {
      console.error('Unhandled Rejection at: ', promise, 'reason: ', reason?.stack || reason);
    } catch {
      console.error(reason);
    }
  });
  require('events').EventEmitter.defaultMaxListeners = 25;

  //Executing the codes when we get the command or aliases
  if (cmd && cmd.run) {
    cmd.run(client, message, args);
  } else return;
};

export interface Reason {
  stack: any;
}

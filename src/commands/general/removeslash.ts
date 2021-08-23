import { Command } from '../../index';

module.exports = {
  info: {
    name: 'removeslash',
    description: 'Removes slash command in current guild',
    categorie: 'general',
    usage: '',
    aliases: [],
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
      member: ['ADMINISTRATOR']
    },
    hidden: true
  },
  run: async (client, message) => {
    const guild = message.guild;
    if (!guild) {
      return message.channel.send(`This command can only be used in a guild`);
    }
    const messages: string[] = [];
    const commands = await guild.commands.fetch();
    commands.forEach((command) => {
      guild.commands.delete(command);
      messages.push('Deleted Guild Command: ' + command.name);
    });
    if (messages.length) {
      return message.channel.send(messages.join('\n'));
    } else {
      return message.channel.send('No messages to send');
    }
  }
} as Command;

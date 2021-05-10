import { Client, Message, MessageEmbed } from 'discord.js';

import { commands, config } from '../index';

module.exports = {
  info: {
    name: 'help',
    description: 'To show all commands',
    usage: '[command]',
    aliases: ['commands', 'help me', 'pls help']
  },

  run: async function (client: Client, message: Message, args: string[]) {
    let allcmds = '';

    commands.forEach((cmd) => {
      const cmdinfo = cmd.info;
      allcmds +=
        '`' +
        config.prefix +
        cmdinfo.name +
        ' ' +
        cmdinfo.usage +
        '` ~ ' +
        cmdinfo.description +
        '\n';
    });

    const embed = new MessageEmbed()
      .setAuthor(
        'Commands of ' + client.user!.username,
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE')
      .setDescription(allcmds)
      .setFooter(`To get info of each command you can do ${config.prefix}help [command]`);

    if (!args[0]) return message.channel.send(embed);
    else {
      const cmd = args[0];
      let command = commands.get(cmd);
      if (!command) command = commands.find((x) => x.info.aliases.includes(cmd));
      if (!command) return message.channel.send('Unknown Command');
      const commandinfo = new MessageEmbed()
        .setTitle('Command: ' + command.info.name + ' info')
        .setColor('YELLOW').setDescription(`
Name: ${command.info.name}
Description: ${command.info.description}
Usage: \`\`${config.prefix}${command.info.name} ${command.info.usage}\`\`
Aliases: ${command.info.aliases.join(', ')}
`);
      message.channel.send(commandinfo);
    }
  }
};

import { Client, Message, MessageEmbed } from 'discord.js';

import { Command, commands, config } from '../../index';

module.exports = {
  info: {
    name: 'help',
    description: 'Show all commands',
    usage: '[command]',
    aliases: ['commands'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message, args: string[]) {
    let generalcmds = '';
    let musiccmds = '';

    commands.forEach((cmd) => {
      const cmdinfo = cmd.info;
      // Remove unnecessary space
      const usage = cmdinfo.usage ? ' ' + cmdinfo.usage : '';
      switch (cmdinfo.categorie) {
        case 'general':
          generalcmds +=
            '`' + config.prefix + cmdinfo.name + usage + '` ~ ' + cmdinfo.description + '\n';
          break;
        case 'music':
          musiccmds +=
            '`' + config.prefix + cmdinfo.name + usage + '` ~ ' + cmdinfo.description + '\n';
          break;
        default:
          break;
      }
    });

    const embed = new MessageEmbed()
      .setAuthor(
        'Commands of ' + client.user!.username,
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE')
      .addField(':information_source: General', generalcmds)
      .setFooter(`To get info of each command you can do ${config.prefix}help [command]`);
    if (message.channel.type != 'dm') embed.addField(':notes: Music', musiccmds);

    if (!args[0]) return message.channel.send(embed);
    // If Argument supplied get details of specific command
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
} as Command;

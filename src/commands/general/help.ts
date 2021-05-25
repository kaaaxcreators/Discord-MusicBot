import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, commands, config } from '../../index';
i18n.setLocale(config.LOCALE);

module.exports = {
  info: {
    name: 'help',
    description: i18n.__('help.description'),
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
        i18n.__('help.embed.author') + ' ' + client.user!.username,
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE')
      .addField(':information_source: ' + i18n.__('help.embed.fields.general'), generalcmds)
      .setFooter(i18n.__mf('help.embed.footer', { prefix: config.prefix }));
    if (message.channel.type != 'dm')
      embed.addField(':notes: ' + i18n.__('help.embed.fields.music'), musiccmds);

    if (!args[0]) return message.channel.send(embed);
    // If Argument supplied get details of specific command
    else {
      const cmd = args[0];
      let command = commands.get(cmd);
      if (!command) command = commands.find((x) => x.info.aliases.includes(cmd));
      if (!command) return message.channel.send('Unknown Command');
      const commandinfo = new MessageEmbed()
        .setTitle(i18n.__('help.spec.command') + ' ' + command.info.name)
        .setColor('YELLOW').setDescription(`
${i18n.__('help.spec.name')} ${command.info.name}
${i18n.__('help.spec.description')} ${command.info.description}
${i18n.__('help.spec.usage')} \`\`${config.prefix}${command.info.name} ${command.info.usage}\`\`
${i18n.__('help.spec.aliases')} ${command.info.aliases.join(', ')}
`);
      message.channel.send(commandinfo);
    }
  }
} as Command;

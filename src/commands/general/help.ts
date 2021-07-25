import { Client, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, commands } from '../../index';
import { getPrefix } from '../../util/database';
import Util from '../../util/pagination';

module.exports = {
  info: {
    name: 'help',
    description: i18next.t('help.description'),
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
    const prefix = await getPrefix(message);

    commands.forEach((cmd) => {
      const cmdinfo = cmd.info;
      // Remove unnecessary space
      const usage = cmdinfo.usage ? ' ' + cmdinfo.usage : '';
      switch (cmdinfo.categorie) {
        case 'general':
          generalcmds += '`' + prefix + cmdinfo.name + usage + '` ~ ' + cmdinfo.description + '\n';
          break;
        case 'music':
          musiccmds += '`' + prefix + cmdinfo.name + usage + '` ~ ' + cmdinfo.description + '\n';
          break;
        default:
          break;
      }
    });
    const helptext = [
      `**:information_source: ${i18next.t(
        'help.embed.fields.general'
      )}**\n${generalcmds}\n**:notes: ${i18next.t('help.embed.fields.music')}**\n${musiccmds}`
    ];
    const splittedHelp = Util.chunk(helptext, 1024);
    const embed = new MessageEmbed()
      .setAuthor(
        i18next.t('help.embed.author') + ' ' + client.user!.username,
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE')
      .setDescription(splittedHelp[0])
      .setFooter(i18next.t('help.embed.footer', { prefix: prefix }));

    if (!args[0]) {
      const helpmsg = await message.channel.send(embed);
      if (splittedHelp.length > 1) {
        await Util.pagination(helpmsg, message.author, splittedHelp);
      }
    }
    // If Argument supplied get details of specific command
    else {
      const cmd = args[0];
      let command = commands.get(cmd);
      if (!command) {
        command = commands.find((x) => x.info.aliases.includes(cmd));
      }
      if (!command) {
        return message.channel.send('Unknown Command');
      }
      const usage = command.info.usage ? ` ${command.info.usage}` : '';
      const commandinfo = new MessageEmbed()
        .setTitle(i18next.t('help.spec.command') + ' ' + command.info.name)
        .setColor('YELLOW').setDescription(`
${i18next.t('help.spec.name')} ${command.info.name}
${i18next.t('help.spec.description')} ${command.info.description}
${i18next.t('help.spec.usage')} \`\`${prefix}${command.info.name}${usage}\`\`
${i18next.t('help.spec.aliases')} ${command.info.aliases.join(', ')}
`);
      message.channel.send(commandinfo);
    }
  }
} as Command;

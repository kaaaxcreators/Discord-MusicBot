import { MessageEmbed } from 'discord.js';
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
  run: async function (client, message, args: string[]) {
    const DM = message.channel.type === 'DM';
    const prefix = await getPrefix(message);
    const { generalcmds, musiccmds } = generateHelpText(prefix);
    const helptext = [
      `**:information_source: ${i18next.t('help.embed.fields.general')}**\n${generalcmds}`
    ];
    if (!DM) {
      helptext[0] += `\n**:notes: ${i18next.t('help.embed.fields.music')}**\n${musiccmds}`;
    }
    const splittedHelp = Util.chunk(helptext, 1024);
    const embed = new MessageEmbed()
      .setAuthor(
        i18next.t('help.embed.author') + ' ' + client.user!.username,
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE')
      .setDescription(splittedHelp[0].join(''))
      .setFooter(i18next.t('help.embed.footer', { prefix: prefix }));

    if (!args[0]) {
      const helpmsg = await message.channel.send({ embeds: [embed] });
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
      message.channel.send({ embeds: [commandinfo] });
    }
  },
  interaction: {
    options: [
      {
        name: 'command',
        description: 'Help about specific command',
        choices: [...commands.keys()].map((v) => ({ name: v, value: v })),
        type: 'STRING',
        required: false
      }
    ],
    run: async (client, interaction) => {
      const command = interaction.options.getString('command', false);
      const prefix = await getPrefix(interaction);
      if (!command) {
        // All Commands
        const { generalcmds, musiccmds } = generateHelpText(prefix);
        const generalText = `**:information_source: ${i18next.t(
          'help.embed.fields.general'
        )}**\n${generalcmds}`;
        const musicText = `\n**:notes: ${i18next.t('help.embed.fields.music')}**\n${musiccmds}`;
        const embed = new MessageEmbed()
          .setAuthor(
            i18next.t('help.embed.author') + ' ' + client.user!.username,
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setColor('BLUE')
          .setDescription(generalText + musicText);
        interaction.reply({ embeds: [embed] });
      } else {
        // Specific Command
        const cmd = commands.get(command) || commands.find((v) => v.info.aliases.includes(command));
        if (!cmd) {
          return interaction.reply('Unknown Command');
        }
        const usage = cmd.info.usage ? ` ${cmd.info.usage}` : '';
        const embed = new MessageEmbed()
          .setTitle(i18next.t('help.spec.command') + ' ' + cmd.info.name)
          .setColor('YELLOW').setDescription(`
${i18next.t('help.spec.name')} ${cmd.info.name}
${i18next.t('help.spec.description')} ${cmd.info.description}
${i18next.t('help.spec.usage')} \`\`${prefix}${cmd.info.name}${usage}\`\`
${i18next.t('help.spec.aliases')} ${cmd.info.aliases.join(', ')}
`);
        interaction.reply({ embeds: [embed] });
      }
    }
  }
} as Command;

/**
 * Generates the help text for the commands
 * @param prefix The prefix of the bot
 * @returns The help text for the commands
 */
function generateHelpText(prefix: string) {
  let generalcmds = '';
  let musiccmds = '';

  commands.forEach((cmd) => {
    const cmdinfo = cmd.info;
    if (cmdinfo.hidden) {
      return;
    }
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
  return { generalcmds, musiccmds };
}

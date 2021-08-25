import { Client, GuildMember, Interaction, Message } from 'discord.js';
import { APIInteractionGuildMember, APIMessage } from 'discord-api-types';
import i18next from 'i18next';

import { commands, Stats } from '../index';

module.exports = async (client: Client, interaction: Interaction) => {
  // Only Support Guild Slash Commands
  if (
    !interaction.isCommand() ||
    !interaction.guildId ||
    !interaction.channel ||
    interaction.channel.type === 'DM'
  ) {
    if (interaction.isCommand()) {
      return interaction.reply("Interactions don't support DMs currently");
    }
    return;
  }
  // Get Command by Name
  const command = commands.get(interaction.commandName);
  // Check if Command supports Interactions
  if (!command?.interaction) {
    return interaction.reply("Command doesn't support Interactions");
  }
  // Check If Bot has Permissions or Channel is DM
  if (!interaction.channel.permissionsFor(client.user!)?.has(command.info.permissions.channel)) {
    return interaction.reply(
      i18next.t('message.permissions.bot') +
        command.info.permissions.channel.map((v) => `• ${v}`).join('\n')
    );
  }
  if (
    !isGuildMember(interaction.member) ||
    !interaction.channel.permissionsFor(interaction.member!)?.has(command.info.permissions.member)
  ) {
    return interaction.reply(
      i18next.t('message.permissions.member') +
        command.info.permissions.member.map((v) => `• ${v}`).join('\n')
    );
  }
  Stats.commandsRan++;
  // Execute Command
  command.interaction.run(client, interaction, helpers).catch((err) => {
    console.error(err);
    interaction.reply('Something went wrong');
  });
};

/**
 * Checks if Input is a GuildMember
 */
export function isGuildMember(
  obj: GuildMember | APIInteractionGuildMember | null
): obj is GuildMember {
  if (obj == null) {
    return false;
  }
  if (obj instanceof GuildMember) {
    return true;
  }
  return false;
}

/**
 * Checks if Input is a Message
 */
export function isMessage(a: Message | APIMessage): a is Message {
  return 'applicationId' in a;
}

const helpers: Helpers = { isGuildMember, isMessage };

export interface Helpers {
  isGuildMember: (obj: GuildMember | APIInteractionGuildMember | null) => obj is GuildMember;
  isMessage: (a: Message | APIMessage) => a is Message;
}

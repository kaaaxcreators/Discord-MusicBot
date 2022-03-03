import { Client, GuildMember, Interaction, Message } from 'discord.js';
import { APIInteractionGuildMember, APIMessage } from 'discord-api-types';
import i18next from 'i18next';

import { commands, Stats } from '../index.js';

module.exports = async (client: Client, interaction: Interaction) => {
  // Only Support Guild Slash Commands
  if (!interaction.isCommand() || !interaction.channel) {
    return;
  }
  // Get Command by Name
  const command = commands.get(interaction.commandName);
  // Check if Command supports Interactions
  if (!command?.interaction) {
    return interaction.reply("Command doesn't support Interactions");
  }
  if (
    (interaction.channel.type === 'DM' || !interaction.guildId) &&
    command.info.categorie === 'music'
  ) {
    return interaction.reply('This command can only be used in a guild');
  }
  if (interaction.channel.type !== 'DM') {
    // Check If Bot has Permissions
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
function isGuildMember(obj: GuildMember | APIInteractionGuildMember | null): obj is GuildMember {
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
function isMessage(a: Message | APIMessage): a is Message {
  return 'applicationId' in a;
}

export const helpers: Helpers = { isGuildMember, isMessage };

export interface Helpers {
  isGuildMember: (obj: GuildMember | APIInteractionGuildMember | null) => obj is GuildMember;
  isMessage: (a: Message | APIMessage) => a is Message;
}

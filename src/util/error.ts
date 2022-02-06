import { CommandInteraction, MessageEmbed, TextBasedChannel } from 'discord.js';
import i18next from 'i18next';

/**
 * Easier to send errors instead of doing it over and over
 * @param {String} text - Message to send
 * @param {TextBasedChannel} channel - The Channel to send error to
 */
export default async (
  text: string,
  channel: TextBasedChannel | CommandInteraction
): Promise<void> => {
  const embed = new MessageEmbed()
    .setColor('RED')
    .setDescription(text)
    .setFooter(i18next.t('error.something'));
  if (isTextBasedChannels(channel)) {
    await channel.send({ embeds: [embed] });
  } else if (channel instanceof CommandInteraction) {
    await channel.reply({ embeds: [embed] });
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTextBasedChannels(a: any): a is TextBasedChannel {
  return 'send' in a;
}

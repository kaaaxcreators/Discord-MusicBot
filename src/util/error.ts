import { MessageEmbed, TextBasedChannels } from 'discord.js';
import i18next from 'i18next';

/**
 * Easier to send errors instead of doing it over and over
 * @param {String} text - Message to send
 * @param {TextBasedChannels} channel - The Channel to send error to
 */
export default async (text: string, channel: TextBasedChannels): Promise<void> => {
  const embed = new MessageEmbed()
    .setColor('RED')
    .setDescription(text)
    .setFooter(i18next.t('error.something'));
  await channel.send({ embeds: [embed] });
};

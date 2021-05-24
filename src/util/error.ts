import { DMChannel, MessageEmbed, NewsChannel, TextChannel } from 'discord.js';
import i18n from 'i18n';

import { config } from '../index';
i18n.setLocale(config.LOCALE);

/**
 * Easier to send errors instead of doing it over and over
 * @param {String} text - Message to send
 * @param {TextChannel | DMChannel | NewsChannel} channel - The Channel to send error to
 */
export default async (
  text: string,
  channel: TextChannel | DMChannel | NewsChannel
): Promise<void> => {
  const embed = new MessageEmbed()
    .setColor('RED')
    .setDescription(text)
    .setFooter(i18n.__('error.something'));
  await channel.send(embed);
};

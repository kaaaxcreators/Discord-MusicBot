import { DMChannel, MessageEmbed, NewsChannel, TextChannel } from 'discord.js';

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
    .setFooter('Something went wrong :(');
  await channel.send(embed);
};

import { DMChannel, MessageEmbed, NewsChannel, TextChannel } from 'discord.js';

/**
 * Easy to send errors because im lazy to do the same things :p
 * @param {String} text - Message which is need to send
 * @param {TextChannel | DMChannel | NewsChannel} channel - A Channel to send error
 */
export default async (text: string, channel: TextChannel | DMChannel | NewsChannel) => {
  const embed = new MessageEmbed()
    .setColor('RED')
    .setDescription(text)
    .setFooter('Something went wrong :(');
  await channel.send(embed);
};

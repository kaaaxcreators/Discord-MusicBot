const { MessageEmbed } = require('discord.js');

module.exports = {
  info: {
    name: 'count',
    description: 'See how many Servers the Bot is in',
    usage: 'count',
    aliases: ['servercount']
  },
  run: async function (client, message) {
    let count = new MessageEmbed()
      .setColor('YELLOW')
      .setDescription(`The Bot is currently in ${client.guilds.cache.size} Servers`)
      .setFooter(`Use ${client.config.prefix}invite to add/invite the Bot to your server`);
    return message.channel.send(count);
  }
};

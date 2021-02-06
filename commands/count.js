const { MessageEmbed } = require("discord.js");
const sendError = require("../util/error");


module.exports = {
  info: {
    name: "server count",
    description: "See how many Servers the Bot is in",
    usage: "Servercount",
    aliases: ["servercount", "count"],
  },
    run: async function (client, message, args) {
        let count = new MessageEmbed()
            .setColor("YELLOW")
            .setDescription(`The Bot is currently in ${client.guilds.cache.size} Servers`)
            .setFooter(`Use ${client.config.prefix}invite to add/invite the Bot to your server`)
        return message.channel.send(count);
    },
};

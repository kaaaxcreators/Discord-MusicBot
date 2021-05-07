const { MessageEmbed } = require('discord.js');
const sendError = require('../util/error');
const ProgressBar = require('../util/ProgressBar');

module.exports = {
  info: {
    name: 'nowplaying',
    description: 'To show the music which is currently playing in this server',
    usage: '',
    aliases: ['np']
  },

  run: async function (client, message) {
    const serverQueue = message.client.queue.get(message.guild.id);
    if (!serverQueue) return sendError('There is nothing playing in this server.', message.channel);
    let song = serverQueue.songs[0];
    const Progress = ProgressBar(
      serverQueue.connection.dispatcher.streamTime,
      song.duration.seconds * 1000,
      10
    );
    let thing = new MessageEmbed()
      .setAuthor(
        'Now Playing',
        'https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif'
      )
      .setThumbnail(song.img)
      .setColor('BLUE')
      .addField('Name', song.title, true)
      .addField('Progress', Progress.Bar, true)
      .addField('Percentage', Progress.percentageText, true)
      .addField('Requested by', song.req.tag, true)
      .setFooter(`Views: ${song.views} | ${song.ago}`);
    return message.channel.send(thing);
  }
};

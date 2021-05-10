require('dotenv').config(); //Loading .env
import fs from 'fs';
import keepAlive from './server';
import { Collection, Client, Message, DMChannel, NewsChannel, TextChannel, VoiceChannel } from "discord.js";

export const client = new Client();
export const commands = new Collection<string, Command>();
export const queue = new Map<string, IQueue>();

export interface IQueue{
  textChannel: TextChannel | DMChannel | NewsChannel,
  voiceChannel: VoiceChannel,
  connection: any,
  songs: any[],
  volume: number,
  playing: Boolean
}

export const config = {
  prefix: process.env.PREFIX ? process.env.PREFIX : '',
  SOUNDCLOUD: process.env.SOUNDCLOUD_CLIENT_ID ? process.env.SOUNDCLOUD_CLIENT_ID : ''
};

//Loading Events
fs.readdir(__dirname + '/events/', (err, files) => {
  if (err) return console.error(err);
  files.forEach((file) => {
    const event = require(__dirname + `/events/${file}`);
    let eventName = file.split('.')[0];
    client.on(eventName, event.bind(null, client));
    console.log('Loading Event: ' + eventName);
  });
});

//Loading Commands
fs.readdir('./commands/', (err, files) => {
  if (err) return console.error(err);
  files.forEach((file) => {
    if (!file.endsWith('.js')) return;
    let props = require(`./commands/${file}`);
    let commandName = file.split('.')[0];
    commands.set(commandName, props);
    console.log('Loading Command: ' + commandName);
  });
});

//Logging in to discord
keepAlive();
client.login(process.env.TOKEN);

export interface Command{
  info: {
    name: string,
    description: string,
    usage: string,
    aliases: string[]
  },

  run: (client: Client, message: Message, args: string[]) => any
}

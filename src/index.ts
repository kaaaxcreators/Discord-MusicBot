// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config(); //Loading .env
import {
  Client,
  Collection,
  DMChannel,
  Message,
  NewsChannel,
  TextChannel,
  VoiceChannel
} from 'discord.js';
import fs from 'fs';

import keepAlive from './server';

export const client = new Client();
export const commands = new Collection<string, Command>();
export const queue = new Map<string, IQueue>();

export interface IQueue {
  textChannel: TextChannel | DMChannel | NewsChannel;
  voiceChannel: VoiceChannel;
  connection: any;
  songs: any[];
  volume: number;
  playing: boolean;
  loop: boolean;
}

export const config = {
  prefix: process.env.PREFIX ? process.env.PREFIX : '',
  SOUNDCLOUD: process.env.SOUNDCLOUD_CLIENT_ID ? process.env.SOUNDCLOUD_CLIENT_ID : ''
};

//Loading Events
fs.readdir(__dirname + '/events/', (err, files) => {
  if (err) return console.error(err);
  files.forEach((file) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const event = require(__dirname + `/events/${file}`);
    const eventName = file.split('.')[0];
    client.on(eventName, event.bind(null, client));
    console.log('Loading Event: ' + eventName);
  });
});

//Loading Commands
fs.readdir(__dirname + '/commands/', (err, files) => {
  if (err) return console.error(err);
  files.forEach((file) => {
    if (!file.endsWith('.js')) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const props = require(__dirname + `/commands/${file}`);
    const commandName = file.split('.')[0];
    commands.set(commandName, props);
    console.log('Loading Command: ' + commandName);
  });
});

//Logging in to discord
keepAlive();
client.login(process.env.TOKEN);

export interface Command {
  info: {
    name: string;
    description: string;
    usage: string;
    aliases: string[];
  };

  run: (client: Client, message: Message, args: string[]) => any;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
import {
  Client,
  Collection,
  DMChannel,
  Message,
  NewsChannel,
  TextChannel,
  VoiceChannel,
  VoiceConnection
} from 'discord.js';
import dotenv from 'dotenv-safe'; //Loading .env
dotenv.config();
import fs from 'fs';

import keepAlive from './server';
import { Song } from './util/playing';

export const client = new Client();
export const commands = new Collection<string, Command>();
export const queue = new Map<string, IQueue>();

export interface IQueue {
  textChannel: TextChannel | DMChannel | NewsChannel;
  voiceChannel: VoiceChannel;
  connection: VoiceConnection | null;
  songs: Song[];
  volume: number;
  playing: boolean;
  loop: boolean;
}

export const config: Config = {
  prefix: process.env.PREFIX!,
  SOUNDCLOUD: process.env.SOUNDCLOUD_CLIENT_ID!,
  TOKEN: process.env.TOKEN!,
  PRESENCE: process.env.PRESENCE!
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
client.login(config.TOKEN);

export interface Command {
  info: {
    name: string;
    description: string;
    usage: string;
    aliases: string[];
  };

  run: (client: Client, message: Message, args: string[]) => never;
}

export interface Config {
  TOKEN: string;
  prefix: string;
  SOUNDCLOUD: string;
  PRESENCE: string;
}

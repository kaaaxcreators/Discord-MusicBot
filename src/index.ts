// eslint-disable-next-line @typescript-eslint/no-var-requires
import {
  Client,
  Collection,
  DMChannel,
  Message,
  NewsChannel,
  PermissionResolvable,
  TextChannel,
  VoiceChannel,
  VoiceConnection
} from 'discord.js';
import dotenv, { MissingEnvVarsError } from 'dotenv-safe'; //Loading .env
try {
  dotenv.config();
} catch (err) {
  EnvError(err);
}
import fs from 'fs';

import docs from './docs';
import { Song } from './util/playing';

export const client = new Client();
export const commands = new Collection<string, Command>();
export const queue = new Map<string, IQueue>();

/** Represents the Queue */
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
  TOKEN: process.env.TOKEN!,
  PRESENCE: process.env.PRESENCE!
};

// Generate Docs if Env is set
if (process.env.DOCS == 'true') {
  docs();
}

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

//Loading Music
fs.readdir(__dirname + '/commands/music', (err, files) => {
  if (err) return console.error(err);
  files.forEach((file) => {
    if (!file.endsWith('.js')) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const props = require(__dirname + `/commands/music/${file}`);
    const commandName = file.split('.')[0];
    commands.set(commandName, props);
    console.log('Loading Music Command: ' + commandName);
  });
});

//Loading General
fs.readdir(__dirname + '/commands/general', (err, files) => {
  if (err) return console.error(err);
  files.forEach((file) => {
    if (!file.endsWith('.js')) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const props = require(__dirname + `/commands/general/${file}`);
    const commandName = file.split('.')[0];
    commands.set(commandName, props);
    console.log('Loading General Command: ' + commandName);
  });
});

//Logging in to discord
try {
  client.login(config.TOKEN).catch((err) => LoginError(err));
} catch (err) {
  LoginError(err);
}

// Custom Bad Token Error Handling
function LoginError(err: Error) {
  console.log(
    'An Error occurred: ' + err.message
      ? err.message == 'An invalid token was provided.'
        ? 'You specified a wrong Discord Bot Token! Check your Environment Variables'
        : err.message
      : err
  );
  process.exit();
}

// Custom Missing Env Vars Error Handling
function EnvError(err: MissingEnvVarsError) {
  console.log(
    'An Error occurred: ' + err.missing
      ? `These Environment Variables are missing: ${err.missing
          .map((err) => `"${err}"`)
          .join(', ')}\nAdd them to the Environment Variables!`
      : err.message
      ? err.message
      : err
  );
  process.exit();
}

/** Represents a Command */
export interface Command {
  info: {
    name: string;
    description: string;
    usage: string;
    aliases: string[];
    categorie: 'general' | 'music';
    permissions: Permissions;
  };

  run: (client: Client, message: Message, args: string[]) => unknown;
}

interface Permissions {
  /** Permissions the Bot needs */
  channel: PermissionResolvable[];
  /** Permissions the Member needs */
  member: PermissionResolvable[];
}

interface Config {
  TOKEN: string;
  prefix: string;
  PRESENCE: string;
}

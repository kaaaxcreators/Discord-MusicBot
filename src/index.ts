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
import i18n from 'i18n';
import path from 'path';

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

const locales = ['en'];
const locale = process.env.LOCALE || 'en';

export const config: Config = {
  prefix: process.env.PREFIX!,
  TOKEN: process.env.TOKEN!,
  PRESENCE: process.env.PRESENCE!,
  LOCALE: locales.includes(locale) ? locale : 'en'
};

// Configure i18n
i18n.configure({
  locales: locales,
  directory: path.join(__dirname, '/../locales'),
  defaultLocale: 'en',
  objectNotation: true,
  register: global,

  logWarnFn: function (msg) {
    console.log(msg);
  },

  logErrorFn: function (msg) {
    console.log(msg);
  }
});
i18n.setLocale(config.LOCALE);

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
    console.log(i18n.__('index.event') + ' ' + eventName);
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
    console.log(i18n.__('index.command.music') + ' ' + commandName);
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
    console.log(i18n.__('index.command.general') + ' ' + commandName);
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
    i18n.__('error.occurred') + ' ' + err.message
      ? err.message == i18n.__('index.token.invalid')
        ? i18n.__('index.token.env')
        : err.message
      : err
  );
  process.exit();
}

// Custom Missing Env Vars Error Handling
function EnvError(err: MissingEnvVarsError) {
  console.log(
    i18n.__('error.occurred') + ' ' + err.missing
      ? `${i18n.__('index.env.missing')} ${err.missing
          .map((err) => `"${err}"`)
          .join(', ')}\n${i18n.__('index.env.add')}`
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
  LOCALE: string;
}

import {
  ApplicationCommandOptionData,
  Client,
  Collection,
  CommandInteraction,
  Message,
  PermissionResolvable,
  Snowflake
} from 'discord.js';
import dotenv, { MissingEnvVarsError } from 'dotenv-safe'; //Loading .env
import { existsSync } from 'fs';
import { mkdir, readdir, readFile } from 'fs/promises';
import i18next from 'i18next';
import { dirname as PathDirname } from 'path';
import { fileURLToPath } from 'url';

import docs from './docs.js';
import { Helpers } from './events/interactionCreate.js';
import console from './util/logger.js';
import { MusicSubscription } from './util/Music.js';

const __dirname = PathDirname(fileURLToPath(import.meta.url));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMissingEnvVarsError(a: any): a is MissingEnvVarsError {
  return 'missing' in a;
}

// Load environment variables
try {
  dotenv.config();
} catch (err) {
  if (isMissingEnvVarsError(err)) {
    EnvError(err);
  }
}

export const client = new Client({
  intents: [
    'DIRECT_MESSAGES',
    'GUILDS',
    'GUILD_EMOJIS_AND_STICKERS',
    'GUILD_MESSAGES',
    'GUILD_VOICE_STATES',
    'DIRECT_MESSAGE_REACTIONS',
    'GUILD_MESSAGE_REACTIONS'
  ],
  partials: ['CHANNEL']
});
export const commands = new Collection<string, Command>();
export const queue = new Map<Snowflake, MusicSubscription>();

const locales = ['en', 'de'];
const locale = process.env.LOCALE || 'en';

export const config: Config = {
  prefix: process.env.PREFIX!,
  TOKEN: process.env.TOKEN!,
  PRESENCE: process.env.PRESENCE!,
  LOCALE: locales.includes(locale) ? locale : 'en',
  PERMISSION: process.env.PERMS || '2205281600',
  WEBSITE: process.env.WEB!,
  SCOPES: process.env.SCOPES?.split(' ') || 'identify guilds applications.commands'.split(' '),
  CALLBACK: process.env.CALLBACK || '/api/callback',
  SECRET: process.env.SECRET!,
  COOKIESECRET: process.env.COOKIESECRET || 'garbage-shampoo-surviving',
  DISABLEWEB: process.env.DISABLE_WEB ? /true/i.test(process.env.DISABLE_WEB) : false,
  DIDYOUMEAN: process.env.DIDYOUMEAN ? /true/i.test(process.env.DIDYOUMEAN) : false,
  GUILDPREFIX: process.env.GUILDPREFIX ? /true/i.test(process.env.GUILDPREFIX) : false,
  GUILDACTIONS: process.env.GUILDACTIONS ? /true/i.test(process.env.GUILDACTIONS) : false,
  UPDATEDIFF: Number.isNaN(process.env.UPDATEDIFF!) ? 5 : Number.parseInt(process.env.UPDATEDIFF!),
  SLASHCOMMANDS: process.env.SLASHCOMMANDS ? /true/i.test(process.env.SLASHCOMMANDS) : true
};

export const Stats = {
  commandsRan: 0,
  songsPlayed: 0
};

async function getLanguage(language: string) {
  return JSON.parse(
    (await readFile(`${__dirname}/../locales/${language}.json`, 'utf8')).toString()
  );
}

const de = await getLanguage('de');

const en = await getLanguage('en');

i18next.init({
  lng: config.LOCALE,
  resources: {
    en: { translation: en },
    de: { translation: de }
  },
  compatibilityJSON: 'v3'
});

// Generate Docs if Env is set
if (process.env.DOCS == 'true') {
  docs();
}

//Loading Events
const events = await readdir(__dirname + '/events/');
events.forEach(async (file) => {
  const path = './' + 'events' + '/' + file;
  const event = await import(path);
  const eventName = file.split('.')[0];
  client.on(eventName, event.default.bind(null, client));
  console.info(i18next.t('index.event') + ' ' + eventName);
});

//Loading Music
const music = await readdir(__dirname + '/commands/music');
music.forEach(async (file) => {
  const path = './' + 'commands/music' + '/' + file;
  const props = await import(path);
  const commandName = file.split('.')[0];
  commands.set(commandName, props.default);
  console.info(i18next.t('index.command.music') + ' ' + commandName);
});

//Loading General
const general = await readdir(__dirname + '/commands/general');
general.forEach(async (file) => {
  const path = './' + 'commands/general' + '/' + file;
  const props = await import(path);
  const commandName = file.split('.')[0];
  commands.set(commandName, props.default);
  console.info(i18next.t('index.command.general') + ' ' + commandName);
});

// Setup DB
if (!existsSync('db')) {
  await mkdir('db');
}

// Logging in to discord and start server
try {
  client.login(config.TOKEN).catch((err) => LoginError(err));
} catch (err) {
  if (err instanceof Error) {
    LoginError(err);
  }
}

// Custom Bad Token Error Handling
function LoginError(err: Error) {
  console.info(
    i18next.t('error.occurred') + ' ' + err.message
      ? err.message == i18next.t('index.token.invalid')
        ? i18next.t('index.token.env')
        : err.message
      : err
  );
  process.exit();
}

// Custom Missing Env Vars Error Handling
function EnvError(err: MissingEnvVarsError) {
  console.info(
    i18next.t('error.occurred') + ' ' + err.missing
      ? `${i18next.t('index.env.missing')} ${err.missing
          .map((err) => `"${err}"`)
          .join(', ')}\n${i18next.t('index.env.add')}`
      : err.message
      ? err.message
      : err
  );
  process.exit();
}

/** Represents a Command */
export interface Command {
  info: {
    /** Name of the Command (filename) */
    name: string;
    description: string;
    /** Parameters / Arguments */
    usage: string;
    aliases: string[];
    categorie: 'general' | 'music';
    permissions: Permissions;
    /** Only show command in Docs not on Website or help */
    hidden?: boolean;
  };

  run: (client: Client, message: Message, args: string[]) => Promise<unknown>;

  interaction?: {
    options: ApplicationCommandOptionData[];
    run: (client: Client, interaction: CommandInteraction, helpers: Helpers) => Promise<unknown>;
  };
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
  LOCALE: typeof locales[number];
  PERMISSION: string;
  WEBSITE: string;
  SCOPES: string[];
  CALLBACK: string;
  SECRET: string;
  COOKIESECRET: string;
  DISABLEWEB: boolean;
  DIDYOUMEAN: boolean;
  GUILDPREFIX: boolean;
  GUILDACTIONS: boolean;
  UPDATEDIFF: number;
  SLASHCOMMANDS: boolean;
}

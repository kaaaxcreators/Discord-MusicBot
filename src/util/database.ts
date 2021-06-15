import { Message } from 'discord.js';
import jsoning from 'jsoning';

import { config } from '../index';
import console from './logger';

const database = <Customjsoning>new jsoning('db/guild.json');

export async function getGuild(guildID: string): Promise<Database | false> {
  try {
    const db = await database.get(guildID);
    if (!db) {
      database.set(guildID, { prefix: config.prefix });
      return { prefix: config.prefix };
    }
    return db;
  } catch (err) {
    console.error(err.message || err);
    return false;
  }
}

export async function getPrefix(message: Message): Promise<string> {
  if (message.channel.type == 'dm') {
    return config.prefix;
  } else {
    const guildDB = await getGuild(message.channel.guild.id);
    if (guildDB) {
      return guildDB.prefix;
    } else {
      return config.prefix;
    }
  }
}

export default database;

/** Represents a "Table" in the Database */
export interface Database {
  prefix: string;
}

export interface Customjsoning extends jsoning {
  set(key: string, value: Database): boolean;
  get(key: string): Promise<Database | false>;
}

import { Guild, Message } from 'discord.js';
import jsoning from 'jsoning';

import { config } from '../index';
import console from './logger';

const database = <Customjsoning>new jsoning('db/guild.json');

export async function getGuild(guildID: string): Promise<Database | false> {
  try {
    const db = await database.get(guildID);
    if (!db) {
      await database.set(guildID, { prefix: config.prefix });
      return { prefix: config.prefix };
    }
    return db;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err.message || err);
    return false;
  }
}
/**
 * @param  {Message|Guild} reference Message or Guild Object the reference origin/sender
 */
export async function getPrefix(reference: Message | Guild): Promise<string> {
  if (reference instanceof Message) {
    if (reference.channel.type == 'dm') {
      return config.prefix;
    } else {
      const guildDB = await getGuild(reference.channel.guild.id);
      if (guildDB) {
        return guildDB.prefix;
      } else {
        return config.prefix;
      }
    }
  } else if (reference instanceof Guild) {
    const guildDB = await getGuild(reference.id);
    if (guildDB) {
      return guildDB.prefix;
    } else {
      return config.prefix;
    }
  } else {
    return config.prefix;
  }
}

export default database;

/** Represents a "Table" in the Database */
export interface Database {
  prefix: string;
}

export interface Customjsoning extends jsoning {
  set(key: string, value: Database): Promise<boolean>;
  get(key: string): Promise<Database | false>;
}

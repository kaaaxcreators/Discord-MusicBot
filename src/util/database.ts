import { CommandInteraction, Guild, Message } from 'discord.js';
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
    if (err instanceof Error) {
      console.error(err.message);
    }
    return false;
  }
}
/**
 * @param  {Message|Guild} reference Message or Guild Object the reference origin/sender
 */
export async function getPrefix(reference: Message | Guild | CommandInteraction): Promise<string> {
  if (reference instanceof Message) {
    if (reference.channel.type == 'DM') {
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
  } else if (reference instanceof CommandInteraction) {
    const guildDB = await getGuild(reference.guildId!);
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
  set(key: string, value: Database): boolean;
  get(key: string): Promise<Database | false>;
}

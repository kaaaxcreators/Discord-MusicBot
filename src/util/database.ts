import jsoning from 'jsoning';

import { config } from '../index';

const database = <Customjsoning>new jsoning('db/guild.json');

export async function getGuild(guildID: string): Promise<Database | false> {
  try {
    const db = database.get(guildID);
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

export default database;

/** Represents a "Table" in the Database */
export interface Database {
  prefix: string;
}

export interface Customjsoning extends jsoning {
  set(key: string, value: Database): boolean;
  get(key: string): Database | false;
}

import jsoning from 'jsoning';

const database = <Customjsoning>new jsoning('guild.json');

export async function getGuild(guildID: string): Promise<Database | false> {
  try {
    return database.get(guildID);
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
}

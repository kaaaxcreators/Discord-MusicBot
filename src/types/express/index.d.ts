import { User as ApiData } from '@oauth-everything/passport-discord/dist/ApiData';
import { Profile } from '@oauth-everything/profile';
import { PartialGuild } from 'discord-oauth2'

declare global {
  namespace Express {
    interface User extends Profile<ApiData> {
      guilds?: GuildInfo[];
    }
    interface Request {
      user?: User;
    }
  }
}

interface GuildInfo extends PartialGuild {
  /** User has MANAGE_GUILD Permission */
  hasPerms?: boolean;
  /** Bot is in Server */
  inGuild?: boolean;
}

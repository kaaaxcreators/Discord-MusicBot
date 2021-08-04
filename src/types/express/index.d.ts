import { User as ApiData } from '@oauth-everything/passport-discord/dist/ApiData';
import { Profile } from '@oauth-everything/profile';

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

interface PartialGuild {
  id: string;
  name: string;
  icon: string | null | undefined;
  owner?: boolean;
  permissions?: number;
  features: string[];
  permissions_new?: string;
}

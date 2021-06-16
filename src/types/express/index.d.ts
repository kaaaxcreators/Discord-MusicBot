import { Profile } from 'passport-discord';

import { GuildInfo } from '../passport-discord/index';

declare global {
  namespace Express {
    interface User extends Profile {
      guilds?: GuildInfo[];
    }

    interface Request {
      user?: User;
    }
  }
}

import { GuildInfo } from '../passport-discord/index';

declare global {
  namespace Express {
    interface User {
      guilds?: GuildInfo[];
    }

    interface Request {
      user?: User;
    }
  }
}

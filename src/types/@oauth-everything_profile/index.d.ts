import { User } from '@oauth-everything/passport-discord/dist/ApiData';
import { Profile as oldProfile } from '@oauth-everything/profile';

declare module '@oauth-everything/profile' {
  export interface Profile extends oldProfile {
    accessToken?: string;
    refreshToken?: string;
    _json: User;
    /** UTC String**/
    lastUpdated?: string;
  }
}

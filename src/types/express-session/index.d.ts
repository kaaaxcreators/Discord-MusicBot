import { SessionData as sessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData extends sessionData {
    csrf?: string;
  }
}

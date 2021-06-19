import { Socket as OriginalSocket } from 'socket.io';

declare module 'socket.io' {
  socketIO;
  export declare class Socket extends OriginalSocket {
    Dashboard: NodeJS.Timeout;
    Server: NodeJS.Timeout;
  }
}

import pMS from 'pretty-ms';
import { Server } from 'socket.io';

import { config } from '../../index';
import ProgressBar from '../../util/ProgressBar';

let dashboard: NodeJS.Timeout;
let server: NodeJS.Timeout;

function socket(io: Server): void {
  io.on('connection', (socket) => {
    //Bot's Main Page
    socket.on('dashboard', () => {
      if (dashboard) clearInterval(dashboard);
      dashboard = setInterval(async () => {
        const { client } = await import('../../index');
        socket.emit('dashboard', {
          users: client.users.cache.size,
          guilds: client.guilds.cache.size
        });
      }, 1000);
    });

    socket.on('server', (ServerID) => {
      if (server) clearInterval(server);
      server = setInterval(async () => {
        const { client, queue } = await import('../../index');
        const Guild = client.guilds.cache.get(ServerID);
        if (!Guild) return socket.emit('error', 'Unable to find that server');
        const player = queue.get(Guild.id);
        if (!player) {
          socket.emit('server', {
            queue: 0,
            songsLoop: 'Disabled',
            prefix: config.prefix
          });
        } else {
          socket.emit('server', {
            queue: player.songs ? player.songs.length : 0,
            songsLoop: player.loop ? 'Enabled' : 'Disabled',
            prefix: config.prefix,
            bar:
              player.songs[0] && player.connection
                ? ProgressBar(player.connection.dispatcher.streamTime, player.songs[0].duration, 20)
                    .Bar
                : false,
            maxDuration:
              player.songs[0] && player.connection
                ? pMS(player.songs[0].duration, {
                    colonNotation: true,
                    secondsDecimalDigits: 0
                  })
                : false,
            position: player.connection
              ? pMS(player.connection.dispatcher.streamTime, {
                  colonNotation: true,
                  secondsDecimalDigits: 0
                })
              : false,
            nowPlaying: player.songs[0] ? player.songs[0] : false
          });
        }
      }, 1000);
    });
  });
}

export default socket;

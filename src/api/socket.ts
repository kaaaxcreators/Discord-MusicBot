import i18next from 'i18next';
import pMS from 'pretty-ms';
import { Server } from 'socket.io';

import ProgressBar from '../util/ProgressBar';

function socket(io: Server): void {
  io.on('connection', (socket) => {
    // Dashboard
    socket.on('dashboard', () => {
      if (socket.Dashboard) {
        clearInterval(socket.Dashboard);
      }
      socket.Dashboard = setInterval(async () => {
        const { client, Stats } = await import('../index.js');
        let totalvcs = 0;
        Array.from(client.guilds.cache).forEach((guild) => {
          if (guild[1].me?.voice.channel) {
            totalvcs += 1;
          }
        });
        socket.emit('dashboard', {
          users: client.users.cache.size,
          guilds: client.guilds.cache.size,
          uptime: pMS(client.uptime!, { secondsDecimalDigits: 0 }),
          avatarURL: client.user!.avatarURL()
            ? client.user!.avatarURL()
            : 'https://i.imgur.com/fFReq20.png',
          username: client.user!.username,
          totalvcs: totalvcs,
          commandsRan: Stats.commandsRan,
          songsPlayed: Stats.songsPlayed
        });
      }, 1000);
    });

    // Get Information about specific Server
    socket.on('server', (ServerID) => {
      if (socket.Server) {
        clearInterval(socket.Server);
      }
      socket.Server = setInterval(async () => {
        const { client, queue } = await import('../index.js');
        const { getPrefix } = await import('../util/database.js');
        const Guild = client.guilds.cache.get(ServerID);
        const prefix = await getPrefix(Guild!);
        if (!Guild) {
          return socket.emit('error', 'Unable to find that server');
        }
        const player = queue.get(Guild.id);
        if (!player) {
          socket.emit('server', {
            queue: 0,
            songsLoop: i18next.t('socket.disabled'),
            prefix: prefix
          });
        } else {
          socket.emit('server', {
            queue: player.queue ? player.queue.length : 0,
            songsLoop: player.loop ? i18next.t('socket.enabled') : i18next.t('socket.disabled'),
            prefix: prefix,
            bar:
              player.queue[0] && player.currentResource
                ? player.queue[0].live
                  ? '▇—▇—▇—▇—▇—▇—▇—▇—▇—▇—'
                  : ProgressBar(
                      player.currentResource.playbackDuration,
                      player.queue[0].duration,
                      20
                    ).Bar
                : false,
            maxDuration:
              player.queue[0] && player.currentResource
                ? player.queue[0].live
                  ? i18next.t('nowplaying.live')
                  : pMS(player.queue[0].duration, {
                      colonNotation: true,
                      secondsDecimalDigits: 0
                    })
                : false,
            position: player.currentResource
              ? pMS(player.currentResource.playbackDuration, {
                  colonNotation: true,
                  secondsDecimalDigits: 0
                })
              : false,
            nowPlaying: player.queue[0] ? player.queue[0] : false
          });
        }
      }, 1000);
    });
  });
}

export default socket;

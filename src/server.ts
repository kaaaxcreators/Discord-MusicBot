import { Client } from 'discord.js';
import express from 'express';
import { Server } from 'http';
import i18n from 'i18n';
import moment from 'moment';
import pMS from 'pretty-ms';

import { config } from './index';
import console from './util/logger';
i18n.setLocale(config.LOCALE);

let app: Server;

async function keepAlive(client: Client): Promise<void> {
  const server = express();
  // Get Port from Env or Fixed (for Heroku)
  const port = process.env.PORT || 8080;
  // Get Array of all Guilds
  const guilds = client.guilds.cache.map((guilds) => guilds);
  let totalmembers = 0;
  // Get Member Count (Bots included)
  for (const guild of guilds) {
    totalmembers += guild.memberCount;
  }
  const uptime = new Date(Date.now() - client.uptime!);
  server.all('/', (req, res) => {
    // Cool Website
    res.send(
      `<b><img src="${client.user?.avatarURL()}" /><br>${
        client.user?.username
      }</b> is ready!<br>ClientID: <b>${client.user!.id}</b><br>Serving in <b>${
        guilds.length
      }</b> Servers with a Total of <b>${JSON.stringify(
        totalmembers
      )}</b> Members<br>Running since: <b>${uptime.toLocaleString()}</b> - Uptime: <b>${pMS(
        client.uptime!
      )}</b> - Started: <b>${moment(uptime).fromNow()}</b>`
    );
  });
  app = server.listen(port, () => {
    console.info(i18n.__('server.ready'));
  });
}

function exit(): void {
  app.close();
}

export default keepAlive;
export { exit };

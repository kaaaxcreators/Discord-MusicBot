import { Client } from 'discord.js';
import express from 'express';
import pMS from 'pretty-ms';

function keepAlive(client: Client): void {
  const server = express();
  // Get Port from Env or Fixed (for Heroku)
  const port = process.env.PORT || 8080;
  server.all('/', (req, res) => {
    // Send IFrame of Discord Server
    res.send(
      `<b><img src="${client.user?.avatarURL()}" /><br>${
        client.user?.username
      }</b> is ready!<br>ClientID: <b>${client.user!.id}</b><br>Serving in <b>${
        client.guilds.cache.size
      }</b> Servers<br>Running since: <b>${new Date(
        Date.now() - client.uptime!
      ).toLocaleString()}</b> - Uptime: <b>${pMS(client.uptime!)}</b>`
    );
  });
  server.listen(port, () => {
    console.log('Server is Ready!');
  });
}

export default keepAlive;

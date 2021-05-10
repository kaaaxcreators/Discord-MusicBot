import { Client } from 'discord.js';

module.exports = async (client: Client) => {
  console.log(`[API] Logged in as ${client.user?.username}`);
  await client.user?.setActivity(`${process.env.PRESENCE} | ${process.env.PREFIX}help`, {
    type: 'PLAYING' //can be LISTENING, WATCHING, PLAYING, STREAMING
  });
};

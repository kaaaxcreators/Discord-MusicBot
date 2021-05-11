import { Client } from 'discord.js';

module.exports = async (client: Client) => {
  console.log(`[API] Logged in as ${client.user?.username}`);
  client.user.setPresence({
    status: 'online', // You can show online, idle, and dnd
    activity: {
      name: 'Music', // The message shown
      type: 'LISTENING' // PLAYING, WATCHING, LISTENING, STREAMING,
    }
  });
};

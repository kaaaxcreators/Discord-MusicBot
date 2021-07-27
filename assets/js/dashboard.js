document.addEventListener('DOMContentLoaded', async () => {
  const result = await fetch('/api/user');
  const { user } = await result.json();
  document
    .querySelector('#usericon')
    .setAttribute('src', `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`);
  document.querySelector('#username').textContent = `${user.username}#${user.discriminator}`;
  // eslint-disable-next-line no-undef
  const socket = io();
  socket.emit('dashboard');
  socket.on('dashboard', (data) => {
    document.querySelector('#users').textContent = data.users;
    document.querySelector('#guilds').textContent = data.guilds;
    document.querySelector('#uptime').textContent = data.uptime;
    document.querySelector('#avatar').textContent = data.avatarURL;
    document
      .querySelectorAll('.server-name')
      .forEach((element) => (element.textContent = data.username));
    document.querySelector('#totalvcs').textContent = data.totalvcs;
    document.querySelector('#commandsRan').textContent = data.commandsRan;
    document.querySelector('#songsPlayed').textContent = data.songsPlayed;
  });
});

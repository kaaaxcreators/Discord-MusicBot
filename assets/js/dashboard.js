$(document).ready(() => {
  $.get('/api/user', ({ user }) => {
    $('#usericon').attr('src', `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`);
    $('#username').text(`${user.username}#${user.discriminator}`);
  });
  // eslint-disable-next-line no-undef
  const socket = io();
  socket.emit('dashboard');
  socket.on('dashboard', (data) => {
    $('#users').text(data.users);
    $('#guilds').text(data.guilds);
    $('#uptime').text(data.uptime);
    $('#avatar').prop('src', data.avatarURL);
    $('.server-name').text(data.username);
    $('#totalvcs').text(data.totalvcs);
    $('#commandsRan').text(data.commandsRan);
    $('#songsPlayed').text(data.songsPlayed);
  });
});

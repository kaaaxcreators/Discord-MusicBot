/* eslint-disable no-undef */
$(document).ready(() => {
  const socket = io();
  socket.emit('dashboard');
  socket.on('dashboard', (data) => {
    $('#users').text(data.users);
    $('#guilds').text(data.guilds);
    $('#uptime').text(data.uptime);
    $('#avatar').prop('src', data.avatarURL);
    $('.server-name').text(data.username);
  });
});

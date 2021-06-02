/* eslint-disable no-undef */
$(document).ready(() => {
  $.get('/api/user', (data) => {
    data.user.guilds.forEach((Guild) => {
      if (!Guild.hasPerms) return;
      $('#servers').append(`
<img class="server-${Guild.id}${
        Guild.inGuild ? '' : ' grayscale'
      }" onclick="window.location = '/servers/${Guild.id}'" width="60" height="60" src="${
        Guild.icon
          ? `https://cdn.discordapp.com/icons/${Guild.id}/${Guild.icon}.png`
          : 'https://i.imgur.com/fFReq20.png'
      }" alt="${Guild.name}">
`);
      $(`.server-${Guild.id}`).hover(() => {
        $('.server-name').text(Guild.name);
      });
    });
  });
});

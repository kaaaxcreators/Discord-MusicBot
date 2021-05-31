/* eslint-disable no-undef */
$(document).ready(() => {
  $.get('/api/user', (data) => {
    data.user.guilds.forEach((Guild) => {
      if (!Guild.hasPerms) return;
      $('#servers').append(`
<img class="server-${Guild.id}" onclick="window.location = '/servers/${
        Guild.id
      }'" width="60" height="60" src="${
        Guild.icon
          ? `https://cdn.discordapp.com/icons/${Guild.id}/${Guild.icon}.png`
          : 'https://www.webcolorsonline.com/images/error.png'
      }" alt="${Guild.name}">
`);
      $(`.server-${Guild.id}`).hover(() => {
        $('.server-name').text(Guild.name);
      });
    });
  });
});

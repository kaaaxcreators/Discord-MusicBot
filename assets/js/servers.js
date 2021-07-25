$(document).ready(() => {
  $.get('/api/user', ({ user }) => {
    $('#usericon').attr('src', `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`);
    $('#username').text(`${user.username}#${user.discriminator}`);
  });
  $.get('/api/user', (data) => {
    data.user.guilds.forEach((Guild) => {
      if (!Guild.hasPerms) {
        return;
      }
      $('#servers').append(`
<a href="/servers/${Guild.id}">
  <img class="server-${Guild.id}${Guild.inGuild ? '' : ' grayscale'}" width="60" height="60" src="${
        Guild.icon
          ? `https://cdn.discordapp.com/icons/${Guild.id}/${Guild.icon}.png`
          : 'https://i.imgur.com/fFReq20.png'
      }" alt="${Guild.name}">
</a>
`);
      $(`.server-${Guild.id}`).on('mouseenter', () => {
        $('.server-name').text(Guild.name);
      });
      $(`.server-${Guild.id}`)
        .parent()
        .on('focus', () => {
          $('.server-name').text(Guild.name);
        });
    });
  });
});

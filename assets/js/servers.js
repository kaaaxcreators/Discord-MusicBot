$(document).ready(() => {
  $.get('/api/user', (data) => {
    $('#usericon').attr(
      'src',
      `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}`
    );
    $('#username').text(`${data.user.username}#${data.user.discriminator}`);
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

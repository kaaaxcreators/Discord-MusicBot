/* eslint-disable no-undef */
$(document).ready(() => {
  $.get('/api/user', (data) => {
    let Guild = data.user.guilds.find((x) => x.id == window.location.pathname.split('/')[2]);
    if (!Guild.inGuild) {
      $.get('/api/info', (data) => {
        window.location = `https://discord.com/oauth2/authorize?client_id=${
          data.ClientID
        }&permissions=${data.Permissions}&scope=bot%20${data.Scopes.join('%20')}&redirect_uri=${
          data.Website
        }${data.CallbackURL}&response_type=code`;
      });
    }
    $('.server-name').text(Guild.name);
  });
});

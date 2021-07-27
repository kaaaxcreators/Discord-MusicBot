document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/user')
    .then((res) => res.json())
    .then((data) => {
      document
        .querySelector('#usericon')
        .setAttribute(
          'src',
          `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}`
        );
      document.querySelector(
        '#username'
      ).textContent = `${data.user.username}#${data.user.discriminator}`;
      data.user.guilds.forEach((Guild) => {
        if (!Guild.hasPerms) {
          return;
        }
        document.querySelector('#servers').innerHTML += `
<a href="/servers/${Guild.id}">
  <img class="server-${Guild.id}${Guild.inGuild ? '' : ' grayscale'}" width="60" height="60" src="${
          Guild.icon
            ? `https://cdn.discordapp.com/icons/${Guild.id}/${Guild.icon}.png`
            : 'https://i.imgur.com/fFReq20.png'
        }" alt="${Guild.name}">
</a>
`;
        document.querySelector(`.server-${Guild.id}`).addEventListener('mouseenter', () => {
          document.querySelector('.server-name').textContent = Guild.name;
        });
        document
          .querySelector(`.server-${Guild.id}`)
          .parentElement.addEventListener('focus', () => {
            $('.server-name').text(Guild.name);
          });
      });
    });
});

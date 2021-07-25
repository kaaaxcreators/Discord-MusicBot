// https://stackoverflow.com/a/12034334/13707908
var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=\\/]/g, function (s) {
    return entityMap[s];
  });
}

$(document).ready(() => {
  $.get('/api/info', (data) => {
    const url = `https://discord.com/oauth2/authorize?client_id=${data.ClientID}&permissions=${
      data.Permissions
    }&scope=${data.Scopes.join('%20')}&redirect_uri=${data.Website}${
      data.CallbackURL
    }&response_type=code`;
    $('#hero').append(`<a href="${url}" class="btn btn-primary" type="button">Invite</a>
    <a href="/dashboard" class="btn btn-outline-primary" type="button">Dashboard</a>`);
  });
  $.get('/api/commands', (data) => {
    data.commands.forEach((cmd) => {
      $('#commands-body').append(`<tr>
<th scope="row">${cmd.name}</th>
<td>${cmd.aliases ? cmd.aliases.join(', ') : ''}</td>
<td>${cmd.usage ? escapeHtml(cmd.usage) : ''}</td>
<td>${cmd.description ? cmd.description : ''}</td>
</tr>`);
    });
  });
});

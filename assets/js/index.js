/* eslint-disable no-undef */
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

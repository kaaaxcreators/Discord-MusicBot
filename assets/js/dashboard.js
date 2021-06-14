/* eslint-disable no-undef */

function translate(json) {
  const varTags = Array.from(document.getElementsByTagName('var'));
  varTags.forEach((v, i) => {
    try {
      if (varTags[i].parentElement.childElementCount > 1) {
        varTags[i].textContent = new Function(
          'return this.' + varTags[i].textContent.toLowerCase() + ';'
        ).call(json);
      } else {
        varTags[i].parentElement.textContent = new Function(
          'return this.' + varTags[i].textContent.toLowerCase() + ';'
        ).call(json);
      }
    } catch (e) {
      varTags[i].textContent = '';
      console.warn('Error in <var/> Tag: ' + e.message);
    }
  });
}

$(document).ready(() => {
  $.get('/api/translations', ({ translations, locale }) => {
    document.documentElement.lang = locale;
    translate(translations);
  });
  const socket = io();
  socket.emit('dashboard');
  socket.on('dashboard', (data) => {
    $('#users').text(data.users);
    $('#guilds').text(data.guilds);
    $('#uptime').text(data.uptime);
    $('#avatar').prop('src', data.avatarURL);
    $('.server-name').text(data.username);
    $('#totalvcs').text(data.totalvcs);
  });
});

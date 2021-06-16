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
  $('[data-toggle="tooltip"]').tooltip();
  $('#changeprefixsubmit').on('click', null, null, () => {
    fetch(
      `/api/settings/${window.location.pathname.split('/')[2]}?prefix=${$('#newprefix').val()}`,
      { method: 'POST' }
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error('Response is not okay');
        } else {
          $('#changePrefix').modal('toggle');
        }
      })
      .catch((err) => console.error(err.message || err));
  });
  let translation = {};
  $.get('/api/translations', ({ translations, locale }) => {
    document.documentElement.lang = locale;
    translation = translations;
    translate(translations);
  });
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
  var socket = io();
  socket.emit('server', window.location.pathname.split('/')[2]);

  socket.on('server', (data) => {
    $('#songLoop').text(data.songsLoop);
    $('#songInQueue').text(data.queue);
    $('#prefix').text(data.prefix);
    if (data.nowPlaying) {
      $('#now-playing').text(data.nowPlaying.title);
      $('#now-playing').replaceWith("<a id='now-playing'>" + $('#now-playing').html() + '</a>');
      $('#now-playing').attr('href', data.nowPlaying.url);
      $('#now-playing').attr('target', '_blank');
    } else {
      $('#now-playing').text(translation.web.server.song.nothing);
      $('#now-playing').replaceWith(
        "<span id='now-playing'>" + $('#now-playing').html() + '</span>'
      );
    }
    if (data.position) {
      $('#duration').html(`${data.position}<span> ${data.bar} </span>${data.maxDuration}`);
    } else {
      $('#duration').html(`<span> ${translation.web.server.song.nothingrn} </span>`);
    }
  });
});

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
  $('#changeprefixsubmit').on('click', null, null, () => {
    fetch(`/api/prefix/${window.location.pathname.split('/')[2]}/${$('#newprefix').val()}`, {
      method: 'POST'
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`${res.statusText}`);
        } else {
          $('#changePrefix').modal('toggle');
        }
      })
      .catch((err) => {
        console.error(err.message || err);
        $('#prefixmodalerror').text(err.message || err);
      });
  });
  $('#addsongsubmit').on('click', null, null, () => {
    $('#songmodalerror').text('🔍 Searching...');
    fetch(
      `/api/queue/${window.location.pathname.split('/')[2]}/add/${encodeURIComponent(
        $('#addSongSong').val()
      )}`,
      {
        method: 'POST'
      }
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(`${res.statusText}`);
        } else {
          $('#addSong').modal('toggle');
          $('#songmodalerror').text('');
        }
      })
      .catch((err) => {
        console.error(err.message || err);
        $('#songmodalerror').text(err.message || err);
      });
  });
  $('#skipsong').on('click', null, null, () => {
    fetch(`/api/queue/${window.location.pathname.split('/')[2]}/skip`, {
      method: 'POST'
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`${res.statusText}`);
        } else {
          res.json().then((json) => {
            $('#customToastBody').text(`${json.status} Song`);
            $('#customToast').toast('show');
          });
        }
      })
      .catch((err) => {
        console.error(err.message || err);
      });
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
  // eslint-disable-next-line no-undef
  var socket = io();
  socket.emit('server', window.location.pathname.split('/')[2]);

  socket.on('server', (data) => {
    $('#songLoop').text(data.songsLoop);
    $('#songInQueue').text(data.queue);
    $('#prefix').text(data.prefix);
    $('#newprefix').attr('placeholder', data.prefix);
    if (data.nowPlaying) {
      $('.needsqueue').show();
      $('#now-playing').text(data.nowPlaying.title);
      $('#now-playing').replaceWith("<a id='now-playing'>" + $('#now-playing').html() + '</a>');
      $('#now-playing').attr('href', data.nowPlaying.url);
      $('#now-playing').attr('target', '_blank');
    } else {
      $('.needsqueue').hide();
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

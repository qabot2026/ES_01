(function () {
  'use strict';

  var KEY = 'qa_live_agent_desk';
  var state = { folders: [], filtered: [] };

  function desk() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function headers() {
    var d = desk();
    var h = { 'Content-Type': 'application/json' };
    if (d.token) h['X-Agent-Token'] = d.token;
    return h;
  }

  function apiBase() {
    return (desk().apiBase || window.location.origin).replace(/\/$/, '');
  }

  if (!desk().token) {
    window.location.href = '../live-agent/settings.html?next=' +
      encodeURIComponent('dashboard/documents.html');
    return;
  }

  function formatBytes(n) {
    var b = Number(n) || 0;
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      var d = new Date(iso);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return iso;
    }
  }

  function fileExt(name) {
    var m = String(name || '').match(/\.([^.]+)$/);
    return m ? m[1].toUpperCase().slice(0, 4) : 'FILE';
  }

  function showAlert(msg) {
    var el = document.getElementById('docs-alert');
    el.hidden = !msg;
    el.textContent = msg || '';
  }

  function applyFilter() {
    var q = String(document.getElementById('docs-search').value || '')
      .trim()
      .toLowerCase();
    if (!q) {
      state.filtered = state.folders.slice();
    } else {
      state.filtered = state.folders.filter(function (f) {
        var hay =
          (f.storage_folder || '') +
          ' ' +
          (f.mobile || '') +
          ' ' +
          (f.name || '') +
          ' ' +
          (f.email || '') +
          ' ' +
          (f.session_id || '');
        f.files.forEach(function (file) {
          hay += ' ' + (file.file_name || '');
        });
        return hay.toLowerCase().indexOf(q) >= 0;
      });
    }
    renderGrid();
  }

  function renderGrid() {
    var grid = document.getElementById('docs-grid');
    var list = state.filtered;
    var totalFiles = 0;
    list.forEach(function (f) {
      totalFiles += f.file_count || 0;
    });
    document.getElementById('docs-count-folders').textContent = String(list.length);
    document.getElementById('docs-count-files').textContent = String(totalFiles);

    if (!list.length) {
      grid.innerHTML =
        '<p class="docs-empty">No uploads found. Try another search or upload a document in chat.</p>';
      return;
    }

    grid.innerHTML = list
      .map(function (f, idx) {
        var title = f.name || f.mobile || f.storage_folder || 'Upload';
        var sub = [];
        if (f.mobile) sub.push('+' + f.mobile.replace(/^(\d{2})/, '$1 ').replace(/(\d{10})$/, ' $1'));
        if (f.email) sub.push(f.email);
        if (f.session_id) {
          sub.push(
            '<a href="../transcript.html?session=' +
              encodeURIComponent(f.session_id) +
              '" onclick="event.stopPropagation()">Chat script</a>'
          );
        }
        return (
          '<article class="docs-card" data-idx="' +
          idx +
          '" tabindex="0">' +
          '<div class="docs-card__top">' +
          '<span class="docs-card__badge">Upload #' +
          (f.sequence || '—') +
          '</span>' +
          '<span class="docs-card__date">' +
          (f.date_display || formatDate(f.updated_at)) +
          '</span></div>' +
          '<h3>' +
          escapeHtml(title) +
          '</h3>' +
          '<p class="docs-card__meta">' +
          (sub.length ? sub.join(' · ') : escapeHtml(f.storage_folder)) +
          '</p>' +
          '<div class="docs-card__footer">' +
          '<span class="docs-card__files">' +
          (f.file_count || 0) +
          ' file' +
          ((f.file_count || 0) === 1 ? '' : 's') +
          '</span>' +
          '<span class="docs-card__size">' +
          formatBytes(f.total_bytes) +
          '</span></div></article>'
        );
      })
      .join('');

    grid.querySelectorAll('.docs-card').forEach(function (card) {
      card.addEventListener('click', function () {
        openModal(state.filtered[Number(card.getAttribute('data-idx'))]);
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(state.filtered[Number(card.getAttribute('data-idx'))]);
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openModal(folder) {
    var modal = document.getElementById('docs-modal');
    document.getElementById('docs-modal-title').textContent =
      folder.name || folder.mobile || 'Upload';
    document.getElementById('docs-modal-sub').textContent =
      (folder.date_display ? folder.date_display + ' · ' : '') +
      (folder.storage_folder || '');
    var list = document.getElementById('docs-modal-files');
    list.innerHTML = (folder.files || [])
      .map(function (file) {
        return (
          '<li class="docs-file-item">' +
          '<div class="docs-file-icon">' +
          escapeHtml(fileExt(file.file_name)) +
          '</div>' +
          '<div class="docs-file-info">' +
          '<strong>' +
          escapeHtml(file.file_name) +
          '</strong>' +
          '<span>' +
          formatBytes(file.size_bytes) +
          ' · ' +
          formatDate(file.uploaded_at) +
          '</span></div>' +
          '<button type="button" class="docs-view" data-object="' +
          escapeHtml(file.gcs_object) +
          '">View</button>' +
          '<button type="button" class="docs-download" data-object="' +
          escapeHtml(file.gcs_object) +
          '">Download</button></li>'
        );
      })
      .join('');

    list.querySelectorAll('.docs-download, .docs-view').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openSignedUrl(btn, btn.classList.contains('docs-view'));
      });
    });

    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
  }

  function openSignedUrl(btn, viewOnly) {
    var object = btn.getAttribute('data-object');
    if (!object) return;
    var label = viewOnly ? 'View' : 'Download';
    btn.disabled = true;
    btn.textContent = '…';
    fetch(
      apiBase() +
        '/api/documents/download-url?object=' +
        encodeURIComponent(object),
      { headers: headers() }
    )
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data.ok || !data.url) {
          alert(data.message || 'Could not get file link.');
          return;
        }
        if (viewOnly) {
          window.open(data.url, '_blank', 'noopener,noreferrer');
        } else {
          var a = document.createElement('a');
          a.href = data.url;
          a.download = data.file_name || '';
          a.rel = 'noopener noreferrer';
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      })
      .catch(function () {
        alert('Request failed.');
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
  }

  function load() {
    showAlert('');
    document.getElementById('docs-grid').innerHTML =
      '<p class="docs-loading">Loading documents…</p>';
    fetch(apiBase() + '/api/documents/catalog', { headers: headers() })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data.ok) {
          if (data.error === 'gcs_not_configured') {
            showAlert(
              'Cloud storage is not configured. Set GCS_BUCKET_NAME on Railway.'
            );
          } else if (data.error === 'unauthorized') {
            window.location.href = '../live-agent/settings.html';
            return;
          } else {
            showAlert(data.message || 'Could not load documents.');
          }
          document.getElementById('docs-grid').innerHTML = '';
          return;
        }
        state.folders = data.folders || [];
        applyFilter();
      })
      .catch(function () {
        showAlert('Network error. Check desk token and server.');
        document.getElementById('docs-grid').innerHTML = '';
      });
  }

  document.getElementById('docs-refresh').addEventListener('click', load);
  document.getElementById('docs-search').addEventListener('input', applyFilter);
  document.getElementById('docs-modal-close').addEventListener('click', function () {
    document.getElementById('docs-modal').close();
  });

  load();
})();

(function () {
  'use strict';

  var KEY = 'qa_live_agent_desk';
  var state = { rows: [], filtered: [] };

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
    window.location.href =
      '../live-agent/settings.html?next=' +
      encodeURIComponent('dashboard/documents.html');
    return;
  }

  function formatBytes(n) {
    var b = Number(n) || 0;
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatDate(iso, dateDisplay) {
    if (dateDisplay) return dateDisplay;
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-IN', {
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

  function formatMobile(m) {
    if (!m) return '—';
    var s = String(m).replace(/\D/g, '');
    if (s.length >= 12 && s.indexOf('91') === 0) {
      return '91 ' + s.slice(2, 4) + ' ' + s.slice(4);
    }
    return s;
  }

  function fileExt(name) {
    var m = String(name || '').match(/\.([^.]+)$/i);
    return m ? m[1].toUpperCase() : '';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showAlert(msg) {
    var el = document.getElementById('docs-alert');
    el.hidden = !msg;
    el.textContent = msg || '';
  }

  function foldersToRows(folders) {
    var rows = [];
    (folders || []).forEach(function (f) {
      (f.files || []).forEach(function (file) {
        rows.push({
          file_name: file.file_name,
          gcs_object: file.gcs_object,
          size_bytes: file.size_bytes,
          uploaded_at: file.uploaded_at,
          name: f.name || '',
          mobile: f.mobile || '',
          email: f.email || '',
          date_display: f.date_display || '',
          updated_at: f.updated_at || file.uploaded_at,
          session_id: f.session_id || '',
          storage_folder: f.storage_folder || '',
        });
      });
    });
    rows.sort(function (a, b) {
      return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
    });
    return rows;
  }

  function updateSummary() {
    var folders = {};
    var totalBytes = 0;
    state.filtered.forEach(function (r) {
      folders[r.storage_folder] = true;
      totalBytes += r.size_bytes || 0;
    });
    document.getElementById('docs-count-submissions').textContent = String(
      Object.keys(folders).length
    );
    document.getElementById('docs-count-files').textContent = String(
      state.filtered.length
    );
    document.getElementById('docs-count-size').textContent = formatBytes(totalBytes);
    document.getElementById('docs-showing').textContent =
      state.filtered.length === state.rows.length
        ? 'Showing all ' + state.rows.length + ' documents'
        : 'Showing ' + state.filtered.length + ' of ' + state.rows.length;
  }

  function applyFilter() {
    var q = String(document.getElementById('docs-search').value || '')
      .trim()
      .toLowerCase();
    if (!q) {
      state.filtered = state.rows.slice();
    } else {
      state.filtered = state.rows.filter(function (r) {
        var hay =
          (r.file_name || '') +
          ' ' +
          (r.name || '') +
          ' ' +
          (r.mobile || '') +
          ' ' +
          (r.email || '') +
          ' ' +
          (r.storage_folder || '') +
          ' ' +
          (r.session_id || '');
        return hay.toLowerCase().indexOf(q) >= 0;
      });
    }
    renderTable();
  }

  function renderTable() {
    var tbody = document.getElementById('docs-tbody');
    updateSummary();

    if (!state.filtered.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="docs-table__empty">No documents found.</td></tr>';
      return;
    }

    tbody.innerHTML = state.filtered
      .map(function (r) {
        var customer = r.name || r.email || '—';
        var ext = fileExt(r.file_name);
        return (
          '<tr>' +
          '<td><span class="docs-file-name">' +
          escapeHtml(r.file_name) +
          '</span>' +
          (ext
            ? '<span class="docs-file-type">' + escapeHtml(ext) + '</span>'
            : '') +
          '</td>' +
          '<td>' +
          escapeHtml(customer) +
          '</td>' +
          '<td>' +
          escapeHtml(formatMobile(r.mobile)) +
          '</td>' +
          '<td>' +
          escapeHtml(formatDate(r.uploaded_at, r.date_display)) +
          '</td>' +
          '<td>' +
          formatBytes(r.size_bytes) +
          '</td>' +
          '<td><div class="docs-actions">' +
          '<button type="button" class="docs-view" data-object="' +
          escapeHtml(r.gcs_object) +
          '">View</button>' +
          '<span class="docs-sep">|</span>' +
          '<button type="button" class="docs-download" data-object="' +
          escapeHtml(r.gcs_object) +
          '" data-filename="' +
          escapeHtml(r.file_name) +
          '">Download</button>' +
          (r.session_id
            ? '<span class="docs-sep">|</span><a class="docs-link-transcript" href="../transcript.html?session=' +
              encodeURIComponent(r.session_id) +
              '">Chat</a>'
            : '') +
          '</div></td></tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('.docs-view').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openView(btn);
      });
    });
    tbody.querySelectorAll('.docs-download').forEach(function (btn) {
      btn.addEventListener('click', function () {
        downloadFile(btn);
      });
    });
  }

  function openView(btn) {
    var object = btn.getAttribute('data-object');
    if (!object) return;
    btn.disabled = true;
    var prev = btn.textContent;
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
          alert(data.message || 'Could not open file.');
          return;
        }
        window.open(data.url, '_blank', 'noopener,noreferrer');
      })
      .catch(function () {
        alert('Request failed.');
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = prev || 'View';
      });
  }

  function downloadFile(btn) {
    var object = btn.getAttribute('data-object');
    var fileName = btn.getAttribute('data-filename') || 'download';
    var token = desk().token;
    if (!object || !token) return;

    btn.disabled = true;
    var prev = btn.textContent;
    btn.textContent = '…';

    fetch(
      apiBase() +
        '/api/documents/download?object=' +
        encodeURIComponent(object),
      { headers: headers() }
    )
      .then(function (r) {
        if (!r.ok) {
          return r.json().then(function (data) {
            throw new Error((data && data.message) || 'Download failed.');
          });
        }
        return r.blob().then(function (blob) {
          return { blob: blob, fileName: fileName };
        });
      })
      .then(function (result) {
        var url = URL.createObjectURL(result.blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 2000);
      })
      .catch(function (err) {
        alert(err.message || 'Download failed.');
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = prev || 'Download';
      });
  }

  function load() {
    showAlert('');
    document.getElementById('docs-tbody').innerHTML =
      '<tr><td colspan="6" class="docs-table__empty">Loading…</td></tr>';
    fetch(apiBase() + '/api/documents/catalog', { headers: headers() })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data.ok) {
          if (data.error === 'gcs_not_configured') {
            showAlert('Storage not configured. Set GCS_BUCKET_NAME on Railway.');
          } else if (data.error === 'unauthorized') {
            window.location.href = '../live-agent/settings.html';
            return;
          } else {
            showAlert(data.message || 'Could not load documents.');
          }
          document.getElementById('docs-tbody').innerHTML =
            '<tr><td colspan="6" class="docs-table__empty">—</td></tr>';
          return;
        }
        state.rows = foldersToRows(data.folders || []);
        applyFilter();
      })
      .catch(function () {
        showAlert('Network error. Check desk token and server.');
        document.getElementById('docs-tbody').innerHTML =
          '<tr><td colspan="6" class="docs-table__empty">—</td></tr>';
      });
  }

  document.getElementById('docs-refresh').addEventListener('click', load);
  document.getElementById('docs-search').addEventListener('input', applyFilter);
  load();
})();

(function () {
  'use strict';

  var auth = window.DashboardDeskAuth;
  var state = { rows: [], filtered: [] };

  if (!auth || !auth.requireAuthOrRedirect('dashboard/documents.html')) {
    return;
  }

  function headers() {
    return auth.authHeaders({ 'Content-Type': 'application/json' });
  }

  function apiBase() {
    return auth.apiBase();
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
      var dd = window.QADateDisplay;
      var dayPart = dd && dd.formatDateDisplay
        ? dd.formatDateDisplay(String(iso).slice(0, 10))
        : String(iso).slice(0, 10);
      var timePart = new Date(iso).toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return dayPart + ', ' + timePart;
    } catch (e) {
      return iso;
    }
  }

  function formatMobile(mobile, dialCode) {
    if (!mobile) return '—';
    var raw = String(mobile).trim();
    var compact = raw.replace(/\s+/g, '');
    var digits = compact.replace(/\D/g, '');
    var dial = String(dialCode || '').replace(/\D/g, '');

    if (/^\+?\d{11,}$/.test(compact) || digits.length > 10) {
      var local = digits.slice(-10);
      var dialDigits = dial || digits.slice(0, digits.length - 10);
      if (!dialDigits && local.length === 10) dialDigits = '91';
      if (dialDigits && local) return dialDigits + ' ' + local;
      return digits;
    }

    if (!dial && digits.length === 10) dial = '91';
    var local = digits;
    if (dial && local.indexOf(dial) === 0 && local.length > dial.length) {
      local = local.slice(dial.length);
    }
    if (local.length > 10) local = local.slice(-10);
    if (dial && local) return dial + ' ' + local;
    return raw.replace(/^\+/, '').trim() || '—';
  }

  function transcriptSessionId(r) {
    var sid = String((r && r.session_id) || '').trim();
    if (sid) return sid;
    var folder = String((r && r.storage_folder) || '').trim();
    var m = folder.match(/^(.+)__(\d{2})_(\d{2})_(\d{4})_(\d+)$/);
    return m ? m[1] : '';
  }

  var COPY_LINK_ICON =
    '<svg class="docs-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z"/></svg>';

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
    var seenObjects = {};
    (folders || []).forEach(function (f) {
      (f.files || []).forEach(function (file) {
        var obj = file.gcs_object || '';
        if (obj && seenObjects[obj]) return;
        if (obj) seenObjects[obj] = true;
        rows.push({
          file_name: file.file_name,
          gcs_object: file.gcs_object,
          size_bytes: file.size_bytes,
          uploaded_at: file.uploaded_at,
          name: f.name || '',
          mobile: f.mobile || '',
          dial_code: f.dial_code || '',
          email: f.email || '',
          date_display: f.date_display || '',
          updated_at: f.updated_at || file.uploaded_at,
          session_id: file.session_id || f.session_id || '',
          storage_folder: f.storage_folder || '',
          tag: file.tag || f.tag || '',
          storage_link: file.storage_link || '',
        });
      });
    });
    rows.sort(function (a, b) {
      return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
    });
    return dedupeSubmissionRows(rows);
  }

  function dedupeSubmissionRows(rows) {
    var best = {};
    (rows || []).forEach(function (r) {
      var sid = String(r.session_id || '').trim();
      var fn = String(r.file_name || '').trim().toLowerCase();
      var sz = String(r.size_bytes || '0');
      var mob = String(r.mobile || '').replace(/\D/g, '');
      var key =
        sid && fn
          ? 's:' + sid + ':' + fn + ':' + sz
          : mob && fn
            ? 'm:' + mob + ':' + fn + ':' + sz
            : 'o:' + (r.gcs_object || '');
      if (
        !best[key] ||
        String(r.updated_at || '').localeCompare(String(best[key].updated_at || '')) > 0
      ) {
        best[key] = r;
      }
    });
    return Object.keys(best).map(function (k) {
      return best[k];
    });
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
          (r.session_id || '') +
          ' ' +
          (r.tag || '');
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
        '<tr><td colspan="8" class="docs-table__empty">No documents found.</td></tr>';
      return;
    }

    tbody.innerHTML = state.filtered
      .map(function (r) {
        var displayName = r.name || '—';
        var chatSid = transcriptSessionId(r);
        return (
          '<tr>' +
          '<td><span class="docs-file-name">' +
          escapeHtml(r.file_name) +
          '</span></td>' +
          '<td>' +
          escapeHtml(r.tag || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(displayName) +
          '</td>' +
          '<td>' +
          escapeHtml(r.email || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(formatMobile(r.mobile, r.dial_code)) +
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
          '<span class="docs-sep">|</span>' +
          '<button type="button" class="docs-copy-link" data-object="' +
          escapeHtml(r.gcs_object) +
          '" data-storage-link="' +
          escapeHtml(r.storage_link || '') +
          '" aria-label="Copy link" title="Copy link">' +
          COPY_LINK_ICON +
          '</button>' +
          '<span class="docs-sep">|</span><a class="docs-link-transcript" href="../conversation-transcript?session=' +
          encodeURIComponent(chatSid) +
          '" target="_blank" rel="noopener noreferrer">Chatscript</a>' +
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
    tbody.querySelectorAll('.docs-copy-link').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyFileLink(btn);
      });
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  function copyFileLink(btn) {
    var object = btn.getAttribute('data-object');
    var storageLink = btn.getAttribute('data-storage-link') || '';
    if (!object) return;

    function done(url) {
      if (!url) {
        alert('No link available.');
        return;
      }
      copyToClipboard(url)
        .then(function () {
          btn.classList.add('docs-copy-link--done');
          var prevTitle = btn.getAttribute('title');
          btn.setAttribute('title', 'Copied');
          setTimeout(function () {
            btn.classList.remove('docs-copy-link--done');
            btn.setAttribute('title', prevTitle || 'Copy link');
          }, 1600);
        })
        .catch(function () {
          alert('Could not copy link.');
        });
    }

    if (storageLink) {
      done(storageLink);
      return;
    }

    btn.disabled = true;
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
        done(data.ok && data.url ? data.url : '');
      })
      .catch(function () {
        alert('Could not get link.');
      })
      .finally(function () {
        btn.disabled = false;
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
    if (!object || !auth.hasAuth()) return;

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
      '<tr><td colspan="8" class="docs-table__empty">Loading…</td></tr>';
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
            '<tr><td colspan="8" class="docs-table__empty">—</td></tr>';
          return;
        }
        state.rows = foldersToRows(data.folders || []);
        applyFilter();
      })
      .catch(function () {
        showAlert('Network error. Check desk token and server.');
        document.getElementById('docs-tbody').innerHTML =
          '<tr><td colspan="8" class="docs-table__empty">—</td></tr>';
      });
  }

  document.getElementById('docs-refresh').addEventListener('click', load);
  document.getElementById('docs-search').addEventListener('input', applyFilter);
  load();
})();

(function () {
  'use strict';
  var KEY = 'qa_live_agent_desk';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  var params = new URLSearchParams(window.location.search);
  if (params.get('first') === '1') {
    document.getElementById('la-first-hint').hidden = false;
  }

  var d = load();
  document.getElementById('la-set-name').value = d.agentName || '';
  document.getElementById('la-set-id').value = d.agentId || '';
  document.getElementById('la-set-token').value = d.token || '';
  document.getElementById('la-set-base').value =
    d.apiBase || window.location.origin.replace(/\/live-agent\/?$/, '');

  document.getElementById('la-set-save').addEventListener('click', function () {
    var name = document.getElementById('la-set-name').value.trim();
    var id = document.getElementById('la-set-id').value.trim();
    if (!name) {
      alert('Please enter your name.');
      return;
    }
    if (!id) id = name.toLowerCase().replace(/\s+/g, '-').slice(0, 32);
    save({
      agentName: name,
      agentId: id,
      token: document.getElementById('la-set-token').value.trim(),
      apiBase: document.getElementById('la-set-base').value.trim(),
    });
    window.location.href = 'index.html';
  });
})();

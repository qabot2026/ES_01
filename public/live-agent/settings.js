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

  var d = load();
  document.getElementById('la-set-name').value = d.agentName || '';
  document.getElementById('la-set-id').value = d.agentId || '';
  document.getElementById('la-set-token').value = d.token || '';
  document.getElementById('la-set-base').value = d.apiBase || '';

  document.getElementById('la-set-save').addEventListener('click', function () {
    save({
      agentName: document.getElementById('la-set-name').value.trim() || 'Agent',
      agentId: document.getElementById('la-set-id').value.trim() || 'agent',
      token: document.getElementById('la-set-token').value.trim(),
      apiBase: document.getElementById('la-set-base').value.trim(),
    });
    window.location.href = 'index.html';
  });
})();

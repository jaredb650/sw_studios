const featured = document.querySelector('[data-end]');
if (featured && Date.now() > Date.parse(featured.dataset.end)) {
  document.querySelector('#event-status').textContent = 'EVENTO ANTERIOR';
  document.querySelector('#ticket-link span').textContent = 'Ver publicación original';
  document.querySelector('#eventos h2').textContent = 'Último evento publicado';
}

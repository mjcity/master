async function run() {
  const res = await fetch('./data/latest.json?_=' + Date.now());
  const data = await res.json();

  document.getElementById('updatedAt').textContent = `Last update: ${data.generated_at || 'n/a'}`;
  document.getElementById('followers').textContent = numberOrDash(data.artist_snapshot?.followers);
  document.getElementById('popularity').textContent = numberOrDash(data.artist_snapshot?.popularity);
  document.getElementById('genres').textContent = (data.artist_snapshot?.genres || []).join(', ') || '—';
  document.getElementById('tracksScanned').textContent = (data.tracks || []).length;

  const growthLabels = (data.history || []).map(x => x.date);
  const growthVals = (data.history || []).map(x => x.followers || 0);
  new Chart(document.getElementById('growthChart'), {
    type: 'line',
    data: { labels: growthLabels, datasets: [{ label: 'Followers', data: growthVals, borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,.25)', tension: .35, fill: true }] },
    options: { responsive: true, plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#cbd5e1' } }, y: { ticks: { color: '#cbd5e1' } } } }
  });

  const trackNames = (data.tracks || []).map(t => t.name);
  const trackIndex = (data.tracks || []).map((_, i, arr) => arr.length - i);
  new Chart(document.getElementById('tracksChart'), {
    type: 'bar',
    data: { labels: trackNames, datasets: [{ label: 'Momentum Index', data: trackIndex, backgroundColor: ['#22d3ee','#60a5fa','#a78bfa','#f472b6','#fb7185','#f59e0b','#34d399','#93c5fd'] }] },
    options: { indexAxis: 'y', plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#cbd5e1' } }, y: { ticks: { color: '#cbd5e1', autoSkip: false } } } }
  });

  const trackList = document.getElementById('trackList');
  (data.tracks || []).slice(0, 10).forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${t.url}" target="_blank">${t.name}</a> • ${t.release_date || 'n/a'}`;
    trackList.appendChild(li);
  });

  const pi = document.getElementById('playlistIntel');
  (data.playlist_intel || []).forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${p.track}</strong> — search hits: ${p.search_hits || 0} • verified: ${p.verified_count || 0}`;
    pi.appendChild(li);
  });

  const rel = document.getElementById('releases');
  (data.tracks || []).slice(0, 5).forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.name} (${t.release_date || 'n/a'})`;
    rel.appendChild(li);
  });

  const captions = document.getElementById('captions');
  (data.smart_captions || []).forEach(c => {
    const li = document.createElement('li');
    li.textContent = c;
    captions.appendChild(li);
  });

  document.getElementById('weeklyReport').textContent = data.weekly_report || 'No weekly report yet.';
  const weeklyPlaylists = document.getElementById('weeklyPlaylists');
  (data.verified_placements || []).forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${p.track}:</strong> <a href="${p.url}" target="_blank">${p.name}</a>`;
    weeklyPlaylists.appendChild(li);
  });
  if (!weeklyPlaylists.children.length) {
    const li = document.createElement('li');
    li.textContent = 'No verified playlist placements in the current snapshot.';
    weeklyPlaylists.appendChild(li);
  }

  const weeklyToggle = document.getElementById('weeklyToggle');
  const weeklyPanel = document.getElementById('weeklyPanel');
  weeklyToggle.addEventListener('click', () => {
    const isOpen = weeklyPanel.classList.toggle('collapsed') === false;
    weeklyToggle.setAttribute('aria-expanded', String(isOpen));
    weeklyToggle.textContent = `${isOpen ? '▼' : '▶'} Weekly Artist Report`;
  });

  document.getElementById('catalogHealth').textContent = data.catalog_health || 'No catalog health data yet.';
}

function numberOrDash(v) { return (v === null || v === undefined || v === '') ? '—' : v.toLocaleString(); }
run();
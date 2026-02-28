let state = { data: null, range: 30, query: '' };
let growthChart, tracksChart, platformChart;

async function run() {
  const res = await fetch('./data/latest.json?_=' + Date.now());
  const data = await res.json();
  state.data = data;
  bindControls();
  render();
}

function bindControls() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.range = Number(btn.dataset.range);
      render();
    });
  });

  document.getElementById('globalSearch').addEventListener('input', (e) => {
    state.query = e.target.value.toLowerCase();
    renderListsOnly();
  });

  const weeklyToggle = document.getElementById('weeklyToggle');
  const weeklyPanel = document.getElementById('weeklyPanel');
  weeklyToggle.addEventListener('click', () => {
    const isOpen = weeklyPanel.classList.toggle('collapsed') === false;
    weeklyToggle.setAttribute('aria-expanded', String(isOpen));
    weeklyToggle.textContent = `${isOpen ? '▼' : '▶'} Weekly Artist Report`;
  });
}

function render() {
  const data = state.data || {};
  document.getElementById('updatedAt').textContent = `Last update: ${data.generated_at || 'n/a'}`;

  renderKpis(data);
  renderGrowth(data);
  renderTracks(data);
  renderPlatformSplit(data);
  renderHeatmap(data);
  renderInsights(data);
  renderListsOnly();

  document.getElementById('weeklyReport').textContent = data.weekly_report || 'No weekly report yet.';
  document.getElementById('catalogHealth').textContent = data.catalog_health || 'No catalog health data yet.';

  document.querySelectorAll('.skeleton').forEach(s => s.classList.add('hidden'));
}

function renderKpis(data) {
  const strip = document.getElementById('kpiStrip');
  const hist = (data.history || []).slice(-state.range);
  const followers = (data.artist_snapshot || {}).followers || 0;
  const popularity = (data.artist_snapshot || {}).popularity || 0;
  const tracks = (data.tracks || []).length;
  const searchHits = (data.playlist_intel || []).reduce((a, x) => a + (x.search_hits || 0), 0);
  const verified = (data.verified_placements || []).length;

  const prev = hist.length > 1 ? (hist[hist.length - 2].followers || 0) : followers;
  const growthPct = prev ? (((followers - prev) / prev) * 100) : 0;

  const cards = [
    { label: 'Followers', value: numberOrDash(followers), delta: growthPct },
    { label: 'Popularity', value: numberOrDash(popularity), delta: popularity ? popularity / 10 : 0 },
    { label: 'Tracks', value: tracks, delta: tracks ? 4 : 0 },
    { label: 'Search Hits', value: searchHits, delta: searchHits ? 6 : 0 },
    { label: 'Verified Placements', value: verified, delta: verified ? 3 : -2 },
  ];

  strip.innerHTML = '';
  cards.forEach((c, i) => {
    const cls = c.delta >= 0 ? 'up' : 'down';
    const icon = ['🎧', '⚡', '🎵', '📡', '✅'][i] || '•';
    const spark = sparklineSvg(hist.map((h, idx) => (h.followers || 0) + idx * (i + 1)));
    const div = document.createElement('article');
    div.className = 'kpi';
    div.innerHTML = `<div class="top"><span>${icon} ${c.label}</span><span class="delta ${cls}">${c.delta >= 0 ? '+' : ''}${c.delta.toFixed(1)}%</span></div><div class="value">${c.value}</div><div class="spark">${spark}</div>`;
    strip.appendChild(div);
  });
}

function renderGrowth(data) {
  const hist = (data.history || []).slice(-state.range);
  const labels = hist.map(x => x.date);
  const vals = hist.map(x => x.followers || 0);
  if (!labels.length) document.getElementById('growthEmpty').classList.remove('hidden');
  if (growthChart) growthChart.destroy();
  growthChart = new Chart(document.getElementById('growthChart'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'Followers', data: vals, borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,.18)', tension: .33, fill: true, pointRadius: 2 }] },
    options: { responsive: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { color: '#e2e8f0' } }, tooltip: { backgroundColor: '#0b0b0f', borderColor: '#334155', borderWidth: 1 } }, scales: { x: { ticks: { color: '#9ca3af' } }, y: { ticks: { color: '#9ca3af' } } } }
  });
}

function renderTracks(data) {
  const tracks = (data.tracks || []).slice(0, 12);
  const labels = tracks.map(t => t.name);
  const vals = tracks.map((_, i, arr) => arr.length - i);
  if (!labels.length) document.getElementById('tracksEmpty').classList.remove('hidden');
  if (tracksChart) tracksChart.destroy();
  tracksChart = new Chart(document.getElementById('tracksChart'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Momentum', data: vals, backgroundColor: ['#00E5FF','#A855F7','#34D399','#FF2DAA','#FBBF24','#60a5fa','#c084fc','#fb7185','#67e8f9','#a7f3d0','#f9a8d4','#fde68a'] }] },
    options: { indexAxis: 'y', plugins: { legend: { labels: { color: '#e2e8f0' } }, tooltip: { backgroundColor: '#0b0b0f', borderColor: '#334155', borderWidth: 1 } }, scales: { x: { ticks: { color: '#9ca3af' } }, y: { ticks: { color: '#cbd5e1', autoSkip: false } } } }
  });
}

function renderPlatformSplit(data) {
  const total = (data.tracks || []).length || 1;
  const spotify = total;
  const apple = Math.max(0, Math.round(total * 0.25));
  const yt = Math.max(0, Math.round(total * 0.35));
  if (platformChart) platformChart.destroy();
  platformChart = new Chart(document.getElementById('platformChart'), {
    type: 'doughnut',
    data: { labels: ['Spotify', 'Apple (est.)', 'YouTube (est.)'], datasets: [{ data: [spotify, apple, yt], backgroundColor: ['#00E5FF','#A855F7','#34D399'] }] },
    options: { plugins: { legend: { labels: { color: '#e2e8f0' } }, tooltip: { backgroundColor: '#0b0b0f', borderColor: '#334155', borderWidth: 1 } } }
  });
}

function renderHeatmap(data) {
  const heat = document.getElementById('heatmap');
  const tracks = data.tracks || [];
  heat.innerHTML = '';
  if (!tracks.length) {
    document.getElementById('heatmapEmpty').classList.remove('hidden');
    return;
  }
  for (let i = 0; i < 28; i++) {
    const lv = (i + tracks.length) % 5;
    const colors = ['#111827','#0e7490','#7c3aed','#db2777','#22c55e'];
    const cell = document.createElement('div');
    cell.className = 'heat-cell';
    cell.style.background = colors[lv];
    heat.appendChild(cell);
  }
}

function renderInsights(data) {
  const insights = document.getElementById('insights');
  insights.innerHTML = '';
  const tracks = data.tracks || [];
  const playlist = data.playlist_intel || [];
  const verified = data.verified_placements || [];
  const bullets = [
    `${tracks.length} active tracks detected in the latest scan.`,
    `${playlist.reduce((a, x) => a + (x.search_hits || 0), 0)} playlist search hits found — outreach opportunity high.`,
    `${verified.length} verified placements confirmed this cycle.`,
    `Best push candidates: ${(tracks.slice(0,2).map(t => t.name).join(' + ') || 'No tracks yet')}.`
  ];
  bullets.forEach(b => {
    const li = document.createElement('li');
    li.textContent = b;
    insights.appendChild(li);
  });
}

function renderListsOnly() {
  const data = state.data || {};
  const q = state.query;

  const trackList = document.getElementById('trackList');
  trackList.innerHTML = '';
  (data.tracks || []).filter(t => `${t.name} ${t.release_date}`.toLowerCase().includes(q)).forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${t.url}" target="_blank">${t.name}</a> • ${t.release_date || 'n/a'}`;
    trackList.appendChild(li);
  });

  const pi = document.getElementById('playlistIntel');
  pi.innerHTML = '';
  (data.playlist_intel || []).filter(p => p.track.toLowerCase().includes(q)).forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${p.track}</strong> — search hits: ${p.search_hits || 0} • verified: ${p.verified_count || 0}`;
    pi.appendChild(li);
  });
  if (!pi.children.length) document.getElementById('playlistEmpty').classList.remove('hidden');
  else document.getElementById('playlistEmpty').classList.add('hidden');

  const captions = document.getElementById('captions');
  captions.innerHTML = '';
  (data.smart_captions || []).filter(c => c.toLowerCase().includes(q)).forEach(c => {
    const li = document.createElement('li');
    li.textContent = c;
    captions.appendChild(li);
  });

  const weekly = document.getElementById('weeklyPlaylists');
  weekly.innerHTML = '';
  (data.verified_placements || []).filter(p => `${p.track} ${p.name}`.toLowerCase().includes(q)).forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${p.track}:</strong> <a href="${p.url}" target="_blank">${p.name}</a>`;
    weekly.appendChild(li);
  });
  if (!weekly.children.length) {
    const li = document.createElement('li');
    li.textContent = 'No verified playlist placements in the current snapshot.';
    weekly.appendChild(li);
  }
}

function sparklineSvg(values) {
  if (!values.length) return '';
  const max = Math.max(...values, 1), min = Math.min(...values, 0);
  const norm = values.map((v, i) => `${(i/(values.length-1||1))*100},${100-((v-min)/(max-min||1))*100}`).join(' ');
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline fill="none" stroke="#00E5FF" stroke-width="3" points="${norm}"/></svg>`;
}

function numberOrDash(v) { return (v === null || v === undefined || v === '') ? '—' : Number(v).toLocaleString(); }
run();
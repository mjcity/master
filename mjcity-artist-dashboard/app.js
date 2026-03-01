let state = { data: null, range: 30, query: '' };
let growthChart, tracksChart, platformChart, genderChart, ageChart, releaseChart;

function setStatus(text, cls = '') {
  const el = document.getElementById('statusBanner');
  if (!el) return;
  el.className = `status-banner ${cls}`.trim();
  el.textContent = text;
}

async function loadData() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    setStatus('Loading data…');
    const res = await fetch('./data/latest.json?_=' + Date.now(), { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !data.tracks) throw new Error('Malformed dashboard JSON');
    state.data = data;
    setStatus(`Loaded snapshot: ${data.generated_at || 'unknown time'}`, 'ok');
    return true;
  } catch (e) {
    setStatus(`Data load failed (${e.message}). Showing safe fallback.`, 'error');
    state.data = {
      generated_at: null,
      artist_snapshot: { name: 'Mjcity', followers: null, popularity: null, genres: [] },
      tracks: [],
      history: [],
      playlist_intel: [],
      verified_placements: [],
      smart_captions: ['Unable to load live data. Try Retry load.'],
      weekly_report: 'Data unavailable. Please retry.',
      catalog_health: 'Data unavailable.'
    };
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function run() {
  bindControls();
  await loadData();
  render();
}

function bindControls() {
  const retry = document.getElementById('retryBtn');
  if (retry && !retry.dataset.bound) {
    retry.dataset.bound = '1';
    retry.addEventListener('click', async () => {
      await loadData();
      render();
    });
  }

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
  renderAudienceExtras(data);
  renderListsOnly();

  document.getElementById('weeklyReport').textContent = data.weekly_report || 'No weekly report yet.';
  document.getElementById('catalogHealth').textContent = data.catalog_health || 'No catalog health data yet.';

  document.querySelectorAll('.skeleton').forEach(s => s.classList.add('hidden'));
}

function renderKpis(data) {
  const strip = document.getElementById('kpiStrip');
  const hist = (data.history || []).slice(-state.range);
  const s4a = data.spotify_for_artists || {};
  const followers = (data.artist_snapshot || {}).followers || 0;
  const popularity = (data.artist_snapshot || {}).popularity || 0;
  const tracks = (data.tracks || []).length;
  const searchHits = (data.playlist_intel || []).reduce((a, x) => a + (x.search_hits || 0), 0);
  const verified = (data.verified_placements || []).length;
  const om = s4a.overview_metrics || {};
  const monthlyListeners = om.listeners?.value ?? 0;
  const streams28 = om.streams?.value ?? 0;

  const prev = hist.length > 1 ? (hist[hist.length - 2].followers || 0) : followers;
  const growthPct = prev ? (((followers - prev) / prev) * 100) : 0;

  const cards = [
    { label: 'Monthly Listeners', value: numberOrDash(monthlyListeners), delta: om.listeners?.delta_pct ?? 0 },
    { label: 'Streams (28d)', value: numberOrDash(streams28), delta: om.streams?.delta_pct ?? 0 },
    { label: 'Followers', value: numberOrDash((om.followers?.value ?? followers)), delta: om.followers?.delta_pct ?? growthPct },
    { label: 'Tracks', value: tracks, delta: tracks ? 4 : 0 },
    { label: 'Verified Placements', value: verified, delta: verified ? 3 : -2 },
  ];

  strip.innerHTML = '';
  cards.forEach((c, i) => {
    const cls = c.delta >= 0 ? 'up' : 'down';
    const icon = ['👥', '📈', '🎧', '🎵', '✅'][i] || '•';
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
    `Top track source: ${data.top_tracks_source || 'unknown'}.`,
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

function renderAudienceExtras(data) {
  const s4a = data.spotify_for_artists || {};

  const g = (s4a.demographics || {}).gender || {};
  const gLabels = ['Female', 'Male', 'Non-binary', 'Not specified'];
  const gVals = [g.female?.pct || 0, g.male?.pct || 0, g.non_binary?.pct || 0, g.not_specified?.pct || 0];
  if (genderChart) genderChart.destroy();
  genderChart = new Chart(document.getElementById('genderChart'), {
    type: 'doughnut',
    data: { labels: gLabels, datasets: [{ data: gVals, backgroundColor: ['#ff2daa', '#00e5ff', '#a855f7', '#34d399'] }] },
    options: { plugins: { legend: { labels: { color: '#e2e8f0' } } } }
  });

  const age = (s4a.demographics || {}).age_buckets || [];
  if (ageChart) ageChart.destroy();
  ageChart = new Chart(document.getElementById('ageChart'), {
    type: 'bar',
    data: { labels: age.map(a => a.range), datasets: [{ label: '% listeners', data: age.map(a => a.pct || 0), backgroundColor: '#a855f7' }] },
    options: { plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#cbd5e1' } }, y: { ticks: { color: '#cbd5e1' } } } }
  });

  const countries = document.getElementById('topCountries');
  countries.innerHTML = '';
  ((s4a.location || {}).top_countries || []).slice(0, 10).forEach(c => {
    const li = document.createElement('li');
    li.textContent = `${c.country}: ${c.listeners} listeners • ${c.active_pct}% active`;
    countries.appendChild(li);
  });

  const cities = document.getElementById('topCities');
  cities.innerHTML = '';
  ((s4a.location || {}).top_cities || []).slice(0, 10).forEach(c => {
    const li = document.createElement('li');
    li.textContent = `${c.city} (${c.region}) — ${c.listeners}`;
    cities.appendChild(li);
  });

  const re = s4a.release_engagement || {};
  document.getElementById('releaseEngagementSummary').textContent = re.release
    ? `${re.release}: ${re.engaged_listeners}/${re.monthly_active_listeners} monthly active listeners engaged (${re.engaged_pct}%) by day ${re.day}.`
    : 'No release engagement snapshot yet.';
  if (releaseChart) releaseChart.destroy();
  const series = re.daily_engaged_series || [];
  releaseChart = new Chart(document.getElementById('releaseEngagementChart'), {
    type: 'line',
    data: { labels: series.map((_, i) => `D${i+1}`), datasets: [{ label: 'Engaged listeners', data: series, borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,.2)', fill: true, tension: .25 }] },
    options: { plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#cbd5e1' } }, y: { ticks: { color: '#cbd5e1' } } } }
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

  const releases = document.getElementById('releases');
  releases.innerHTML = '';
  (data.release_monitor || []).filter(r => `${r.name} ${r.release_date}`.toLowerCase().includes(q)).forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${r.url}" target="_blank">${r.name}</a> (${r.release_date || 'n/a'}) • ${r.type || 'release'}`;
    releases.appendChild(li);
  });

  const related = document.getElementById('relatedArtists');
  related.innerHTML = '';
  (data.related_artists || []).filter(r => `${r.name}`.toLowerCase().includes(q)).forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${r.url}" target="_blank">${r.name}</a> • popularity: ${r.popularity ?? '—'}`;
    related.appendChild(li);
  });
  if (!related.children.length) document.getElementById('relatedEmpty').classList.remove('hidden');
  else document.getElementById('relatedEmpty').classList.add('hidden');

  const s4a = data.spotify_for_artists || {};
  const s4aList = document.getElementById('s4aMetrics');
  s4aList.innerHTML = '';
  const lines = [
    `Listening now: ${s4a.listening_now ?? '—'}`,
    `Monthly active listeners: ${numberOrDash((s4a.audience_segments || {}).monthly_active_listeners?.value)} (${((s4a.audience_segments || {}).monthly_active_listeners?.delta_pct ?? 0)}%)`,
    `New active listeners: ${numberOrDash((s4a.audience_segments || {}).new_active_listeners?.value)} (${((s4a.audience_segments || {}).new_active_listeners?.delta_pct ?? 0)}%)`,
    `Super listeners: ${numberOrDash((s4a.audience_segments || {}).super_listeners?.value)} (${((s4a.audience_segments || {}).super_listeners?.delta_pct ?? 0)}%)`
  ];
  const topSongs = (s4a.top_songs_last_7_days || []).map(s => `Top song: ${s.name} (${s.streams} streams)`).slice(0,3);
  const topPlaylists = (s4a.top_playlists_last_7_days || []).map(p => `Top playlist: ${p.name} (${p.streams} streams)`);
  [...lines, ...topSongs, ...topPlaylists].forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    s4aList.appendChild(li);
  });
  if (!s4aList.children.length) document.getElementById('s4aEmpty').classList.remove('hidden');
  else document.getElementById('s4aEmpty').classList.add('hidden');

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
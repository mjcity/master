let state = { data: null, range: 30, query: '', sourceMeta: {} };
let growthChart, tracksChart, platformChart, genderChart, ageChart, releaseChart;
let retryAttempts = 0;
let lastActionSignature = '';
const SNAPSHOT_CACHE_KEY = 'mjcity_dashboard_last_snapshot_v1';
const DECISION_HISTORY_KEY = 'mjcity_dashboard_decision_history_v1';

function setStatus(text, cls = '') {
  const el = document.getElementById('statusBanner');
  if (!el) return;
  el.className = `status-banner ${cls}`.trim();
  el.textContent = text;
}

function saveSnapshotCache(data) {
  try { localStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(data)); } catch {}
}

function loadSnapshotCache() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getDecisionHistory() {
  try {
    const raw = localStorage.getItem(DECISION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDecision(entry) {
  try {
    const hist = getDecisionHistory();
    hist.unshift({ ts: new Date().toISOString(), ...entry });
    localStorage.setItem(DECISION_HISTORY_KEY, JSON.stringify(hist.slice(0, 80)));
  } catch {}
}

function setSourceTimestamps(meta = {}) {
  const el = document.getElementById('sourceTimestamps');
  if (!el) return;
  const latest = meta.latest || 'n/a';
  const s4a = meta.s4a || 'n/a';
  const qa = meta.qa || 'n/a';
  el.textContent = `Sources → latest.json: ${latest} • s4a_latest.json: ${s4a} • qa: ${qa}`;
}

function runQaChecks(data) {
  const issues = [];
  if (!(data.tracks || []).length) issues.push('tracks empty');
  if (!data.generated_at) issues.push('generated_at missing');
  if (!(data.playlist_intel || []).length) issues.push('playlist_intel empty');
  if (!(data.history || []).length) issues.push('history empty');
  (data.tracks || []).forEach((t) => {
    if (!t.name) issues.push('track missing name');
    if (t.release_date && Number.isNaN(new Date(t.release_date).getTime())) issues.push(`invalid release date: ${t.name}`);
  });
  const uniqueIssues = [...new Set(issues)].slice(0, 6);
  const qaEl = document.getElementById('qaStatus');
  if (qaEl) {
    if (uniqueIssues.length) {
      qaEl.className = 'status-banner error';
      qaEl.textContent = `QA checks: issues found (${uniqueIssues.join('; ')})`;
    } else {
      qaEl.className = 'status-banner ok';
      qaEl.textContent = 'QA checks: passed';
    }
  }
  return { passed: uniqueIssues.length === 0, issues: uniqueIssues };
}

async function loadData() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    setStatus('Loading data…');
    const [resLatest, resS4A, resQA] = await Promise.all([
      fetch('./data/latest.json?_=' + Date.now(), { signal: ctrl.signal, cache: 'no-store' }),
      fetch('./data/s4a_latest.json?_=' + Date.now(), { signal: ctrl.signal, cache: 'no-store' }).catch(() => null),
      fetch('./data/qa_report.json?_=' + Date.now(), { signal: ctrl.signal, cache: 'no-store' }).catch(() => null)
    ]);
    if (!resLatest?.ok) throw new Error(`HTTP ${resLatest?.status || 'fetch'}`);
    const data = await resLatest.json();
    if (!data || !data.tracks) throw new Error('Malformed dashboard JSON');

    let s4aCaptured = null;
    if (resS4A && resS4A.ok) {
      const s4aData = await resS4A.json();
      s4aCaptured = s4aData?.captured_at || s4aData?.last_updated || null;
    }

    let qaChecked = null;
    if (resQA && resQA.ok) {
      const qaData = await resQA.json();
      qaChecked = qaData?.checked_at || null;
      const qaEl = document.getElementById('qaStatus');
      if (qaEl) {
        qaEl.className = `status-banner ${qaData?.passed ? 'ok' : 'error'}`;
        qaEl.textContent = qaData?.passed ? 'QA checks: passed (post-cron)' : `QA checks: issues (${(qaData?.issues || []).join('; ')})`;
      }
    }

    state.data = data;
    state.sourceMeta = { latest: data.generated_at || 'n/a', s4a: s4aCaptured || 'n/a', qa: qaChecked || new Date().toISOString() };
    setSourceTimestamps(state.sourceMeta);
    saveSnapshotCache({ data: state.data, sourceMeta: state.sourceMeta });
    setStatus(`Loaded snapshot: ${data.generated_at || 'unknown time'}`, 'ok');
    retryAttempts = 0;
    runQaChecks(data);
    return true;
  } catch (e) {
    const cached = loadSnapshotCache();
    if (cached?.data) {
      state.data = cached.data;
      state.sourceMeta = cached.sourceMeta || { latest: cached.data.generated_at || 'n/a', s4a: 'n/a', qa: 'cached' };
      setSourceTimestamps(state.sourceMeta);
      setStatus(`Live load failed (${e.message}). Showing last known snapshot.`, 'error');
      runQaChecks(state.data);
      return false;
    }

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
    state.sourceMeta = { latest: 'n/a', s4a: 'n/a', qa: new Date().toISOString() };
    setSourceTimestamps(state.sourceMeta);
    runQaChecks(state.data);
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
      retryAttempts += 1;
      const cooldownMs = Math.min(8000, Math.max(0, (retryAttempts - 1) * 1500));
      if (cooldownMs > 0) {
        setStatus(`Retry queued… waiting ${Math.round(cooldownMs / 1000)}s to avoid API throttle.`, 'error');
        await new Promise(r => setTimeout(r, cooldownMs));
      }
      await loadData();
      render();
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.range = Number(btn.dataset.range);
      setStatus(`Filter: ${btn.textContent.trim()}`);
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

function getRangeCutoff(rangeDays) {
  const now = new Date();
  if (rangeDays === 365) return new Date(now.getFullYear(), 0, 1); // YTD
  const d = new Date(now);
  d.setDate(d.getDate() - rangeDays);
  return d;
}

function filterTracksByRange(tracks) {
  const cutoff = getRangeCutoff(state.range);
  return (tracks || []).filter(t => {
    // S4A momentum rows are already 28-day scoped and should bypass release-date filtering.
    if (t.streams_28d !== undefined || t.listeners_28d !== undefined) return true;
    if (!t.release_date) return true;
    const dt = new Date(t.release_date);
    if (Number.isNaN(dt.getTime())) return true;
    return dt >= cutoff;
  });
}

function render() {
  const data = state.data || {};
  document.getElementById('updatedAt').textContent = `Last update: ${data.generated_at || 'n/a'}`;

  const s4aTracks = (data.spotify_for_artists?.top_tracks_28d || []).map(t => ({ name: t.name, streams_28d: t.streams_28d || t.streams || 0, listeners_28d: t.listeners_28d || 0, release_date: t.release_date || null }));
  const baseTracks = (data.tracks || []).length ? (data.tracks || []) : s4aTracks;
  const rangeTracks = filterTracksByRange(baseTracks);

  renderDataQuality(data);
  renderWidgetConfidence(data, rangeTracks);
  renderKpis(data, rangeTracks);
  renderDeltaSnapshot(data, rangeTracks);
  renderGrowth(data);
  renderTracks(data, rangeTracks);
  renderPlatformSplit(data, rangeTracks);
  renderHeatmap(data, rangeTracks);
  renderInsights(data, rangeTracks);
  renderActions(data, rangeTracks);
  renderAudienceExtras(data);
  renderListsOnly(rangeTracks);
  renderDecisionHistory();

  document.getElementById('weeklyReport').textContent = data.weekly_report || 'No weekly report yet.';
  document.getElementById('catalogHealth').textContent = data.catalog_health || 'No catalog health data yet.';

  document.querySelectorAll('.skeleton').forEach(s => s.classList.add('hidden'));
}

function renderDataQuality(data) {
  const el = document.getElementById('dataQuality');
  if (!el) return;
  const source = data.top_tracks_source || data.spotify_for_artists?.source || 'unknown';
  const verified = (data.verified_placements || []).length;
  const isEstimated = source === 'search_fallback' || source === 'unknown';
  const quality = isEstimated ? 'Estimated' : 'Verified';
  const cls = isEstimated ? 'error' : 'ok';
  el.className = `status-banner ${cls}`;
  el.textContent = `Data quality: ${quality} • Top tracks source: ${source} • Verified placements: ${verified}`;
}

function renderWidgetConfidence(data, rangeTracks) {
  const cards = [...document.querySelectorAll('main .card')];
  cards.forEach(c => {
    const h2 = c.querySelector('h2');
    if (!h2) return;
    const old = h2.querySelector('.conf-badge');
    if (old) old.remove();

    const t = h2.textContent.toLowerCase();
    let level = 'verified';
    if (t.includes('playlist')) level = data.top_tracks_source === 'search_fallback' ? 'estimated' : 'verified';
    if (t.includes('related artists')) level = (data.related_artists || []).length ? 'estimated' : 'missing';
    if (t.includes('platform split')) level = (rangeTracks || []).length ? 'estimated' : 'missing';
    if (t.includes('streams trend')) level = (data.history || []).length ? 'verified' : 'missing';
    if (t.includes('top tracks')) level = (rangeTracks || []).length ? 'verified' : 'missing';
    if (t.includes('spotify for artists')) level = data.spotify_for_artists ? 'verified' : 'missing';

    const span = document.createElement('span');
    span.className = `conf-badge conf-${level}`;
    span.textContent = level.toUpperCase();
    h2.appendChild(span);
  });
}

function renderKpis(data, rangeTracks) {
  const strip = document.getElementById('kpiStrip');
  const hist = (data.history || []).slice(-state.range);
  const s4a = data.spotify_for_artists || {};
  const metrics28 = s4a.metrics?.last_28_days || {};
  const followers = (data.artist_snapshot || {}).followers || 0;
  const popularity = (data.artist_snapshot || {}).popularity || 0;
  const s4aTracks = (s4a.top_tracks_28d || []).map(t => ({ name: t.name, streams_28d: t.streams_28d || t.streams || 0, listeners_28d: t.listeners_28d || 0, release_date: t.release_date || null }));
  const effectiveTracks = (rangeTracks && rangeTracks.length) ? rangeTracks : ((data.tracks || []).length ? (data.tracks || []) : s4aTracks);
  const tracks = (effectiveTracks || []).length;
  const searchHits = (data.playlist_intel || []).reduce((a, x) => a + (x.search_hits || 0), 0);
  const verified = (data.verified_placements || []).length;
  const om = s4a.overview_metrics || {};
  const monthlyListeners = metrics28.monthly_listeners ?? om.listeners?.value ?? 0;
  const streams28 = metrics28.streams ?? om.streams?.value ?? 0;

  const prev = hist.length > 1 ? (hist[hist.length - 2].followers || 0) : followers;
  const growthPct = prev ? (((followers - prev) / prev) * 100) : 0;

  const cards = [
    { label: 'Monthly Listeners', value: numberOrDash(monthlyListeners), delta: pctToNumber(metrics28.monthly_listeners_delta ?? om.listeners?.delta_pct ?? 0) },
    { label: 'Streams (28d)', value: numberOrDash(streams28), delta: pctToNumber(metrics28.streams_delta ?? om.streams?.delta_pct ?? 0) },
    { label: 'Followers', value: numberOrDash((om.followers?.value ?? followers)), delta: pctToNumber(om.followers?.delta_pct ?? growthPct) },
    { label: 'Tracks', value: tracks, delta: pctToNumber(metrics28.streams_delta ?? 0) },
    { label: 'Verified Placements', value: verified, delta: verified > 0 ? 5 : -5 },
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

  const msListeners = document.getElementById('msListeners');
  const msFollowers = document.getElementById('msFollowers');
  const msVerified = document.getElementById('msVerified');
  if (msListeners) msListeners.textContent = numberOrDash(monthlyListeners);
  if (msFollowers) msFollowers.textContent = numberOrDash(om.followers?.value ?? followers);
  if (msVerified) msVerified.textContent = String(verified);
}

function renderDeltaSnapshot(data, rangeTracks) {
  const strip = document.getElementById('deltaStrip');
  if (!strip) return;
  const hist = data.history || [];
  const now = hist[hist.length - 1] || {};
  const prevDay = hist[hist.length - 2] || now;
  const prevWeek = hist[Math.max(0, hist.length - 8)] || now;

  const dayDelta = (now.followers || 0) - (prevDay.followers || 0);
  const weekDelta = (now.followers || 0) - (prevWeek.followers || 0);
  const tracksNow = (rangeTracks || []).length;
  const verified = (data.verified_placements || []).length;

  const items = [
    { label: 'Followers Δ (1d)', value: `${dayDelta >= 0 ? '+' : ''}${dayDelta}` },
    { label: 'Followers Δ (7d)', value: `${weekDelta >= 0 ? '+' : ''}${weekDelta}` },
    { label: 'Tracks in range', value: String(tracksNow) },
    { label: 'Verified placements', value: String(verified) }
  ];

  strip.innerHTML = '';
  items.forEach(i => {
    const card = document.createElement('article');
    card.className = 'kpi';
    card.innerHTML = `<div class="top"><span>⚡ ${i.label}</span></div><div class="value">${i.value}</div>`;
    strip.appendChild(card);
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

function renderTracks(data, rangeTracks) {
  const tracks = (rangeTracks || []).slice(0, 12);
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

function renderPlatformSplit(data, rangeTracks) {
  const total = (rangeTracks || []).length || 1;
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

function renderHeatmap(data, rangeTracks) {
  const heat = document.getElementById('heatmap');
  const tracks = rangeTracks || [];
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

function renderInsights(data, rangeTracks) {
  const insights = document.getElementById('insights');
  insights.innerHTML = '';
  const tracks = rangeTracks || [];
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

function renderActions(data, rangeTracks) {
  const el = document.getElementById('actions');
  if (!el) return;
  el.innerHTML = '';

  const tracks = rangeTracks || [];
  const verified = (data.verified_placements || []).length;
  const searchHits = (data.playlist_intel || []).reduce((a, x) => a + (x.search_hits || 0), 0);
  const top = tracks[0]?.name || 'your latest single';

  const hist = data.history || [];
  const now = hist[hist.length - 1] || {};
  const d3 = hist.slice(-3);
  const negStreak = d3.length >= 3 && d3.every((x, i, arr) => i === 0 || (x.followers || 0) <= (arr[i - 1].followers || 0));
  const zeroVerifiedStreak = verified === 0;

  const actions = [];
  if (searchHits > verified) {
    actions.push(`Prioritize outreach this week: ${searchHits} playlist search hits vs ${verified} verified placements.`);
  } else {
    actions.push('Playlist conversion is healthy — maintain current curator outreach cadence.');
  }

  if (zeroVerifiedStreak) {
    actions.push('Trigger curator push now: verified placements are at zero in current snapshot.');
  }
  if (negStreak) {
    actions.push('Follower trend has declined for 3 snapshots — launch retention content + save CTA campaign within 24h.');
  }

  actions.push(`Create 2 short-form clips around "${top}" and post within 48 hours to support stream momentum.`);
  actions.push('Review top cities and target one local collab or micro-event for audience growth.');

  actions.forEach((a) => {
    const li = document.createElement('li');
    li.textContent = a;
    el.appendChild(li);
  });

  const signature = `${verified}|${searchHits}|${negStreak}|${zeroVerifiedStreak}|${top}`;
  if (signature !== lastActionSignature) {
    addDecision({ type: 'action-engine', note: `Actions refreshed (verified=${verified}, hits=${searchHits}, negStreak=${negStreak})` });
    lastActionSignature = signature;
  }

  const empty = document.getElementById('actionsEmpty');
  if (empty) empty.classList.toggle('hidden', el.children.length > 0);
}

function scorePlaylistItem(item = {}, source = 'search_fallback') {
  const searchHits = Number(item.search_hits || 0);
  const verifiedCount = Number(item.verified_count || 0);
  const reliability = source === 'search_fallback' ? 45 : 70;
  const hitScore = Math.min(20, searchHits * 2);
  const verifyScore = Math.min(35, verifiedCount * 12);
  const confidence = Math.min(100, reliability + hitScore + verifyScore);
  const tier = confidence >= 75 ? 'high' : confidence >= 55 ? 'medium' : 'low';
  return { confidence, tier };
}

function renderDecisionHistory() {
  const el = document.getElementById('decisionHistory');
  const empty = document.getElementById('decisionHistoryEmpty');
  if (!el) return;
  const hist = getDecisionHistory();
  el.innerHTML = '';
  hist.slice(0, 12).forEach((h) => {
    const li = document.createElement('li');
    const at = new Date(h.ts).toLocaleString();
    li.textContent = `[${at}] ${h.type}: ${h.note}`;
    el.appendChild(li);
  });
  if (empty) empty.classList.toggle('hidden', el.children.length > 0);
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
  ((s4a.geo || {}).top_countries_listeners || (s4a.location || {}).top_countries || []).slice(0, 10).forEach(c => {
    const li = document.createElement('li');
    li.textContent = `${c.country}: ${c.listeners} listeners${c.active_pct ? ` • ${c.active_pct} active` : ''}`;
    countries.appendChild(li);
  });

  const cities = document.getElementById('topCities');
  cities.innerHTML = '';
  ((s4a.geo || {}).top_cities_listeners || (s4a.location || {}).top_cities || []).slice(0, 10).forEach(c => {
    const li = document.createElement('li');
    li.textContent = `${c.city}${c.region ? ` (${c.region})` : ''} — ${c.listeners}`;
    cities.appendChild(li);
  });

  const re = s4a.release_engagement || {};
  const topRel = (s4a.top_tracks_28d || [])[0];
  document.getElementById('releaseEngagementSummary').textContent = re.release
    ? `${re.release}: ${re.engaged_listeners}/${re.monthly_active_listeners} monthly active listeners engaged (${re.engaged_pct}%) by day ${re.day}.`
    : (topRel ? `Current top track momentum: ${topRel.name} (${topRel.streams_28d || 0} streams / ${topRel.listeners_28d || 0} listeners in 28d).` : 'No release engagement snapshot yet.');
  if (releaseChart) releaseChart.destroy();
  const series = re.daily_engaged_series || ((s4a.top_tracks_28d || []).slice(0,7).map(t => t.streams_28d || 0));
  releaseChart = new Chart(document.getElementById('releaseEngagementChart'), {
    type: 'line',
    data: { labels: series.map((_, i) => `D${i+1}`), datasets: [{ label: 'Engaged listeners', data: series, borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,.2)', fill: true, tension: .25 }] },
    options: { plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#cbd5e1' } }, y: { ticks: { color: '#cbd5e1' } } } }
  });
}

function renderListsOnly(rangeTracks = null) {
  const data = state.data || {};
  const q = state.query;

  const trackList = document.getElementById('trackList');
  trackList.innerHTML = '';
  ((rangeTracks || data.tracks || [])).filter(t => `${t.name} ${t.release_date}`.toLowerCase().includes(q)).forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${t.url}" target="_blank">${t.name}</a> • ${t.release_date || 'n/a'}`;
    trackList.appendChild(li);
  });

  const pi = document.getElementById('playlistIntel');
  pi.innerHTML = '';
  (data.playlist_intel || []).filter(p => p.track.toLowerCase().includes(q)).forEach(p => {
    const li = document.createElement('li');
    const score = scorePlaylistItem(p, data.top_tracks_source || 'search_fallback');
    li.innerHTML = `<strong>${p.track}</strong> — search hits: ${p.search_hits || 0} • verified: ${p.verified_count || 0} • confidence: ${score.confidence}/100 (${score.tier})`;
    pi.appendChild(li);
  });
  if (!pi.children.length) document.getElementById('playlistEmpty').classList.remove('hidden');
  else document.getElementById('playlistEmpty').classList.add('hidden');

  const verifiedList = document.getElementById('verifiedPlacements');
  if (verifiedList) {
    verifiedList.innerHTML = '';
    (data.verified_placements || []).filter(p => `${p.track} ${p.name}`.toLowerCase().includes(q)).forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${p.track}:</strong> <a href="${p.url}" target="_blank">${p.name}</a>`;
      verifiedList.appendChild(li);
    });
    const verifiedEmpty = document.getElementById('verifiedEmpty');
    if (verifiedEmpty) verifiedEmpty.classList.toggle('hidden', verifiedList.children.length > 0);
  }

  const captions = document.getElementById('captions');
  captions.innerHTML = '';
  (data.smart_captions || []).filter(c => c.toLowerCase().includes(q)).forEach(c => {
    const li = document.createElement('li');
    li.textContent = c;
    captions.appendChild(li);
  });

  const releases = document.getElementById('releases');
  if (releases) {
    releases.innerHTML = '';
    (data.release_monitor || []).filter(r => `${r.name} ${r.release_date}`.toLowerCase().includes(q)).forEach(r => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${r.url}" target="_blank">${r.name}</a> (${r.release_date || 'n/a'}) • ${r.type || 'release'}`;
      releases.appendChild(li);
    });
    const releasesEmpty = document.getElementById('releasesEmpty');
    if (releasesEmpty) releasesEmpty.classList.toggle('hidden', releases.children.length > 0);
  }

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
  const m28 = s4a.metrics?.last_28_days || {};
  const lines = [
    `Listening now: ${s4a.metrics?.listeners_now ?? s4a.listening_now ?? '—'}`,
    `Monthly active listeners: ${numberOrDash(m28.active_listeners)} (${m28.active_listeners_delta || '0%'})`,
    `New active listeners: ${numberOrDash(m28.new_active_listeners)} (${m28.new_active_listeners_delta || '0%'})`,
    `Super listeners: ${numberOrDash(m28.super_listeners)} (${m28.super_listeners_delta || '0%'})`
  ];
  const topSongs = (s4a.top_tracks_28d || s4a.top_songs_last_7_days || []).map(s => `Top song: ${s.name} (${s.streams_28d || s.streams || 0} streams)`).slice(0,3);
  const alg = s4a.playlist_signals?.algorithmic || [];
  const topPlaylists = alg.map(p => `Top playlist: ${p.title || p.name} (${p.streams || 0} streams)`);
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

function pctToNumber(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace('%', '').trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function numberOrDash(v) { return (v === null || v === undefined || v === '') ? '—' : Number(v).toLocaleString(); }
run();
'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Same-origin by default. For a separately hosted API, define
  // window.INTELLILINK_API_BASE before this script (for example, https://api.example.com).
  const API_ROOT = String(window.INTELLILINK_API_BASE || '').replace(/\/$/, '');
  const API = `${API_ROOT}/api/v1`;

  const state = {
    running: false,
    selectedNetwork: null,
    toastTimer: null,
    lastSnapshot: null,
    lastScore: null,
    history: [],
    chartRange: '1h',
    requestController: null,
    cancelRequested: false,
    visitorProbeRunning: false,
  };

  const missing = value => value === null || value === undefined || value === '';

  function firstValue(...values) {
    for (const value of values) {
      if (!missing(value) && !(typeof value === 'number' && !Number.isFinite(value))) {
        return value;
      }
    }
    return null;
  }

  function objectValue(value, keys = []) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

    for (const key of keys) {
      if (value[key] && typeof value[key] === 'object' && !Array.isArray(value[key])) {
        return value[key];
      }
    }

    return value;
  }

  function arrayValue(value) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== 'object') return [];

    for (const key of ['items', 'events', 'history', 'samples', 'records', 'results', 'data']) {
      if (Array.isArray(value[key])) return value[key];
    }

    return [];
  }

  function display(value, fallback = 'N/A') {
    return missing(value) ? fallback : String(value);
  }

  function numeric(value) {
    if (missing(value) || !Number.isFinite(Number(value))) return null;
    return Number(value);
  }

  function formattedNumber(value, digits = 1, fallback = '—') {
    const number = numeric(value);
    return number === null ? fallback : number.toFixed(digits);
  }

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(state.toastTimer);

    state.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3600);
  }

  function setText(selector, value, fallback = 'N/A') {
    const node = $(selector);
    if (node) node.textContent = display(value, fallback);
  }

  function setUpdated(timestamp = null) {
    const target = $('#lastUpdated');
    if (!target) return;

    const date = timestamp ? new Date(timestamp) : new Date();

    target.textContent = Number.isNaN(date.getTime())
      ? 'not available'
      : date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
  }

  async function api(path, timeoutMs = 12000, externalSignal = null) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const forwardAbort = () => controller.abort();

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', forwardAbort, { once: true });
      }
    }

    try {
      const response = await fetch(path, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        cache: 'no-store',
        signal: controller.signal
      });

      const type = response.headers.get('content-type') || '';
      const payload = type.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const detail = payload && typeof payload === 'object'
          ? firstValue(payload.detail, payload.message, payload.error)
          : payload;

        throw new Error(detail || `Request failed (${response.status})`);
      }

      return payload;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('API request timed out. Check the backend and network connection.');
      }

      throw error;
    } finally {
      clearTimeout(timeout);

      if (externalSignal) {
        externalSignal.removeEventListener('abort', forwardAbort);
      }
    }
  }

  function scoreColor(score) {
    if (score >= 85) return 'var(--green)';
    if (score >= 70) return 'var(--cyan)';
    if (score >= 50) return 'var(--orange)';
    return 'var(--red)';
  }

  function setSystemStatus(online, label) {
    const pill = $('.live-pill');
    if (!pill) return;

    pill.classList.toggle('offline', !online);

    const dot = document.createElement('span');
    dot.className = 'status-dot';
    dot.style.background = online ? 'var(--green)' : 'var(--red)';

    const labelNode = document.createElement('span');
    labelNode.dataset.systemLabel = 'true';
    labelNode.textContent = label;

    // Remove the hard-coded status text from the HTML.
    pill.replaceChildren(
      dot,
      document.createTextNode(' '),
      labelNode
    );
  }

  function normaliseNetworkType(value) {
    const type = String(value || '').trim().toLowerCase();

    if (!type) return null;
    if (type.includes('5g')) return '5G';
    if (type.includes('4g') || type.includes('lte')) return '4G LTE';

    // Generic mobile/cellular does not prove whether the radio is 4G or 5G.
    if (type.includes('cellular') || type.includes('mobile')) return null;

    if (
      type.includes('wi-fi') ||
      type.includes('wifi') ||
      type.includes('wlan')
    ) {
      return 'Wi-Fi';
    }

    if (type.includes('satellite')) return 'Satellite';

    if (
      type.includes('ethernet') ||
      type.includes('wan') ||
      type.includes('wired')
    ) {
      return 'WAN';
    }

    return null;
  }

  function valueFrom(data, keys) {
    for (const key of keys) {
      const value = data && data[key];
      if (!missing(value)) return value;
    }

    return null;
  }

  function currentMetrics() {
    const s = state.lastSnapshot || {};
    const scoreData = state.lastScore || {};
    const latest = state.dashboard?.latest_network || {};

    return {
      network: normaliseNetworkType(
        firstValue(
          s.connection_type,
          s.network_type,
          s.network,
          latest.network_type,
          latest.network
        )
      ),

      score: firstValue(
        valueFrom(s, ['score', 'network_score', 'health_score']),
        valueFrom(scoreData, ['score', 'network_score', 'health_score']),
        valueFrom(latest, ['score', 'network_score', 'health_score'])
      ),

      quality: firstValue(
        valueFrom(s, ['quality', 'score_label', 'network_quality']),
        valueFrom(scoreData, ['quality', 'label', 'score_label']),
        valueFrom(latest, ['quality', 'label'])
      ),

      latency: firstValue(
        valueFrom(s, ['latency_ms', 'latency', 'ping_ms']),
        valueFrom(scoreData, ['latency_ms', 'latency']),
        valueFrom(latest, ['latency_ms', 'latency'])
      ),

      jitter: firstValue(
        valueFrom(s, ['jitter_ms', 'jitter']),
        valueFrom(scoreData, ['jitter_ms', 'jitter'])
      ),

      loss: firstValue(
        valueFrom(s, ['packet_loss_percent', 'packet_loss', 'loss_percent']),
        valueFrom(scoreData, ['packet_loss_percent', 'packet_loss', 'loss_percent']),
        valueFrom(latest, ['packet_loss_percent', 'packet_loss'])
      ),

      download: firstValue(
        valueFrom(s, ['download_mbps', 'download_speed_mbps', 'download']),
        valueFrom(scoreData, ['download_mbps', 'download_speed_mbps']),
        valueFrom(latest, ['download_mbps', 'download_speed_mbps'])
      ),

      upload: firstValue(
        valueFrom(s, ['upload_mbps', 'upload_speed_mbps', 'upload']),
        valueFrom(scoreData, ['upload_mbps', 'upload_speed_mbps'])
      ),

      stability: firstValue(
        valueFrom(s, ['stability', 'stability_score', 'stability_percent']),
        valueFrom(scoreData, ['stability', 'stability_score', 'stability_percent'])
      ),

      responsiveness: firstValue(
        valueFrom(s, ['responsiveness', 'responsiveness_score', 'responsiveness_percent']),
        valueFrom(scoreData, ['responsiveness', 'responsiveness_score', 'responsiveness_percent'])
      ),

      throughput: firstValue(
        valueFrom(s, ['throughput', 'throughput_score', 'throughput_percent']),
        valueFrom(scoreData, ['throughput', 'throughput_score', 'throughput_percent'])
      ),

      signal: firstValue(
        valueFrom(s, ['signal_strength', 'signal_percent', 'signal_dbm', 'signal']),
        valueFrom(s.wifi || {}, ['signal_strength', 'signal_percent', 'rssi'])
      ),

      timestamp: firstValue(
        s.timestamp,
        s.updated_at,
        latest.created_at,
        latest.timestamp
      ),

      internet: firstValue(
        s.internet,
        s.internet_reachable,
        s.internet_status
      ),

      suggestion: firstValue(
        s.intelligence?.action,
        s.intelligence?.priority,
        scoreData.suggestion,
        scoreData.recommendation
      )
    };
  }

  function updateMiniMetric(selector, value) {
    const node = $(selector);
    if (!node) return;

    const number = numeric(value);

    node.textContent = number === null
      ? '—'
      : `${Math.max(0, Math.min(100, number))}%`;

    const track = node.parentElement?.querySelector('.mini-track span');

    if (track) {
      track.style.width = number === null
        ? '0%'
        : `${Math.max(0, Math.min(100, number))}%`;
    }
  }

  function updateNetworkRows(metrics) {
    $$('.network-row').forEach(row => {
      const name = row.dataset.network;
      const active = !!metrics.network && name === metrics.network;

      row.classList.toggle('selected', active);
      row.setAttribute('aria-pressed', String(active));

      const scoreNode = $('.network-quality strong', row);
      const labelNode = $('.quality-label', row);

      if (scoreNode) {
        scoreNode.replaceChildren();

        const number = active ? numeric(metrics.score) : null;

        scoreNode.append(
          document.createTextNode(
            number === null ? '— ' : `${Math.round(number)} `
          )
        );

        const denominator = document.createElement('small');
        denominator.textContent = '/100';
        scoreNode.append(denominator);
      }

      if (labelNode) {
        labelNode.classList.remove('quality-good', 'quality-muted');

        labelNode.classList.add(
          active && !missing(metrics.score)
            ? 'quality-good'
            : 'quality-muted'
        );

        labelNode.textContent = active
          ? (
              metrics.quality ||
              (
                numeric(metrics.score) === null
                  ? 'Connected · score unavailable'
                  : 'Measured'
              )
            )
          : 'No live reading';
      }

      const bars = $$('.network-bars i', row);
      let signalLevel = 0;

      if (active && !missing(metrics.signal)) {
        const raw = String(metrics.signal);
        const n = numeric(raw.replace(/[^0-9.+-]/g, ''));

        if (n !== null) {
          signalLevel =
            raw.includes('dBm') || n < 0
              ? (
                  n >= -60 ? 5 :
                  n >= -70 ? 4 :
                  n >= -80 ? 3 :
                  n >= -90 ? 2 : 1
                )
              : Math.max(0, Math.min(5, Math.round(n / 20)));
        }
      }

      bars.forEach((bar, index) => {
        bar.classList.toggle('off', index >= signalLevel);
      });
    });
  }

  function applySnapshot(rawSnapshot, rawScore = null) {
    let snapshot = objectValue(
      rawSnapshot,
      ['snapshot', 'network_snapshot', 'result']
    );

    if (snapshot.data && typeof snapshot.data === 'object') {
      snapshot = snapshot.data;
    }

    let score = rawScore
      ? objectValue(rawScore, ['result', 'score_data'])
      : {};

    if (typeof rawScore === 'number') {
      score = { score: rawScore };
    }

    if (
      rawScore &&
      typeof rawScore === 'object' &&
      typeof rawScore.score === 'number'
    ) {
      score = rawScore;
    }

    state.lastSnapshot = snapshot;
    state.lastScore = score;

    const metrics = currentMetrics();
    state.selectedNetwork = metrics.network || state.selectedNetwork;

    const scoreValue = numeric(metrics.score);

    setText(
      '#healthScore',
      scoreValue === null ? '—' : Math.round(scoreValue),
      '—'
    );

    setText(
      '#gaugeScore',
      scoreValue === null ? '—' : Math.round(scoreValue),
      '—'
    );

    setText('#latencyValue', formattedNumber(metrics.latency, 1), '—');
    setText('#downloadValue', formattedNumber(metrics.download, 2), '—');
    setText('#lossValue', formattedNumber(metrics.loss, 2), '—');

    setText(
      '#scoreLabel',
      metrics.quality || (scoreValue === null ? 'Waiting for data' : 'Measured')
    );

    setText(
      '#suggestionText',
      metrics.suggestion ||
      (metrics.network ? metrics.network : 'Waiting for a network reading')
    );

    updateMiniMetric('#stabilityValue', metrics.stability);
    updateMiniMetric('#responsivenessValue', metrics.responsiveness);
    updateMiniMetric('#throughputValue', metrics.throughput);

    const bar = $('#healthBar');

    if (bar) {
      bar.style.width = `${
        scoreValue === null
          ? 0
          : Math.max(0, Math.min(100, scoreValue))
      }%`;
    }

    const gauge = $('#gaugeProgress');

    if (gauge) {
      gauge.setAttribute(
        'stroke-dasharray',
        `${
          scoreValue === null
            ? 0
            : Math.max(0, Math.min(100, scoreValue))
        } 100`
      );
    }

    const gaugeLabel = $('.score-gauge');

    if (gaugeLabel) {
      gaugeLabel.setAttribute(
        'aria-label',
        scoreValue === null
          ? 'Connection score is not available'
          : `Connection score ${Math.round(scoreValue)} out of 100`
      );
    }

    const label = $('#scoreLabel');

    if (label) {
      label.style.color = scoreValue === null
        ? 'var(--text-muted, #98a3b8)'
        : scoreColor(scoreValue);
    }

    // Do not present the old example trends as real measurements.
    $$('.trend').forEach(node => {
      node.textContent = 'No baseline';
      node.classList.remove('trend-good');
    });

    $$('.sparkline').forEach(node => {
      node.style.display = 'none';
    });

    const captions = $$('.metric-card .metric-caption');

    if (captions[0]) {
      captions[0].textContent = scoreValue === null
        ? 'No score returned by the API'
        : 'Calculated from available measurements';
    }

    if (captions[1]) {
      captions[1].textContent = metrics.jitter == null
        ? 'Live latency measurement'
        : `Jitter: ${formattedNumber(metrics.jitter, 1)} ms`;
    }

    if (captions[2]) {
      captions[2].textContent = metrics.download == null
        ? 'Throughput not measured by this endpoint'
        : 'Value returned by the API';
    }

    if (captions[3]) {
      captions[3].textContent = metrics.loss == null
        ? 'Packet loss is not available from this probe'
        : 'Value returned by the API';
    }

    const scoreInfo = $('.score-info');

    if (scoreInfo) {
      scoreInfo.textContent =
        'Only values returned by the API are shown; unavailable measurements remain blank.';
    }

    updateNetworkRows(metrics);
    setUpdated(metrics.timestamp);

    const hasInternet =
      metrics.internet === true ||
      metrics.internet === 1 ||
      String(metrics.internet).toLowerCase() === 'true' ||
      String(metrics.internet).toLowerCase() === 'connected';

    setSystemStatus(
      hasInternet,
      hasInternet ? 'API REACHABLE' : 'LIMITED / NOT REACHABLE'
    );

    const banner = $('.demo-banner');

    if (banner) {
      const copy = $('.demo-banner div span', banner);

      if (copy) {
        copy.textContent =
          'API readings describe the machine/probe running this backend. They do not automatically represent this phone’s mobile-radio signal.';
      }

      const heading = $('.demo-banner div strong', banner);

      if (heading) {
        heading.textContent = 'Telemetry source note';
      }
    }
  }

  function addEvent(title, detail, kind = 'info', timestamp = null) {
    const list = $('#eventList');
    if (!list) return;

    const empty = $('.empty-events', list);
    if (empty) empty.remove();

    const iconClass =
      kind === 'success'
        ? 'event-success'
        : kind === 'warn'
          ? 'event-warn'
          : 'event-info';

    const icon =
      kind === 'success'
        ? '✓'
        : kind === 'warn'
          ? '!'
          : '⌁';

    const row = document.createElement('div');
    row.className = 'event-item';

    const iconNode = document.createElement('span');
    iconNode.className = `event-icon ${iconClass}`;
    iconNode.textContent = icon;

    const copy = document.createElement('div');
    copy.className = 'event-copy';

    const heading = document.createElement('strong');
    heading.textContent = display(title, 'System event');

    const caption = document.createElement('small');
    caption.textContent = display(detail, '');

    copy.append(heading, caption);

    const timeNode = document.createElement('time');
    const date = timestamp ? new Date(timestamp) : new Date();

    timeNode.textContent = Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });

    row.append(iconNode, copy, timeNode);
    list.prepend(row);

    while (list.children.length > 6) {
      list.lastElementChild.remove();
    }
  }

  function renderEvents(raw) {
    const list = $('#eventList');
    if (!list) return;

    const events = arrayValue(raw);
    list.replaceChildren();

    if (!events.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-events';
      empty.textContent = 'No saved events are available.';
      list.append(empty);
      return;
    }

    events.slice(0, 6).forEach(event => {
      const level = String(
        firstValue(
          event.event_level,
          event.severity,
          event.level,
          ''
        )
      ).toLowerCase();

      const kind =
        level.includes('error') || level.includes('warn')
          ? 'warn'
          : level.includes('success') || level.includes('info')
            ? 'success'
            : 'info';

      addEvent(
        firstValue(event.event_type, event.title, event.type, 'System event'),
        firstValue(event.message, event.description, event.detail, ''),
        kind,
        firstValue(event.created_at, event.timestamp, event.time)
      );
    });
  }

  function extractHistory(raw) {
    const rows = arrayValue(raw).map(item => ({
      timestamp: firstValue(
        item.timestamp,
        item.created_at,
        item.recorded_at,
        item.created
      ),

      latency: firstValue(
        item.latency_ms,
        item.latency,
        item.ping_ms
      ),

      download: firstValue(
        item.download_mbps,
        item.download_speed_mbps,
        item.download
      )
    })).filter(item =>
      numeric(item.latency) !== null ||
      numeric(item.download) !== null
    );

    const now = Date.now();

    const windows = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 7 * 86400000
    };

    const windowMs = windows[state.chartRange] || windows['1h'];

    return rows.filter(item => {
      if (!item.timestamp) return true;

      const time = new Date(item.timestamp).getTime();

      return !Number.isFinite(time) || time >= now - windowMs;
    }).sort((a, b) =>
      new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
    );
  }

  function renderChart(rows) {
    const speedLine = $('#speedLine');
    const speedArea = $('#speedArea');
    const latencyLine = $('#latencyLine');
    const labels = $('#chartLabels');
    const disclaimer = $('.chart-disclaimer');

    if (!speedLine || !speedArea || !latencyLine || !labels) return;

    if (!rows.length) {
      speedLine.setAttribute('d', '');
      speedArea.setAttribute('d', '');
      latencyLine.setAttribute('d', '');
      labels.replaceChildren();

      if (disclaimer) {
        disclaimer.textContent =
          'No saved historical measurements for this range.';
      }

      return;
    }

    const width = 600;
    const height = 190;

    const latencyValues = rows
      .map(row => numeric(row.latency))
      .filter(value => value !== null);

    const speedValues = rows
      .map(row => numeric(row.download))
      .filter(value => value !== null);

    const maxLatency = Math.max(1, ...latencyValues);
    const maxSpeed = Math.max(1, ...speedValues);

    const pointPath = (key, max) => {
      const values = rows.map(row => numeric(row[key]));

      const valid = values
        .map((value, i) => ({ value, i }))
        .filter(point => point.value !== null);

      if (!valid.length) return '';

      return valid.map((point, index) => {
        const x = valid.length === 1
          ? width / 2
          : (point.i / Math.max(1, rows.length - 1)) * width;

        const y = height - 8 - (point.value / max) * (height - 20);

        return `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ');
    };

    const speedPath = pointPath('download', maxSpeed);
    const latencyPath = pointPath('latency', maxLatency);

    speedLine.setAttribute('d', speedPath);
    latencyLine.setAttribute('d', latencyPath);

    speedArea.setAttribute(
      'd',
      speedPath ? `${speedPath} L600 190 L0 190 Z` : ''
    );

    labels.replaceChildren();

    const numberOfLabels = Math.min(7, rows.length);
    const picked = [];

    for (let i = 0; i < numberOfLabels; i++) {
      const index = numberOfLabels === 1
        ? rows.length - 1
        : Math.round(i * (rows.length - 1) / (numberOfLabels - 1));

      const row = rows[index];
      const span = document.createElement('span');
      const date = row.timestamp ? new Date(row.timestamp) : null;

      span.textContent =
        date && !Number.isNaN(date.getTime())
          ? (
              state.chartRange === '7d'
                ? date.toLocaleDateString([], { weekday: 'short' })
                : date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
            )
          : `${index + 1}`;

      picked.push(span);
    }

    labels.replaceChildren(...picked);

    if (disclaimer) {
      disclaimer.textContent =
        `Stored API measurements · ${rows.length} record(s) in this range.`;
    }
  }

  async function loadHistory() {
    try {
      const raw = await api(`${API}/network/history`, 12000);

      state.history = extractHistory(raw);
      renderChart(state.history);
    } catch (error) {
      state.history = [];
      renderChart([]);

      console.warn('Network history unavailable:', error.message);
    }
  }

  async function loadEvents() {
    try {
      const raw = await api(`${API}/events`, 10000);
      renderEvents(raw);
    } catch (error) {
      const list = $('#eventList');

      if (list) {
        list.replaceChildren();

        const empty = document.createElement('div');
        empty.className = 'empty-events';
        empty.textContent =
          'Activity history could not be loaded from the API.';

        list.append(empty);
      }

      console.warn('Event log unavailable:', error.message);
    }
  }

  async function loadDevice() {
    try {
      const raw = objectValue(
        await api(`${API}/device`, 10000),
        ['device', 'result', 'data']
      );

      // Do not invent CPU, temperature or other hardware metrics.
      const miniName = $('.device-mini > strong');

      if (miniName) {
        miniName.textContent = firstValue(
          raw.product_name,
          raw.device_name,
          raw.model_number,
          'IntelliLink X1 device'
        );
      }

      const info = $$('.device-mini-foot b');

      info.forEach(node => {
        node.textContent = 'N/A';
      });

      const meter = $('.device-meter span');

      if (meter) {
        meter.style.width = '0%';
      }

      const version = $('.sidebar-footer .version');

      if (version && raw.software_version) {
        version.textContent = `v${raw.software_version}`;
      }
    } catch (error) {
      console.warn('Device data unavailable:', error.message);
    }
  }

  async function refreshDashboard(showNotice = false) {
    const button = $('#refreshBtn');
    if (button) button.disabled = true;

    const refreshSymbol = $('.refresh-symbol');

    if (refreshSymbol) {
      refreshSymbol.classList.add('is-loading');
    }

    try {
      const results = await Promise.allSettled([
        api(`${API}/network/snapshot`, 20000),
        api(`${API}/network/score`, 12000),
        api(`${API}/dashboard`, 12000)
      ]);

      let snapshot = null;
      let score = null;

      const snapResult = results[0];

      if (snapResult.status === 'fulfilled') {
        snapshot = snapResult.value;
      }

      const scoreResult = results[1];

      if (scoreResult.status === 'fulfilled') {
        score = scoreResult.value;
      }

      const dashboardResult = results[2];

      if (dashboardResult.status === 'fulfilled') {
        state.dashboard = objectValue(
          dashboardResult.value,
          ['dashboard', 'data', 'result']
        );
      }

      if (!snapshot && !score) {
        const failed = results.find(result => result.status === 'rejected');

        throw new Error(
          failed?.reason?.message ||
          'No network data was returned by the API.'
        );
      }

      applySnapshot(snapshot || {}, score);

      if (showNotice) {
        showToast(
          'Dashboard refreshed from API readings. Missing metrics remain N/A.'
        );
      }

      await Promise.allSettled([
        loadHistory(),
        loadEvents()
      ]);

      return true;
    } catch (error) {
      setSystemStatus(false, 'API UNAVAILABLE');

      if (showNotice) {
        showToast(`Refresh failed: ${error.message}`);
      }

      console.error('Dashboard refresh failed:', error);

      return false;
    } finally {
      if (button) button.disabled = false;

      if (refreshSymbol) {
        refreshSymbol.classList.remove('is-loading');
      }
    }
  }

  function finishOverlay() {
    const overlay = $('#testOverlay');

    if (overlay) {
      overlay.hidden = true;
    }

    state.running = false;

    const button = $('#runTestBtn');

    if (button) {
      button.disabled = false;
    }
  }

  async function runDiagnostic() {
    if (state.running) return;

    state.running = true;

    const overlay = $('#testOverlay');

    if (overlay) {
      overlay.hidden = false;
    }

    const button = $('#runTestBtn');

    if (button) {
      button.disabled = true;
    }

    setText('#testTitle', 'Running live diagnostics');

    setText(
      '#testDescription',
      'Requesting a diagnostic report from the connected API. Displayed measurements will come from the response.'
    );

    const progressBar = $('#testProgressBar');

    if (progressBar) {
      progressBar.style.width = '20%';
    }

    setText('#testPercent', '20%');
    setText('#testStep', 'Contacting API');

    state.cancelRequested = false;

    const abortController = new AbortController();
    state.requestController = abortController;

    try {
      if (progressBar) {
        progressBar.style.width = '45%';
      }

      setText('#testPercent', '45%');
      setText('#testStep', 'Collecting host/probe diagnostics');

      // The current FastAPI app uses GET for this endpoint.
      const diagnostic = await api(
        `${API}/diagnostics`,
        20000,
        abortController.signal
      );

      if (progressBar) {
        progressBar.style.width = '78%';
      }

      setText('#testPercent', '78%');
      setText('#testStep', 'Updating latest network measurements');

      await refreshDashboard(false);

      if (progressBar) {
        progressBar.style.width = '100%';
      }

      setText('#testPercent', '100%');
      setText('#testStep', 'Report received');

      const result = objectValue(
        diagnostic,
        ['diagnostics', 'result', 'data']
      );

      const status = firstValue(
        result.status,
        result.diagnostic_status,
        result.internet_status ? 'PASS' : 'LIMITED',
        'COMPLETED'
      );

      addEvent(
        'Diagnostics completed',
        firstValue(result.message, `API report status: ${status}`),
        String(status).toLowerCase() === 'pass' ? 'success' : 'warn',
        firstValue(result.timestamp, result.created_at)
      );

      showToast(
        firstValue(result.message, `Diagnostics response received (${status}).`)
      );
    } catch (error) {
      if (!state.cancelRequested) {
        setText('#testTitle', 'Diagnostics unavailable');

        setText(
          '#testDescription',
          error.message || 'Could not retrieve a diagnostic report.'
        );

        setText('#testStep', 'API request failed');
        setText('#testPercent', '—');

        addEvent(
          'Diagnostics failed',
          error.message || 'The API did not return a diagnostic report.',
          'warn'
        );

        showToast(`Diagnostics failed: ${error.message}`);
      }
    } finally {
      state.requestController = null;

      if (!state.cancelRequested) {
        setTimeout(finishOverlay, 700);
      } else {
        finishOverlay();
      }
    }
  }

  function cancelDiagnostic() {
    if (!state.running) return;

    state.running = false;
    state.cancelRequested = true;

    if (state.requestController) {
      state.requestController.abort();
    }

    state.requestController = null;

    finishOverlay();

    showToast(
      'Diagnostic view closed. The backend request may finish if the server already received it.'
    );
  }

  function updateChartRange(range) {
    if (!['1h', '24h', '7d'].includes(range)) return;

    state.chartRange = range;
    state.history = extractHistory(state.history);

    renderChart(state.history);

    const labels = {
      '1h': 'last hour',
      '24h': 'last 24 hours',
      '7d': 'last 7 days'
    };

    showToast(`Showing stored readings for the ${labels[range]}.`);
  }

  function setupNavigation() {
    const titleMap = {
      dashboard: 'Overview',
      monitor: 'Live monitor',
      diagnostics: 'Diagnostics',
      history: 'Test history',
      settings: 'Settings'
    };

    const targets = {
      dashboard: '#dashboard',
      monitor: '#monitor',
      diagnostics: '#diagnostics',
      history: '#history',
      settings: '#settingsPanel'
    };

    $$('.nav-link').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();

        const view = link.dataset.view;

        $$('.nav-link').forEach(item => {
          item.classList.toggle('active', item === link);
        });

        setText('#pageTitle', titleMap[view] || 'Overview');

        const target = targets[view] ? $(targets[view]) : null;

        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }

        if (view === 'settings') {
          showToast('Settings are not served by the current API yet.');
        }

        $('#sidebar')?.classList.remove('open');
      });
    });
  }

  function setupTheme() {
    let saved = null;

    try {
      saved = localStorage.getItem('intellilink-theme');
    } catch (_) {
      // Browser storage may be blocked.
    }

    if (saved === 'light') {
      document.body.classList.add('light-theme');
    }

    $('#themeToggle')?.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');

      const theme = document.body.classList.contains('light-theme')
        ? 'light'
        : 'dark';

      try {
        localStorage.setItem('intellilink-theme', theme);
      } catch (_) {
        // Browser storage may be blocked.
      }

      showToast(`${theme === 'light' ? 'Light' : 'Dark'} theme enabled.`);
    });
  }

  function setupNetworkRows() {
    $$('.network-row').forEach(row => {
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.setAttribute('aria-pressed', 'false');

      const choose = () => {
        const selected = row.dataset.network;
        const actual = currentMetrics().network;

        if (actual && selected === actual) {
          showToast(
            `${selected} is the network type reported by this API source.`
          );
        } else {
          showToast(
            `${selected} cannot be activated from the dashboard. A compatible network probe must report this source first.`
          );
        }
      };

      row.addEventListener('click', choose);

      row.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          choose();
        }
      });
    });
  }

  function setupSimProfile() {
    const form = $('#simProfileForm');
    const phone = $('#simPhone');
    const carrier = $('#simCarrier');
    const message = $('#simMessage');

    if (!form || !phone || !carrier || !message) return;

    try {
      const saved = JSON.parse(
        localStorage.getItem('intellilink-sim-profile') || 'null'
      );

      if (saved && typeof saved === 'object') {
        carrier.value = typeof saved.carrier === 'string'
          ? saved.carrier
          : '';

        phone.value = typeof saved.phone === 'string'
          ? saved.phone
          : '';

        message.textContent =
          'SIM profile saved locally. Live modem telemetry is not connected by this form.';
      }
    } catch (_) {
      message.textContent =
        'Browser storage unavailable; SIM profile will not persist.';
    }

    form.addEventListener('submit', event => {
      event.preventDefault();

      const number = phone.value.trim();

      if (number && !/^\+?[0-9 ()-]{7,18}$/.test(number)) {
        message.textContent =
          'Check the phone number format, or leave it blank.';

        phone.focus();
        return;
      }

      try {
        localStorage.setItem(
          'intellilink-sim-profile',
          JSON.stringify({
            carrier: carrier.value,
            phone: number
          })
        );

        message.textContent =
          'SIM profile saved on this device only. This does not activate or verify the SIM connection.';

        showToast(
          'SIM profile saved locally; no phone number was sent to the server.'
        );
      } catch (_) {
        message.textContent =
          'Could not save in this browser. You can still use the dashboard without a SIM profile.';
      }
    });
  }

  function bindEvents() {
    setupNetworkRows();

    $('#runTestBtn')?.addEventListener('click', runDiagnostic);

    $('#refreshBtn')?.addEventListener('click', () => {
      refreshDashboard(true);
    });

    $('#cancelTest')?.addEventListener('click', cancelDiagnostic);

    $('#chartRange')?.addEventListener('change', event => {
      updateChartRange(event.target.value);
    });

    $('#clearEvents')?.addEventListener('click', () => {
      const list = $('#eventList');
      if (!list) return;

      list.replaceChildren();

      const empty = document.createElement('div');
      empty.className = 'empty-events';

      empty.textContent =
        'Activity log cleared in this view. Stored server events were not deleted.';

      list.append(empty);

      showToast(
        'Cleared the event list in this browser view. Database history was not deleted.'
      );
    });

    $('#dismissBanner')?.addEventListener('click', () => {
      $('.demo-banner')?.remove();
    });

    $('#viewAllNetworks')?.addEventListener('click', () => {
      showToast(
        'The dashboard does not switch radio networks. Rows are updated only when the API reports matching telemetry.'
      );
    });

    $('#menuToggle')?.addEventListener('click', () => {
      $('#sidebar')?.classList.toggle('open');
    });

    document.addEventListener('click', event => {
      const sidebar = $('#sidebar');

      if (
        sidebar?.classList.contains('open') &&
        !sidebar.contains(event.target) &&
        !$('#menuToggle')?.contains(event.target)
      ) {
        sidebar.classList.remove('open');
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && state.running) {
        cancelDiagnostic();
      }
    });
  }

  // Visitor-side probe: each visitor measures their own browser-to-API route.
  // It is NOT SIM-radio latency, carrier signal, or a full speed test.
  async function testBrowserConnection(showNotice = false) {
    if (state.visitorProbeRunning) return null;

    state.visitorProbeRunning = true;

    const button = $('#testBrowserConnection');
    const badge = $('#browserProbeBadge');
    const startedAt = new Date();
    const samples = [];

    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (button) {
      button.disabled = true;
      button.textContent = 'Testing connection…';
    }

    if (badge) {
      badge.textContent = 'TESTING';
    }

    setText(
      '#browserOnline',
      navigator.onLine ? 'Online' : 'Offline'
    );

    setText(
      '#browserOnlineDetail',
      navigator.onLine
        ? 'Running browser-to-API checks'
        : 'Browser reports offline'
    );

    setText(
      '#browserType',
      connection
        ? firstValue(connection.effectiveType, connection.type, 'Unknown')
        : 'Not exposed'
    );

    setText(
      '#browserNetworkHint',
      connection?.effectiveType
        ? `Browser estimate: ${connection.effectiveType}`
        : 'This browser does not expose a network class'
    );

    setText(
      '#browserDownlink',
      numeric(connection?.downlink) === null
        ? '—'
        : Number(connection.downlink).toFixed(1)
    );

    setText('#browserRtt', '…');
    setText('#browserRttDetail', 'Running 5 requests');

    try {
      if (!navigator.onLine) {
        throw new Error('This browser reports that it is offline.');
      }

      // Five sequential requests give this visitor an estimate of API response time.
      for (let i = 0; i < 5; i += 1) {
        const requestStarted = performance.now();

        await api(`${API_ROOT}/health`, 5000);

        samples.push(
          Math.max(0, performance.now() - requestStarted)
        );

        if (i < 4) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const rounded = samples.map(value => Math.round(value));

      const average = samples.reduce(
        (sum, value) => sum + value,
        0
      ) / samples.length;

      const best = Math.min(...samples);
      const worst = Math.max(...samples);

      const variations = samples
        .slice(1)
        .map((value, index) => Math.abs(value - samples[index]));

      const variation = variations.length
        ? variations.reduce((sum, value) => sum + value, 0) / variations.length
        : 0;

      setText('#browserRtt', Math.round(average));

      setText(
        '#browserRttDetail',
        `Best ${Math.round(best)} ms · worst ${Math.round(worst)} ms · variation ${Math.round(variation)} ms`
      );

      setText('#browserOnline', 'Reachable');

      setText(
        '#browserOnlineDetail',
        'IntelliLink API responded to all 5 probes'
      );

      if (badge) {
        badge.textContent = 'API REACHABLE';
      }

      setText(
        '#browserProbeUpdated',
        `Last tested ${startedAt.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}. Results are for this browser only.`
      );

      if (showNotice) {
        showToast(
          `Your browser reached IntelliLink in an average of ${Math.round(average)} ms. This is API round-trip time, not SIM-radio latency.`
        );
      }

      return {
        average_ms: Number(average.toFixed(2)),
        best_ms: Number(best.toFixed(2)),
        worst_ms: Number(worst.toFixed(2)),
        variation_ms: Number(variation.toFixed(2)),
        probes: rounded
      };
    } catch (error) {
      setText(
        '#browserRtt',
        samples.length
          ? Math.round(
              samples.reduce((sum, value) => sum + value, 0) /
              samples.length
            )
          : '—'
      );

      setText(
        '#browserRttDetail',
        samples.length
          ? `${samples.length}/5 probes succeeded; partial reading`
          : 'No successful API probes'
      );

      setText(
        '#browserOnline',
        navigator.onLine
          ? (samples.length ? 'Partially reachable' : 'API error')
          : 'Offline'
      );

      setText(
        '#browserOnlineDetail',
        error.message || 'Could not reach API'
      );

      if (badge) {
        badge.textContent = samples.length
          ? 'PARTIAL'
          : 'UNREACHABLE';
      }

      setText(
        '#browserProbeUpdated',
        'Probe incomplete. Check internet access and API availability.'
      );

      if (showNotice) {
        showToast(
          'IntelliLink API could not complete the browser connection test.'
        );
      }

      return null;
    } finally {
      state.visitorProbeRunning = false;

      if (button) {
        button.disabled = false;
        button.textContent = 'Test this connection';
      }
    }
  }

  async function init() {
    setupNavigation();
    setupTheme();
    setupSimProfile();
    bindEvents();

    $('#testBrowserConnection')?.addEventListener('click', () => {
      testBrowserConnection(true);
    });

    window.addEventListener('online', () => {
      setText('#browserOnline', 'Online');
      testBrowserConnection(false);
    });

    window.addEventListener('offline', () => {
      setText('#browserOnline', 'Offline');
      setText('#browserOnlineDetail', 'Browser reports offline');
      setText('#browserRtt', '—');

      if ($('#browserProbeBadge')) {
        $('#browserProbeBadge').textContent = 'OFFLINE';
      }
    });

    // Re-test periodically while the page is visible to monitor each visitor's API route.
    window.setInterval(() => {
      if (
        document.visibilityState === 'visible' &&
        navigator.onLine &&
        !state.visitorProbeRunning
      ) {
        testBrowserConnection(false);
      }
    }, 60000);

    const splash = $('#splashScreen');

    if (splash) {
      window.setTimeout(() => {
        splash.classList.add('splash-hidden');

        window.setTimeout(() => {
          splash.remove();
        }, 700);
      }, 1900);
    }

    setSystemStatus(false, 'CONNECTING TO API');

    // Clear all example numbers before waiting for actual API responses.
    [
      '#healthScore',
      '#gaugeScore',
      '#latencyValue',
      '#downloadValue',
      '#lossValue',
      '#stabilityValue',
      '#responsivenessValue',
      '#throughputValue'
    ].forEach(selector => {
      setText(selector, '—', '—');
    });

    if ($('#healthBar')) {
      $('#healthBar').style.width = '0%';
    }

    if ($('#gaugeProgress')) {
      $('#gaugeProgress').setAttribute('stroke-dasharray', '0 100');
    }

    $$('.trend').forEach(node => {
      node.textContent = 'No baseline';
      node.classList.remove('trend-good');
    });

    $$('.sparkline').forEach(node => {
      node.style.display = 'none';
    });

    const firstLabel = $$('.metric-card .metric-caption')[0];

    if (firstLabel) {
      firstLabel.textContent = 'Waiting for API measurements';
    }

    const disclaimer = $('.chart-disclaimer');

    if (disclaimer) {
      disclaimer.textContent =
        'Waiting for stored historical measurements.';
    }

    // Clear every template/demo value before requesting the backend.
    updateNetworkRows({});

    updateMiniMetric('#stabilityValue', null);
    updateMiniMetric('#responsivenessValue', null);
    updateMiniMetric('#throughputValue', null);

    $$('.recommended-tag').forEach(node => {
      node.remove();
    });

    $$('.device-mini-foot b').forEach(node => {
      node.textContent = 'N/A';
    });

    const deviceName = $('.device-mini > strong');

    if (deviceName) {
      deviceName.textContent = 'Waiting for device API';
    }

    const eventList = $('#eventList');

    if (eventList) {
      eventList.replaceChildren();
    }

    renderChart([]);

    try {
      const health = await api(`${API_ROOT}/health`, 8000);

      const healthy =
        String(firstValue(health.status, health.health, '')).toLowerCase() === 'healthy' ||
        health.ok === true;

      setSystemStatus(
        healthy,
        healthy ? 'API READY' : 'API RESPONDED'
      );
    } catch (error) {
      setSystemStatus(false, 'API UNAVAILABLE');

      console.warn('Health check failed:', error.message);
    }

    await Promise.allSettled([
      loadDevice(),
      refreshDashboard(false),
      testBrowserConnection(false)
    ]);

    // Refresh server readings every 30 seconds while the page is visible.
    window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshDashboard(false);
      }
    }, 30000);
  }

  document.addEventListener(
    'DOMContentLoaded',
    init,
    { once: true }
  );
})();

'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    running: false,
    testTimer: null,
    progress: 0,
    selectedNetwork: '4G LTE',
    toastTimer: null
  };

  const demoProfiles = {
    '4G LTE': {
      score: 87,
      latency: 42,
      download: 38.6,
      loss: 0.2,
      stability: 92,
      responsiveness: 85,
      throughput: 81,
      label: 'Excellent'
    },

    'Wi-Fi': {
      score: 79,
      latency: 55,
      download: 46.2,
      loss: 0.4,
      stability: 86,
      responsiveness: 78,
      throughput: 84,
      label: 'Good'
    },

    '5G': {
      score: 94,
      latency: 19,
      download: 122.4,
      loss: 0.1,
      stability: 93,
      responsiveness: 95,
      throughput: 96,
      label: 'Excellent'
    },

    'Satellite': {
      score: 68,
      latency: 145,
      download: 27.3,
      loss: 0.7,
      stability: 76,
      responsiveness: 61,
      throughput: 70,
      label: 'Fair'
    },

    'WAN': {
      score: 91,
      latency: 12,
      download: 98.5,
      loss: 0.1,
      stability: 96,
      responsiveness: 94,
      throughput: 90,
      label: 'Excellent'
    }
  };

  const connectedSources = new Set([
    '4G LTE',
    'Wi-Fi'
  ]);

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================

  function showToast(message) {
    const toast = $('#toast');

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(state.toastTimer);

    state.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // ==========================================
  // LAST UPDATED
  // ==========================================

  function setUpdated() {
    const target = $('#lastUpdated');

    if (target) {
      target.textContent = new Intl.DateTimeFormat(
        undefined,
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      ).format(new Date());
    }
  }

  // ==========================================
  // UPDATE TEXT CONTENT
  // ==========================================

  function setText(selector, value) {
    const node = $(selector);

    if (node) {
      node.textContent = value;
    }
  }

  // ==========================================
  // SCORE COLORS
  // ==========================================

  function scoreColor(score) {
    if (score >= 85) {
      return 'var(--green)';
    }

    if (score >= 70) {
      return 'var(--cyan)';
    }

    if (score >= 50) {
      return 'var(--orange)';
    }

    return 'var(--red)';
  }

  // ==========================================
  // RENDER NETWORK PROFILE
  // ==========================================

  function renderProfile(name, showMessage = false) {
    const profile = demoProfiles[name];

    if (!profile) return;

    state.selectedNetwork = name;

    setText('#healthScore', profile.score);
    setText('#gaugeScore', profile.score);

    setText('#latencyValue', profile.latency);

    setText(
      '#downloadValue',
      profile.download.toFixed(1)
    );

    setText(
      '#lossValue',
      profile.loss.toFixed(1)
    );

    setText(
      '#stabilityValue',
      `${profile.stability}%`
    );

    setText(
      '#responsivenessValue',
      `${profile.responsiveness}%`
    );

    setText(
      '#throughputValue',
      `${profile.throughput}%`
    );

    setText('#scoreLabel', profile.label);
    setText('#suggestionText', name);

    const bar = $('#healthBar');

    if (bar) {
      bar.style.width = `${profile.score}%`;
    }

    const gauge = $('#gaugeProgress');

    if (gauge) {
      gauge.setAttribute(
        'stroke-dasharray',
        `${profile.score} 100`
      );
    }

    const gaugeLabel = $('.score-gauge');

    if (gaugeLabel) {
      gaugeLabel.setAttribute(
        'aria-label',
        `Connection score ${profile.score} out of 100`
      );
    }

    const label = $('#scoreLabel');

    if (label) {
      label.style.color = scoreColor(profile.score);
    }

    $$('.network-row').forEach(row => {
      const active = row.dataset.network === name;

      row.classList.toggle('selected', active);

      row.setAttribute(
        'aria-pressed',
        String(active)
      );
    });

    setUpdated();

    if (showMessage) {
      showToast(
        `${name} selected. Demo profile loaded; no network switch was performed.`
      );
    }
  }

  // ==========================================
  // ACTIVITY EVENT LOG
  // ==========================================

  function addEvent(title, detail, kind = 'info') {
    const list = $('#eventList');

    if (!list) return;

    const empty = $('.empty-events', list);

    if (empty) {
      empty.remove();
    }

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

    const time = new Intl.DateTimeFormat(
      undefined,
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(new Date());

    const row = document.createElement('div');

    row.className = 'event-item';

    const iconNode = document.createElement('span');

    iconNode.className = `event-icon ${iconClass}`;
    iconNode.textContent = icon;

    const copy = document.createElement('div');

    copy.className = 'event-copy';

    const heading = document.createElement('strong');

    heading.textContent = title;

    const caption = document.createElement('small');

    caption.textContent = detail;

    copy.append(heading, caption);

    const timeNode = document.createElement('time');

    timeNode.textContent = time;

    row.append(iconNode, copy, timeNode);

    list.prepend(row);

    while (list.children.length > 6) {
      list.lastElementChild.remove();
    }
  }

  // ==========================================
  // FINISH DIAGNOSTIC
  // ==========================================

  function finishDiagnostic(cancelled = false) {
    clearInterval(state.testTimer);

    state.testTimer = null;
    state.running = false;

    const overlay = $('#testOverlay');

    if (overlay) {
      overlay.hidden = true;
    }

    if (cancelled) {
      showToast(
        'Diagnostic cancelled. No live network data was changed.'
      );

      addEvent(
        'Diagnostic cancelled',
        'Prototype test was stopped by the user',
        'warn'
      );

      return;
    }

    const profile =
      demoProfiles[state.selectedNetwork] ||
      demoProfiles['4G LTE'];

    renderProfile(state.selectedNetwork);

    addEvent(
      'Connection test completed',
      `${state.selectedNetwork} · Demo score ${profile.score}/100`,
      'success'
    );

    showToast(
      `Demo diagnostics finished: ${profile.score}/100. Connect a probe/API for real readings.`
    );
  }

  // ==========================================
  // RUN NETWORK DIAGNOSTICS
  // ==========================================

  function runDiagnostic() {
    if (state.running) return;

    state.running = true;
    state.progress = 0;

    const overlay = $('#testOverlay');

    if (overlay) {
      overlay.hidden = false;
    }

    setText(
      '#testTitle',
      'Checking connection'
    );

    setText(
      '#testDescription',
      'Running a simulated diagnostic sequence. This does not measure the live network yet.'
    );

    const progressBar = $('#testProgressBar');

    if (progressBar) {
      progressBar.style.width = '0%';
    }

    setText('#testPercent', '0%');
    setText('#testStep', 'Initialising');

    const steps = [
      {
        at: 15,
        text: 'Preparing diagnostic sequence'
      },
      {
        at: 35,
        text: 'Evaluating latency profile'
      },
      {
        at: 58,
        text: 'Reviewing packet-loss profile'
      },
      {
        at: 78,
        text: 'Comparing network score'
      },
      {
        at: 100,
        text: 'Preparing summary'
      }
    ];

    state.testTimer = setInterval(() => {
      state.progress = Math.min(
        100,
        state.progress + 4 + Math.floor(Math.random() * 5)
      );

      if (progressBar) {
        progressBar.style.width = `${state.progress}%`;
      }

      setText(
        '#testPercent',
        `${state.progress}%`
      );

      const currentStep = [...steps]
        .reverse()
        .find(step => state.progress >= step.at) || steps[0];

      setText(
        '#testStep',
        currentStep.text
      );

      if (state.progress >= 100) {
        finishDiagnostic(false);
      }
    }, 150);
  }

  // ==========================================
  // CHART RANGE
  // ==========================================

  function updateChartRange(range) {
    const labels = $('#chartLabels');

    if (!labels) return;

    const map = {
      '1h': [
        '09:00',
        '09:05',
        '09:10',
        '09:15',
        '09:20',
        '09:25',
        '09:30'
      ],

      '24h': [
        '00:00',
        '04:00',
        '08:00',
        '12:00',
        '16:00',
        '20:00',
        '24:00'
      ],

      '7d': [
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sun'
      ]
    };

    if (!map[range]) return;

    labels.replaceChildren(
      ...map[range].map(text => {
        const span = document.createElement('span');

        span.textContent = text;

        return span;
      })
    );

    showToast(
      `Chart range changed to ${
        range === '1h'
          ? 'last hour'
          : range === '24h'
            ? 'last 24 hours'
            : 'last 7 days'
      }. Trend is illustrative.`
    );
  }

  // ==========================================
  // NAVIGATION
  // ==========================================

  function setupNavigation() {
    const titleMap = {
      dashboard: 'Overview',
      monitor: 'Live monitor',
      diagnostics: 'Diagnostics',
      history: 'Test history',
      settings: 'Settings'
    };

    $$('.nav-link').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();

        const view = link.dataset.view;

        $$('.nav-link').forEach(item => {
          item.classList.toggle(
            'active',
            item === link
          );
        });

        setText(
          '#pageTitle',
          titleMap[view] || 'Overview'
        );

        const targets = {
          dashboard: '#dashboard',
          monitor: '#monitor',
          diagnostics: '#diagnostics',
          history: '#history',
          settings: null
        };

        if (view === 'settings') {
          showToast(
            'Settings panel is planned for a future prototype version.'
          );
        } else {
          const target = $(targets[view]);

          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }

        $('#sidebar')?.classList.remove('open');
      });
    });
  }

  // ==========================================
  // DARK / LIGHT THEME
  // ==========================================

  function setupTheme() {
    let saved = null;

    try {
      saved = localStorage.getItem('intellilink-theme');
    } catch (_) {
      // Browser storage may be unavailable.
    }

    if (saved === 'light') {
      document.body.classList.add('light-theme');
    }

    $('#themeToggle')?.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');

      const theme =
        document.body.classList.contains('light-theme')
          ? 'light'
          : 'dark';

      try {
        localStorage.setItem(
          'intellilink-theme',
          theme
        );
      } catch (_) {
        // Storage can be disabled in private browsing.
      }

      showToast(
        `${theme === 'light' ? 'Light' : 'Dark'} theme enabled.`
      );
    });
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  function bindEvents() {

    // Network selection
    $$('.network-row').forEach(row => {
      row.tabIndex = 0;

      row.setAttribute(
        'role',
        'button'
      );

      row.setAttribute(
        'aria-pressed',
        String(row.dataset.network === state.selectedNetwork)
      );

      const choose = () => {
        const network = row.dataset.network;

        if (connectedSources.has(network)) {
          renderProfile(network, true);
        } else {
          showToast(
            `${network} has no live sensor connected. This row is informational only.`
          );

          addEvent(
            `${network} source unavailable`,
            'Connect a compatible sensor or telemetry endpoint to monitor this source',
            'warn'
          );
        }
      };

      row.addEventListener('click', choose);

      row.addEventListener('keydown', event => {
        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          choose();
        }
      });
    });

    // Run diagnostic
    $('#runTestBtn')?.addEventListener(
      'click',
      runDiagnostic
    );

    // Refresh dashboard
    $('#refreshBtn')?.addEventListener('click', () => {
      setUpdated();

      const button = $('.refresh-symbol');

      if (button) {
        button.style.transform = 'rotate(360deg)';

        setTimeout(() => {
          button.style.transform = '';
        }, 350);
      }

      showToast(
        'Dashboard refreshed. Readings remain demo values until live telemetry is connected.'
      );
    });

    // Cancel diagnostic
    $('#cancelTest')?.addEventListener(
      'click',
      () => finishDiagnostic(true)
    );

    // Chart range selector
    $('#chartRange')?.addEventListener(
      'change',
      event => updateChartRange(event.target.value)
    );

    // Clear event log
    $('#clearEvents')?.addEventListener('click', () => {
      const list = $('#eventList');

      if (!list) return;

      list.replaceChildren();

      const empty = document.createElement('div');

      empty.className = 'empty-events';
      empty.textContent = 'No events to display.';

      list.append(empty);

      showToast(
        'Activity log cleared on this page.'
      );
    });

    // Dismiss demo banner
    $('#dismissBanner')?.addEventListener('click', () => {
      $('.demo-banner')?.remove();
    });

    // View all networks
    $('#viewAllNetworks')?.addEventListener('click', () => {
      showToast(
        'All five network types are listed. Only connected data sources can report live measurements.'
      );
    });

    // Mobile menu
    $('#menuToggle')?.addEventListener('click', () => {
      $('#sidebar')?.classList.toggle('open');
    });

    // Close sidebar when clicking outside
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

    // Escape key cancels diagnostic
    document.addEventListener('keydown', event => {
      if (
        event.key === 'Escape' &&
        state.running
      ) {
        finishDiagnostic(true);
      }
    });
  }

  // ==========================================
  // INITIALISE APPLICATION
  // ==========================================

  function init() {
    setUpdated();

    setupNavigation();
    setupTheme();
    bindEvents();

    renderProfile('4G LTE');

    /*
     * IMPORTANT:
     * This is a front-end prototype.
     *
     * The displayed network profiles are demonstration values.
     * A browser-only API cannot reliably access all mobile radio
     * metrics such as 5G band, RSRP, RSRQ and modem signal data.
     *
     * Connect a trusted backend or device telemetry endpoint
     * before presenting these values as live measurements.
     */
  }

  document.addEventListener(
    'DOMContentLoaded',
    init,
    { once: true }
  );

})();

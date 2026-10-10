/* =========================================================
   INTELLILINK X1
   AI-POWERED PREDICTIVE MULTI-CONNECTIVITY
   NETWORK MANAGEMENT SYSTEM

   Developer: MSAFIRI GROUP
   Version: 0.1.0
   Backend: FastAPI
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const ILX = {
    name: "IntelliLink X1",
    version: "0.1.0",
    api: "/api/v1",
    refreshInterval: 20000,
    requestTimeout: 12000
};


/* =========================================================
   APPLICATION STATE
   ========================================================= */

const state = {
    currentPage: "dashboard",
    device: null,
    network: null,
    snapshot: null,
    diagnostics: null,
    speedTest: null,
    isRefreshing: false,
    isDiagnosing: false,
    isTestingSpeed: false,
    initialized: false,
    refreshTimer: null
};


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


function setText(id, value, fallback = "N/A") {
    const element = $(id);

    if (!element) return;

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        element.textContent = fallback;
        return;
    }

    element.textContent = String(value);
}


function setHTML(id, value) {
    const element = $(id);

    if (!element) return;

    element.innerHTML = value;
}


function showElement(element) {
    if (!element) return;

    element.hidden = false;
    element.style.display = "";
}


function hideElement(element) {
    if (!element) return;

    element.hidden = true;
}


function formatNumber(value, decimals = 1) {
    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return "N/A";
    }

    return Number(value).toFixed(decimals);
}


function formatMilliseconds(value) {
    const number = Number(value);

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(number)
    ) {
        return "N/A";
    }

    return `${formatNumber(number, 1)} ms`;
}


function formatMbps(value) {
    const number = Number(value);

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(number)
    ) {
        return "N/A";
    }

    return `${formatNumber(number, 2)} Mbps`;
}


function formatTimestamp(value) {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}


/* =========================================================
   SAFE API REQUESTS
   ========================================================= */

async function apiRequest(path, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, ILX.requestTimeout);

    try {
        const response = await fetch(path, {
            ...options,
            signal: controller.signal,
            headers: {
                Accept: "application/json",
                ...(options.headers || {})
            }
        });

        const contentType =
            response.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const detail =
                typeof data === "object" && data !== null
                    ? data.detail || data.message || data.error
                    : data;

            throw new Error(
                detail || `HTTP ${response.status}`
            );
        }

        return data;

    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(
                "Ombi limechukua muda mrefu kujibu. Jaribu tena."
            );
        }

        throw error;

    } finally {
        clearTimeout(timeout);
    }
}


async function apiGet(path) {
    return apiRequest(path, {
        method: "GET",
        cache: "no-store"
    });
}


/* =========================================================
   TOAST NOTIFICATIONS
   ========================================================= */

function showToast(
    title,
    message,
    type = "info"
) {
    const toast = $("toast");

    if (!toast) {
        console.log(`[${type}] ${title}: ${message}`);
        return;
    }

    setText("toastTitle", title);
    setText("toastMessage", message);

    toast.dataset.type = type;

    showElement(toast);

    toast.classList.remove("show");

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}


/* =========================================================
   LOADING OVERLAY
   ========================================================= */

function showLoading(message = "Loading IntelliLink X1...") {
    const overlay = $("loadingOverlay");

    if (!overlay) return;

    setText("loadingMessage", message);

    showElement(overlay);
}


function hideLoading() {
    const overlay = $("loadingOverlay");

    if (!overlay) return;

    hideElement(overlay);
}


/* =========================================================
   SPLASH SCREEN
   ========================================================= */

function runSplashScreen() {
    const splash = $("splashScreen");

    if (!splash) {
        document.body.classList.add("app-ready");
        return;
    }

    document.body.classList.add("splash-active");

    splash.classList.remove("splash-hidden");

    splash.setAttribute("aria-hidden", "false");

    // Ensure the animation is restarted on a fresh page load.
    const logo = $("splashLogo");

    if (logo) {
        logo.classList.remove("logo-animate");

        void logo.offsetWidth;

        logo.classList.add("logo-animate");
    }

    const minimumDuration = 2200;

    const maximumDuration = 3800;

    const start = Date.now();

    const finishSplash = () => {
        const elapsed = Date.now() - start;

        const remaining = Math.max(
            0,
            minimumDuration - elapsed
        );

        setTimeout(() => {
            splash.classList.add("splash-hidden");

            splash.setAttribute("aria-hidden", "true");

            document.body.classList.remove("splash-active");

            document.body.classList.add("app-ready");

            setTimeout(() => {
                splash.style.display = "none";
            }, 700);

        }, remaining);
    };

    // The splash should not trap the user if an API is slow.
    const safetyTimer = setTimeout(
        finishSplash,
        maximumDuration
    );

    window.addEventListener(
        "load",
        () => {
            clearTimeout(safetyTimer);
            finishSplash();
        },
        { once: true }
    );
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function normalizePageName(name) {
    const value = String(name || "")
        .trim()
        .toLowerCase();

    const allowed = [
        "dashboard",
        "network",
        "diagnostics",
        "device"
    ];

    return allowed.includes(value)
        ? value
        : "dashboard";
}


function showPage(pageName) {
    const page = normalizePageName(pageName);

    state.currentPage = page;

    const sections = document.querySelectorAll(
        "[data-page], .page-section, .app-section"
    );

    sections.forEach(section => {
        const sectionPage =
            section.dataset.page ||
            section.id.replace(/^page-/, "").replace(/-section$/, "");

        if (
            sectionPage === page ||
            section.id === page ||
            section.id === `${page}-section` ||
            section.id === `page-${page}`
        ) {
            section.hidden = false;

            section.classList.add("active");

            section.setAttribute("aria-hidden", "false");
        } else {
            section.hidden = true;

            section.classList.remove("active");

            section.setAttribute("aria-hidden", "true");
        }
    });

    // Support navigation links using data-page-target.
    document.querySelectorAll(
        "[data-page-target]"
    ).forEach(button => {
        const active =
            button.dataset.pageTarget === page;

        button.classList.toggle("active", active);

        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    // Support buttons and links with data-page.
    document.querySelectorAll(
        "[data-nav-page]"
    ).forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.navPage === page
        );
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (page === "network") {
        loadNetworkPage();
    }

    if (page === "device") {
        loadDevice();
    }

    if (page === "diagnostics") {
        loadDiagnosticsSummary();
    }
}


function initializeNavigation() {
    document.addEventListener("click", event => {
        const button = event.target.closest(
            "[data-page-target], [data-nav-page]"
        );

        if (!button) return;

        const target =
            button.dataset.pageTarget ||
            button.dataset.navPage;

        if (!target) return;

        event.preventDefault();

        showPage(target);
    });

    // Support common existing navigation IDs.
    const fallbackNavigation = {
        "nav-dashboard": "dashboard",
        "nav-network": "network",
        "nav-diagnostics": "diagnostics",
        "nav-device": "device"
    };

    Object.entries(fallbackNavigation).forEach(
        ([id, page]) => {
            const element = $(id);

            if (!element) return;

            element.addEventListener("click", event => {
                event.preventDefault();
                showPage(page);
            });
        }
    );
}


/* =========================================================
   NETWORK SCORE
   ========================================================= */

function updateNetworkScore(data) {
    if (!data) return;

    const score = Number(data.score);

    const validScore =
        Number.isFinite(score)
        && score >= 0
        && score <= 100;

    setText(
        "networkScore",
        validScore ? Math.round(score) : "N/A"
    );

    setText(
        "networkQuality",
        data.quality || "UNKNOWN"
    );

    setText(
        "scoreDescription",
        data.score_description ||
        data.description ||
        "Waiting for network measurements."
    );

    const scoreBar = $("scoreBar");

    if (scoreBar && validScore) {
        scoreBar.style.width = `${score}%`;

        scoreBar.setAttribute(
            "aria-valuenow",
            String(Math.round(score))
        );
    }

    const quality = String(
        data.quality || "UNKNOWN"
    ).toUpperCase();

    const scoreContainer =
        $("networkScoreCard") ||
        $("scoreCard");

    if (scoreContainer) {
        scoreContainer.dataset.quality =
            quality.toLowerCase();
    }
}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function updateConnectionStatus(data) {
    if (!data) return;

    const connected =
        data.internet === true ||
        String(data.status || "").toUpperCase() === "CONNECTED";

    setText(
        "connectionType",
        data.connection_type ||
        data.type ||
        "UNKNOWN"
    );

    setText(
        "wifiSSID",
        data.ssid ||
        data.name ||
        "N/A"
    );

    setText(
        "wifiStatus",
        connected ? "Connected" : "Unavailable"
    );

    setText(
        "ipAddress",
        data.local_ip ||
        data.ip ||
        "N/A"
    );

    setText(
        "networkType",
        data.connection_type ||
        data.type ||
        "UNKNOWN"
    );

    setText(
        "networkName",
        data.name ||
        data.ssid ||
        "N/A"
    );

    setText(
        "networkIP",
        data.local_ip ||
        data.ip ||
        "N/A"
    );

    setText(
        "networkGateway",
        data.gateway ||
        "N/A"
    );

    setText(
        "networkInterface",
        data.interface ||
        "N/A"
    );

    setText(
        "networkConnectionStatus",
        connected ? "CONNECTED" : "OFFLINE"
    );

    const dot = $("connectionDot");

    if (dot) {
        dot.classList.toggle("online", connected);
        dot.classList.toggle("offline", !connected);
    }

    const liveDot = $("liveDot");

    if (liveDot) {
        liveDot.classList.toggle("online", connected);
        liveDot.classList.toggle("offline", !connected);
    }

    setText(
        "systemStatus",
        connected ? "ONLINE" : "OFFLINE"
    );
}


/* =========================================================
   NETWORK PERFORMANCE
   ========================================================= */

function updateNetworkPerformance(data) {
    if (!data) return;

    setText(
        "latencyValue",
        formatNumber(data.latency_ms, 1)
    );

    setText(
        "jitterValue",
        formatNumber(data.jitter_ms, 1)
    );

    setText(
        "packetLossValue",
        data.packet_loss_percent === null ||
        data.packet_loss_percent === undefined
            ? "N/A"
            : formatNumber(data.packet_loss_percent, 1)
    );

    setText(
        "signalValue",
        data.signal || "N/A"
    );

    setText(
        "downloadSpeed",
        formatMbps(data.download_mbps)
    );

    setText(
        "uploadSpeed",
        formatMbps(data.upload_mbps)
    );

    setText(
        "lastUpdate",
        formatTimestamp(data.timestamp)
    );

    setText(
        "networkLastUpdate",
        formatTimestamp(data.timestamp)
    );
}


/* =========================================================
   INTELLILINK INTELLIGENCE
   ========================================================= */

function updateIntelligence(data) {
    if (!data) return;

    const intelligence =
        data.intelligence || data;

    setText(
        "intelligencePriority",
        intelligence.priority || "NORMAL"
    );

    setText(
        "intelligenceAction",
        intelligence.action || "Monitor network"
    );

    setText(
        "intelligenceMessage",
        intelligence.message ||
        "Collecting network information."
    );

    const card = $("intelligenceCard");

    if (card) {
        card.dataset.priority = String(
            intelligence.priority || "NORMAL"
        ).toLowerCase();
    }
}


/* =========================================================
   NETWORK REFRESH
   ========================================================= */

async function refreshNetwork(options = {}) {
    if (state.isRefreshing) return;

    state.isRefreshing = true;

    const button = $("refreshNetworkButton");

    if (button) {
        button.disabled = true;
        button.classList.add("loading");
    }

    try {
        const [networkResult, snapshotResult] =
            await Promise.allSettled([
                apiGet(`${ILX.api}/network`),
                apiGet(`${ILX.api}/network/snapshot`)
            ]);

        if (networkResult.status === "fulfilled") {
            state.network = networkResult.value;

            updateConnectionStatus(
                state.network
            );
        }

        if (snapshotResult.status === "fulfilled") {
            state.snapshot = snapshotResult.value;

            updateNetworkScore(
                state.snapshot
            );

            updateNetworkPerformance(
                state.snapshot
            );

            updateIntelligence(
                state.snapshot
            );
        }

        const failures = [
            networkResult,
            snapshotResult
        ].filter(result =>
            result.status === "rejected"
        );

        if (failures.length === 2) {
            throw failures[0].reason;
        }

        if (options.notify) {
            showToast(
                "Network refreshed",
                "Taarifa za mtandao zimesasishwa.",
                "success"
            );
        }

    } catch (error) {
        console.error(
            "Network refresh failed:",
            error
        );

        if (options.notify) {
            showToast(
                "Network error",
                error.message,
                "error"
            );
        }

    } finally {
        state.isRefreshing = false;

        if (button) {
            button.disabled = false;
            button.classList.remove("loading");
        }
    }
}


/* =========================================================
   NETWORK PAGE
   ========================================================= */

async function loadNetworkPage() {
    try {
        const network = await apiGet(
            `${ILX.api}/network`
        );

        state.network = network;

        updateConnectionStatus(network);

    } catch (error) {
        console.error(
            "Could not load network page:",
            error
        );
    }
}


/* =========================================================
   WIFI INFORMATION
   ========================================================= */

async function loadWiFiInformation() {
    try {
        const wifi = await apiGet(
            `${ILX.api}/wifi`
        );

        if (wifi.ssid) {
            setText("wifiSSID", wifi.ssid);
            setText("networkName", wifi.ssid);
        }

        setText(
            "wifiStatus",
            wifi.status || "Unknown"
        );

        if (wifi.signal !== null && wifi.signal !== undefined) {
            setText("signalValue", wifi.signal);
        }

    } catch (error) {
        console.warn(
            "Wi-Fi details unavailable:",
            error.message
        );
    }
}


/* =========================================================
   DEVICE IDENTITY
   ========================================================= */

async function loadDevice() {
    try {
        const device = await apiGet(
            `${ILX.api}/device`
        );

        state.device = device;

        setText(
            "deviceStatus",
            device.status || "ACTIVE"
        );

        setText(
            "modelNumber",
            device.model_number
        );

        setText(
            "serialNumber",
            device.serial_number
        );

        setText(
            "deviceID",
            device.device_id
        );

        setText(
            "deviceUUID",
            device.device_uuid ||
            device.uuid
        );

        setText(
            "smartCardNumber",
            device.smart_card_number
        );

        setText(
            "hardwareRevision",
            device.hardware_revision
        );

        setText(
            "firmwareVersion",
            device.firmware_version
        );

        setText(
            "softwareVersion",
            device.software_version ||
            ILX.version
        );

        setText(
            "manufacturer",
            device.manufacturer ||
            "IntelliLink Systems"
        );

        setText(
            "countryCode",
            device.country_code ||
            "TZ"
        );

        setText(
            "timezone",
            device.timezone ||
            "Africa/Dar_es_Salaam"
        );

        setText(
            "deviceType",
            device.device_type ||
            "Network Management System"
        );

        setText(
            "platformSystem",
            device.platform_system
        );

        setText(
            "platformRelease",
            device.platform_release
        );

        setText(
            "platformArchitecture",
            device.platform_architecture
        );

        setText(
            "platformPython",
            device.platform_python
        );

    } catch (error) {
        console.error(
            "Device identity loading failed:",
            error
        );

        showToast(
            "Device information",
            "Taarifa za kifaa hazikupatikana.",
            "warning"
        );
    }
}


/* =========================================================
   DIAGNOSTICS
   ========================================================= */

async function loadDiagnosticsSummary() {
    try {
        const health = await apiGet("/health");

        setText(
            "diagPython",
            "Available"
        );

        setText(
            "diagInterface",
            state.network?.interface || "--"
        );

        setText(
            "diagGateway",
            state.network?.gateway || "--"
        );

        setText(
            "diagInternet",
            state.network?.internet
                ? "Connected"
                : "Not confirmed"
        );

        if (health.status === "healthy") {
            setText(
                "diagnosticStatus",
                "SYSTEM ONLINE"
            );
        }

    } catch (error) {
        console.warn(
            "Health check failed:",
            error
        );
    }
}


async function runDiagnostics() {
    if (state.isDiagnosing) return;

    state.isDiagnosing = true;

    const button = $("runDiagnosticsButton");

    if (button) {
        button.disabled = true;
        button.classList.add("loading");
        button.textContent = "Checking...";
    }

    try {
        const data = await apiGet(
            `${ILX.api}/diagnostics`
        );

        state.diagnostics = data;

        setText(
            "diagnosticStatus",
            data.status === "PASS"
                ? "SYSTEM HEALTHY"
                : "CHECK REQUIRED"
        );

        setText(
            "diagPython",
            data.python_version ||
            data.python ||
            "--"
        );

        setText(
            "diagInterface",
            data.network_interface ||
            data.interface ||
            "--"
        );

        setText(
            "diagGateway",
            data.default_gateway ||
            data.gateway ||
            "--"
        );

        setText(
            "diagInternet",
            data.internet ||
            "UNKNOWN"
        );

        setText(
            "diagnosticMessage",
            data.message ||
            "Diagnostics completed."
        );

        const icon = $("diagnosticStatusIcon");

        if (icon) {
            icon.textContent =
                data.status === "PASS"
                    ? "✓"
                    : "!";
        }

        showToast(
            "Diagnostics completed",
            data.message ||
                "Ukaguzi wa mfumo umekamilika.",
            data.status === "PASS"
                ? "success"
                : "warning"
        );

    } catch (error) {
        console.error(
            "Diagnostics failed:",
            error
        );

        setText(
            "diagnosticStatus",
            "DIAGNOSTICS FAILED"
        );

        setText(
            "diagnosticMessage",
            error.message
        );

        showToast(
            "Diagnostics error",
            error.message,
            "error"
        );

    } finally {
        state.isDiagnosing = false;

        if (button) {
            button.disabled = false;
            button.classList.remove("loading");
            button.textContent = "Run Full Diagnostics";
        }
    }
}


/* =========================================================
   SPEED TEST
   ========================================================= */

async function runSpeedTest() {
    if (state.isTestingSpeed) return;

    state.isTestingSpeed = true;

    const button = $("speedTestButton");

    if (button) {
        button.disabled = true;
        button.classList.add("loading");
        button.textContent = "Testing...";
    }

    try {
        setText(
            "speedServer",
            "Connecting..."
        );

        setText(
            "speedLatency",
            "--"
        );

        setText(
            "speedDownload",
            "N/A"
        );

        setText(
            "speedUpload",
            "N/A"
        );

        const result = await apiGet(
            `${ILX.api}/speed-test`
        );

        state.speedTest = result;

        setText(
            "speedServer",
            result.server || "N/A"
        );

        setText(
            "speedLatency",
            formatMilliseconds(result.latency_ms)
        );

        setText(
            "speedDownload",
            formatMbps(result.download_mbps)
        );

        setText(
            "speedUpload",
            formatMbps(result.upload_mbps)
        );

        setText(
            "speedTestResult",
            result.message ||
                result.status ||
                "Test completed."
        );

        showToast(
            "Connection test complete",
            result.message ||
                "Latency test completed.",
            result.internet
                ? "success"
                : "warning"
        );

    } catch (error) {
        console.error(
            "Speed test failed:",
            error
        );

        setText(
            "speedTestResult",
            error.message
        );

        showToast(
            "Speed test failed",
            error.message,
            "error"
        );

    } finally {
        state.isTestingSpeed = false;

        if (button) {
            button.disabled = false;
            button.classList.remove("loading");
            button.textContent = "Run Speed Test";
        }
    }
}


/* =========================================================
   APPLICATION HEALTH
   ========================================================= */

async function checkApplicationHealth() {
    try {
        const health = await apiGet("/health");

        const online =
            health.status === "healthy";

        setText(
            "systemStatus",
            online ? "ONLINE" : "DEGRADED"
        );

        setText(
            "footerVersion",
            `v${ILX.version} • Network Intelligence System`
        );

        return health;

    } catch (error) {
        console.error(
            "Application health check failed:",
            error
        );

        setText(
            "systemStatus",
            "API UNAVAILABLE"
        );

        return null;
    }
}


/* =========================================================
   DASHBOARD INITIALIZATION
   ========================================================= */

async function initializeDashboard() {
    await checkApplicationHealth();

    await Promise.allSettled([
        loadDevice(),
        loadWiFiInformation(),
        refreshNetwork(),
        loadDiagnosticsSummary()
    ]);
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function initializeButtons() {
    const refreshButton = $("refreshNetworkButton");

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            () => refreshNetwork({
                notify: true
            })
        );
    }

    const scanButton = $("scanNetworkButton");

    if (scanButton) {
        scanButton.addEventListener(
            "click",
            async () => {
                await refreshNetwork({
                    notify: false
                });

                showToast(
                    "Network scan complete",
                    "Taarifa za connection zimesasishwa.",
                    "success"
                );
            }
        );
    }

    const speedButton = $("speedTestButton");

    if (speedButton) {
        speedButton.addEventListener(
            "click",
            runSpeedTest
        );
    }

    const diagnosticsButton = $("runDiagnosticsButton");

    if (diagnosticsButton) {
        diagnosticsButton.addEventListener(
            "click",
            runDiagnostics
        );
    }
}


/* =========================================================
   AUTOMATIC REFRESH
   ========================================================= */

function startAutoRefresh() {
    if (state.refreshTimer) {
        clearInterval(state.refreshTimer);
    }

    state.refreshTimer = setInterval(() => {
        if (document.hidden) return;

        refreshNetwork();
    }, ILX.refreshInterval);
}


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

function initializeVisibilityHandler() {
    document.addEventListener(
        "visibilitychange",
        () => {
            if (!document.hidden && state.initialized) {
                refreshNetwork();
            }
        }
    );
}


/* =========================================================
   NETWORK ERROR DISPLAY
   ========================================================= */

window.addEventListener("offline", () => {
    setText("systemStatus", "OFFLINE");

    showToast(
        "Connection lost",
        "Kifaa hakijathibitisha muunganisho wa intaneti.",
        "warning"
    );
});


window.addEventListener("online", () => {
    showToast(
        "Connection restored",
        "Kifaa kimeripoti kuwa kimeunganishwa tena.",
        "success"
    );

    refreshNetwork();
});


/* =========================================================
   CLEANUP
   ========================================================= */

window.addEventListener("beforeunload", () => {
    if (state.refreshTimer) {
        clearInterval(state.refreshTimer);
    }
});


/* =========================================================
   APPLICATION START
   ========================================================= */

async function startIntelliLink() {
    if (state.initialized) return;

    state.initialized = true;

    initializeNavigation();

    initializeButtons();

    initializeVisibilityHandler();

    runSplashScreen();

    showPage("dashboard");

    startAutoRefresh();

    // Keep the splash visible for its animation.
    // API initialization continues without trapping the UI.
    initializeDashboard().catch(error => {
        console.error(
            "Dashboard initialization failed:",
            error
        );
    });
}


if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        startIntelliLink,
        { once: true }
    );
} else {
    startIntelliLink();
}


/* =========================================================
   DEBUG ACCESS
   ========================================================= */

window.IntelliLinkX1 = {
    state,
    refreshNetwork,
    loadDevice,
    runDiagnostics,
    runSpeedTest,
    showPage,
    checkApplicationHealth
};

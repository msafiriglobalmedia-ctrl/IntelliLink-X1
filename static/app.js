/* ============================================================
   INTELLILINK X1
   ============================================================
   Frontend Application Controller
   File: static/app.js

   Product:
       IntelliLink X1

   Developer:
       MSAFIRI GROUP

   Backend:
       FastAPI

   API:
       /health
       /api/v1
       /api/v1/device
       /api/v1/network
       /api/v1/wifi
       /api/v1/network/latency
       /api/v1/network/snapshot
       /api/v1/network/score
       /api/v1/diagnostics
       /api/v1/status
       /api/v1/speed-test

   IMPORTANT:
       This frontend never invents network measurements.
       Missing measurements are displayed as N/A.
   ============================================================ */

"use strict";

/* ============================================================
   CONFIGURATION
   ============================================================ */

const APP_CONFIG = {
    name: "IntelliLink X1",
    version: "0.1.0",

    apiBase: "/api/v1",

    requestTimeout: 15000,

    refreshInterval: 20000,

    healthInterval: 10000
};


/* ============================================================
   APPLICATION STATE
   ============================================================ */

const state = {
    initialized: false,

    loading: false,

    currentSection: "dashboard",

    health: null,

    device: null,

    network: null,

    wifi: null,

    snapshot: null,

    diagnostics: null,

    speedTest: null,

    lastUpdate: null,

    refreshTimer: null,

    healthTimer: null
};


/* ============================================================
   DOM HELPERS
   ============================================================ */

function $(id) {
    return document.getElementById(id);
}


function setText(id, value) {
    const element = $(id);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function setHTML(id, value) {
    const element = $(id);

    if (!element) {
        return;
    }

    element.innerHTML = value;
}


function showElement(id) {
    const element = $(id);

    if (!element) {
        return;
    }

    element.style.display = "";
}


function hideElement(id) {
    const element = $(id);

    if (!element) {
        return;
    }

    element.style.display = "none";
}


/* ============================================================
   VALUE FORMATTERS
   ============================================================ */

function isValidValue(value) {
    return (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== "null" &&
        value !== "undefined"
    );
}


function displayValue(value, fallback = "N/A") {
    return isValidValue(value) ? String(value) : fallback;
}


function formatNumber(value, decimals = 0) {
    if (!isValidValue(value)) {
        return "N/A";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "N/A";
    }

    return number.toFixed(decimals);
}


function formatMilliseconds(value) {
    if (!isValidValue(value)) {
        return "N/A";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "N/A";
    }

    return `${Math.round(number)} ms`;
}


function formatPercentage(value) {
    if (!isValidValue(value)) {
        return "N/A";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "N/A";
    }

    return `${Math.round(number)}%`;
}


function formatMbps(value) {
    if (!isValidValue(value)) {
        return "N/A";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "N/A";
    }

    return `${number.toFixed(2)} Mbps`;
}


function formatBytes(value) {
    if (!isValidValue(value)) {
        return "N/A";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "N/A";
    }

    if (number < 1024) {
        return `${number} B`;
    }

    if (number < 1024 * 1024) {
        return `${(number / 1024).toFixed(1)} KB`;
    }

    if (number < 1024 * 1024 * 1024) {
        return `${(number / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(number / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}


function formatDate(value) {
    if (!isValidValue(value)) {
        return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString();
}


/* ============================================================
   API REQUEST ENGINE
   ============================================================ */

async function apiRequest(
    path,
    options = {},
    timeout = APP_CONFIG.requestTimeout
) {
    const controller = new AbortController();

    const timer = setTimeout(() => {
        controller.abort();
    }, timeout);

    try {
        const response = await fetch(path, {
            ...options,

            headers: {
                "Accept": "application/json",

                ...(options.body
                    ? {
                        "Content-Type": "application/json"
                    }
                    : {}),

                ...(options.headers || {})
            },

            signal: controller.signal
        });

        const contentType =
            response.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();

            data = {
                message: text
            };
        }

        if (!response.ok) {
            const message =
                data?.detail ||
                data?.message ||
                `HTTP ${response.status}`;

            throw new Error(message);
        }

        return data;

    } catch (error) {

        if (error.name === "AbortError") {
            throw new Error("Request timed out");
        }

        throw error;

    } finally {
        clearTimeout(timer);
    }
}


/* ============================================================
   TOAST SYSTEM
   ============================================================ */

let toastTimer = null;


function showToast(title, message, type = "info") {
    const toast = $("toast");

    if (!toast) {
        return;
    }

    setText("toastTitle", title);
    setText("toastMessage", message);

    toast.classList.remove(
        "success",
        "error",
        "warning",
        "info",
        "show"
    );

    toast.classList.add(type);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}


/* ============================================================
   LOADING OVERLAY
   ============================================================ */

function showLoading(message = "Loading IntelliLink X1...") {
    const overlay = $("loadingOverlay");

    if (!overlay) {
        return;
    }

    setText("loadingMessage", message);

    overlay.classList.add("show");
}


function hideLoading() {
    const overlay = $("loadingOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("show");
}


/* ============================================================
   HEALTH
   ============================================================ */

async function loadHealth() {
    try {
        const data = await apiRequest("/health");

        state.health = data;

        updateHealthUI(data);

        return data;

    } catch (error) {

        updateOfflineState();

        console.warn(
            "IntelliLink health check failed:",
            error.message
        );

        return null;
    }
}


function updateHealthUI(data) {
    if (!data) {
        return;
    }

    const status =
        data.status ||
        data.state ||
        "healthy";

    const normalized = String(status).toLowerCase();

    const healthy =
        normalized === "ok" ||
        normalized === "healthy" ||
        normalized === "online" ||
        normalized === "running";

    const dot = $("connectionDot");

    if (dot) {
        dot.classList.toggle("online", healthy);
        dot.classList.toggle("offline", !healthy);
    }

    setText(
        "systemStatus",
        healthy ? "System Online" : "System Warning"
    );

    setText(
        "liveDot",
        healthy ? "LIVE" : "OFFLINE"
    );
}


function updateOfflineState() {
    setText("systemStatus", "Backend Offline");
    setText("liveDot", "OFFLINE");

    const dot = $("connectionDot");

    if (dot) {
        dot.classList.remove("online");
        dot.classList.add("offline");
    }
}


/* ============================================================
   DEVICE
   ============================================================ */

async function loadDevice() {
    try {
        const data = await apiRequest(
            `${APP_CONFIG.apiBase}/device`
        );

        state.device = data;

        updateDeviceUI(data);

        return data;

    } catch (error) {

        console.error(
            "Device information error:",
            error
        );

        showToast(
            "Device",
            "Unable to load device information.",
            "error"
        );

        return null;
    }
}


function updateDeviceUI(data) {
    if (!data) {
        return;
    }

    /*
     * Some APIs return:
     *
     * {
     *   "device": {...}
     * }
     *
     * while others return the device directly.
     */

    const device = data.device || data;

    setText(
        "deviceStatus",
        displayValue(
            device.status ||
            device.device_status ||
            "ACTIVE"
        )
    );

    setText(
        "modelNumber",
        displayValue(
            device.model_number ||
            device.model ||
            device.modelNumber
        )
    );

    setText(
        "serialNumber",
        displayValue(
            device.serial_number ||
            device.serialNumber
        )
    );

    setText(
        "deviceID",
        displayValue(
            device.device_id ||
            device.deviceID ||
            device.id
        )
    );

    setText(
        "deviceUUID",
        displayValue(
            device.device_uuid ||
            device.deviceUUID ||
            device.uuid
        )
    );

    setText(
        "smartCardNumber",
        displayValue(
            device.smart_card_number ||
            device.smartCardNumber ||
            device.smart_card_id
        )
    );

    setText(
        "hardwareRevision",
        displayValue(
            device.hardware_revision ||
            device.hardwareRevision
        )
    );

    setText(
        "firmwareVersion",
        displayValue(
            device.firmware_version ||
            device.firmwareVersion
        )
    );

    setText(
        "softwareVersion",
        displayValue(
            device.software_version ||
            device.softwareVersion ||
            APP_CONFIG.version
        )
    );

    setText(
        "manufacturer",
        displayValue(
            device.manufacturer
        )
    );

    setText(
        "countryCode",
        displayValue(
            device.country_code ||
            device.countryCode
        )
    );

    setText(
        "timezone",
        displayValue(
            device.timezone
        )
    );

    setText(
        "deviceType",
        displayValue(
            device.device_type ||
            device.deviceType
        )
    );

    setText(
        "platformSystem",
        displayValue(
            device.platform_system ||
            device.platformSystem ||
            device.system
        )
    );

    setText(
        "platformRelease",
        displayValue(
            device.platform_release ||
            device.platformRelease ||
            device.release
        )
    );

    setText(
        "platformArchitecture",
        displayValue(
            device.platform_architecture ||
            device.platformArchitecture ||
            device.architecture
        )
    );

    setText(
        "platformPython",
        displayValue(
            device.platform_python ||
            device.platformPython ||
            device.python_version
        )
    );
}


/* ============================================================
   NETWORK
   ============================================================ */

async function loadNetwork() {
    try {
        const data = await apiRequest(
            `${APP_CONFIG.apiBase}/network`
        );

        state.network = data;

        updateNetworkUI(data);

        return data;

    } catch (error) {

        console.error(
            "Network information error:",
            error
        );

        updateNetworkErrorUI();

        return null;
    }
}


function updateNetworkUI(data) {
    if (!data) {
        return;
    }

    const network = data.network || data;

    setText(
        "networkType",
        displayValue(
            network.type ||
            network.connection_type ||
            network.connectionType
        )
    );

    setText(
        "networkName",
        displayValue(
            network.name ||
            network.ssid ||
            network.network_name ||
            network.networkName
        )
    );

    setText(
        "networkIP",
        displayValue(
            network.local_ip ||
            network.ip ||
            network.ip_address ||
            network.ipAddress
        )
    );

    setText(
        "networkGateway",
        displayValue(
            network.gateway ||
            network.default_gateway ||
            network.defaultGateway
        )
    );

    setText(
        "networkInterface",
        displayValue(
            network.interface ||
            network.interface_name ||
            network.interfaceName ||
            network.network_interface
        )
    );

    setText(
        "networkConnectionStatus",
        displayValue(
            network.status ||
            network.connection_status ||
            network.connectionStatus
        )
    );

    const connectionType =
        network.type ||
        network.connection_type ||
        network.connectionType;

    const ssid =
        network.ssid ||
        network.name ||
        network.network_name;

    setText(
        "connectionType",
        displayValue(connectionType)
    );

    setText(
        "wifiSSID",
        displayValue(ssid)
    );

    setText(
        "ipAddress",
        displayValue(
            network.local_ip ||
            network.ip ||
            network.ip_address
        )
    );
}


function updateNetworkErrorUI() {
    setText("networkConnectionStatus", "Unavailable");
    setText("connectionType", "N/A");
    setText("wifiSSID", "N/A");
    setText("ipAddress", "N/A");
}


/* ============================================================
   WI-FI
   ============================================================ */

async function loadWifi() {
    try {
        const data = await apiRequest(
            `${APP_CONFIG.apiBase}/wifi`
        );

        state.wifi = data;

        updateWifiUI(data);

        return data;

    } catch (error) {

        console.warn(
            "Wi-Fi information unavailable:",
            error.message
        );

        updateWifiErrorUI();

        return null;
    }
}


function updateWifiUI(data) {
    if (!data) {
        return;
    }

    const wifi = data.wifi || data;

    const available =
        wifi.available ??
        wifi.is_available ??
        wifi.connected ??
        null;

    const ssid =
        wifi.ssid ||
        wifi.name ||
        wifi.network_name ||
        null;

    setText(
        "wifiSSID",
        displayValue(ssid)
    );

    if (available === true) {
        setText("wifiStatus", "Connected");
    } else if (available === false) {
        setText("wifiStatus", "Unavailable");
    } else {
        setText(
            "wifiStatus",
            displayValue(
                wifi.status,
                "N/A"
            )
        );
    }

    const signal =
        wifi.signal ||
        wifi.signal_strength ||
        wifi.signalStrength ||
        wifi.rssi ||
        null;

    setText(
        "signalValue",
        isValidValue(signal)
            ? `${signal}`
            : "N/A"
    );
}


function updateWifiErrorUI() {
    setText("wifiSSID", "N/A");
    setText("wifiStatus", "Unavailable");
    setText("signalValue", "N/A");
}


/* ============================================================
   NETWORK SNAPSHOT
   ============================================================ */

async function loadNetworkSnapshot() {
    try {
        const data = await apiRequest(
            `${APP_CONFIG.apiBase}/network/snapshot`,
            {},
            20000
        );

        state.snapshot = data;

        updateSnapshotUI(data);

        return data;

    } catch (error) {

        console.error(
            "Network snapshot error:",
            error
        );

        showToast(
            "Network",
            "Unable to collect network snapshot.",
            "warning"
        );

        return null;
    }
}


function updateSnapshotUI(data) {
    if (!data) {
        return;
    }

    /*
     * Snapshot can be nested or direct.
     */

    const snapshot =
        data.snapshot ||
        data;

    const latency =
        snapshot.latency_ms ??
        snapshot.latency ??
        data.latency_ms ??
        data.latency;

    const jitter =
        snapshot.jitter_ms ??
        snapshot.jitter ??
        data.jitter_ms ??
        data.jitter;

    const packetLoss =
        snapshot.packet_loss ??
        snapshot.packet_loss_percent ??
        snapshot.packetLoss ??
        data.packet_loss ??
        data.packet_loss_percent;

    const signal =
        snapshot.signal ??
        snapshot.signal_strength ??
        snapshot.rssi ??
        data.signal ??
        data.signal_strength;

    const download =
        snapshot.download_mbps ??
        snapshot.download_speed ??
        snapshot.download ??
        data.download_mbps;

    const upload =
        snapshot.upload_mbps ??
        snapshot.upload_speed ??
        snapshot.upload ??
        data.upload_mbps;

    setText(
        "latencyValue",
        formatMilliseconds(latency)
    );

    setText(
        "jitterValue",
        formatMilliseconds(jitter)
    );

    setText(
        "packetLossValue",
        formatPercentage(packetLoss)
    );

    setText(
        "signalValue",
        displayValue(signal)
    );

    setText(
        "downloadSpeed",
        formatMbps(download)
    );

    setText(
        "uploadSpeed",
        formatMbps(upload)
    );
}


/* ============================================================
   NETWORK SCORE
   ============================================================ */

async function loadNetworkScore() {
    try {
        const data = await apiRequest(
            `${APP_CONFIG.apiBase}/network/score`
        );

        updateNetworkScoreUI(data);

        return data;

    } catch (error) {

        console.warn(
            "Network score unavailable:",
            error.message
        );

        return null;
    }
}


function extractScore(data) {
    if (!data) {
        return null;
    }

    return (
        data.score ??
        data.network_score ??
        data.networkScore ??
        data.total_score ??
        data.value ??
        data.result?.score ??
        null
    );
}


function getQualityFromScore(score) {
    if (!Number.isFinite(score)) {
        return "UNKNOWN";
    }

    if (score >= 90) {
        return "EXCELLENT";
    }

    if (score >= 75) {
        return "GOOD";
    }

    if (score >= 50) {
        return "FAIR";
    }

    if (score >= 25) {
        return "POOR";
    }

    return "CRITICAL";
}


function updateNetworkScoreUI(data) {
    const rawScore = extractScore(data);

    if (!isValidValue(rawScore)) {
        setText("networkScore", "N/A");
        setText("networkQuality", "UNKNOWN");

        const bar = $("scoreBar");

        if (bar) {
            bar.style.width = "0%";
        }

        return;
    }

    const score = Number(rawScore);

    if (!Number.isFinite(score)) {
        setText("networkScore", "N/A");
        return;
    }

    const safeScore = Math.max(
        0,
        Math.min(100, score)
    );

    const quality =
        data.quality ||
        data.network_quality ||
        getQualityFromScore(safeScore);

    setText(
        "networkScore",
        Math.round(safeScore)
    );

    setText(
        "networkQuality",
        String(quality).toUpperCase()
    );

    const bar = $("scoreBar");

    if (bar) {
        bar.style.width = `${safeScore}%`;
    }

    setText(
        "scoreDescription",
        getScoreDescription(safeScore)
    );

    updateIntelligenceFromScore(
        safeScore,
        data
    );
}


function getScoreDescription(score) {
    if (score >= 90) {
        return "Network performance is excellent.";
    }

    if (score >= 75) {
        return "Network performance is good.";
    }

    if (score >= 50) {
        return "Network performance is acceptable.";
    }

    if (score >= 25) {
        return "Network performance is poor.";
    }

    return "Network performance requires attention.";
}


/* ============================================================
   INTELLIGENCE ENGINE
   ============================================================ */

function updateIntelligenceFromScore(score, data = {}) {
    let priority = "NORMAL";
    let action = "Monitor network";
    let message = "IntelliLink is monitoring the connection.";

    if (score >= 90) {
        priority = "LOW";
        action = "Maintain connection";
        message =
            "Current network conditions are strong. No immediate action is required.";

    } else if (score >= 75) {
        priority = "NORMAL";
        action = "Optimize if needed";
        message =
            "Connection is stable. IntelliLink recommends continued monitoring.";

    } else if (score >= 50) {
        priority = "MEDIUM";
        action = "Monitor performance";
        message =
            "Network quality is moderate. IntelliLink is watching for degradation.";

    } else if (score >= 25) {
        priority = "HIGH";
        action = "Consider network switch";
        message =
            "Network quality is poor. A better available connection may be preferable.";

    } else {
        priority = "CRITICAL";
        action = "Check connectivity";
        message =
            "Network conditions are critical. Connectivity diagnostics are recommended.";
    }

    /*
     * If backend provides an intelligence recommendation,
     * use it instead of replacing it with frontend assumptions.
     */

    const intelligence =
        data.intelligence ||
        data.recommendation ||
        data.recommendation_data ||
        null;

    if (intelligence) {

        priority =
            intelligence.priority ||
            intelligence.level ||
            priority;

        action =
            intelligence.action ||
            intelligence.recommended_action ||
            intelligence.recommendation ||
            action;

        message =
            intelligence.message ||
            intelligence.reason ||
            message;
    }

    setText(
        "intelligencePriority",
        displayValue(priority)
    );

    setText(
        "intelligenceAction",
        displayValue(action)
    );

    setText(
        "intelligenceMessage",
        displayValue(message)
    );
}


/* ============================================================
   DIAGNOSTICS
   ============================================================ */

async function loadDiagnostics() {
    try {
        const data = await apiRequest(
            `${APP_CONFIG.apiBase}/diagnostics`,
            {},
            20000
        );

        state.diagnostics = data;

        updateDiagnosticsUI(data);

        return data;

    } catch (error) {

        console.error(
            "Diagnostics error:",
            error
        );

        updateDiagnosticsErrorUI();

        return null;
    }
}


function updateDiagnosticsUI(data) {
    if (!data) {
        return;
    }

    const diagnostics =
        data.diagnostics ||
        data;

    const status =
        diagnostics.status ||
        diagnostics.overall_status ||
        diagnostics.result ||
        "UNKNOWN";

    setText(
        "diagnosticStatus",
        String(status).toUpperCase()
    );

    setText(
        "diagPython",
        formatDiagnosticValue(
            diagnostics.python ||
            diagnostics.python_version ||
            diagnostics.runtime
        )
    );

    setText(
        "diagInterface",
        formatDiagnosticValue(
            diagnostics.interface ||
            diagnostics.network_interface
        )
    );

    setText(
        "diagGateway",
        formatDiagnosticValue(
            diagnostics.gateway ||
            diagnostics.default_gateway
        )
    );

    setText(
        "diagInternet",
        formatDiagnosticValue(
            diagnostics.internet ||
            diagnostics.internet_status ||
            diagnostics.internet_connection
        )
    );

    const icon = $("diagnosticStatusIcon");

    if (icon) {

        const normalized =
            String(status).toLowerCase();

        icon.classList.remove(
            "success",
            "warning",
            "error"
        );

        if (
            normalized.includes("ok") ||
            normalized.includes("healthy") ||
            normalized.includes("pass") ||
            normalized.includes("success")
        ) {
            icon.classList.add("success");

        } else if (
            normalized.includes("warn")
        ) {
            icon.classList.add("warning");

        } else {
            icon.classList.add("error");
        }
    }

    setText(
        "diagnosticMessage",
        displayValue(
            diagnostics.message ||
            diagnostics.summary ||
            diagnostics.description,
            "Diagnostics completed."
        )
    );
}


function formatDiagnosticValue(value) {
    if (!isValidValue(value)) {
        return "N/A";
    }

    if (typeof value === "boolean") {
        return value ? "PASS" : "FAIL";
    }

    return String(value);
}


function updateDiagnosticsErrorUI() {
    setText("diagnosticStatus", "ERROR");
    setText("diagPython", "N/A");
    setText("diagInterface", "N/A");
    setText("diagGateway", "N/A");
    setText("diagInternet", "N/A");
    setText(
        "diagnosticMessage",
        "Diagnostics service is unavailable."
    );

    const icon = $("diagnosticStatusIcon");

    if (icon) {
        icon.classList.remove(
            "success",
            "warning"
        );

        icon.classList.add("error");
    }
}


/* ============================================================
   SPEED TEST
   ============================================================ */

async function runSpeedTest() {
    const button = $("speedTestButton");

    if (button) {
        button.disabled = true;
        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Testing...";
    }

    setText(
        "speedTestResult",
        "Running connection benchmark..."
    );

    setText(
        "speedServer",
        "N/A"
    );

    setText(
        "speedLatency",
        "N/A"
    );

    setText(
        "speedDownload",
        "N/A"
    );

    setText(
        "speedUpload",
        "N/A"
    );

    try {

        const data = await apiRequest(
            `${APP_CONFIG.apiBase}/speed-test`,
            {
                method: "GET"
            },
            30000
        );

        state.speedTest = data;

        updateSpeedTestUI(data);

        showToast(
            "Speed Test",
            "Network benchmark completed.",
            "success"
        );

        return data;

    } catch (error) {

        console.error(
            "Speed test error:",
            error
        );

        setText(
            "speedTestResult",
            "Test failed"
        );

        showToast(
            "Speed Test",
            error.message ||
            "Unable to complete speed test.",
            "error"
        );

        return null;

    } finally {

        if (button) {
            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                "Run Speed Test";
        }
    }
}


function updateSpeedTestUI(data) {
    if (!data) {
        return;
    }

    const result =
        data.result ||
        data.speed_test ||
        data;

    setText(
        "speedTestResult",
        displayValue(
            result.status ||
            result.message ||
            "Completed"
        )
    );

    setText(
        "speedServer",
        displayValue(
            result.server ||
            result.host ||
            result.target
        )
    );

    setText(
        "speedLatency",
        formatMilliseconds(
            result.latency_ms ??
            result.latency
        )
    );

    setText(
        "speedDownload",
        formatMbps(
            result.download_mbps ??
            result.download_speed ??
            result.download
        )
    );

    setText(
        "speedUpload",
        formatMbps(
            result.upload_mbps ??
            result.upload_speed ??
            result.upload
        )
    );
}


/* ============================================================
   FULL DASHBOARD REFRESH
   ============================================================ */

async function refreshDashboard(options = {}) {
    const showOverlay =
        options.showOverlay === true;

    if (state.loading) {
        return;
    }

    state.loading = true;

    if (showOverlay) {
        showLoading(
            options.message ||
            "Refreshing IntelliLink X1..."
        );
    }

    try {

        /*
         * Health first.
         */

        await loadHealth();

        /*
         * These requests are independent,
         * so execute them together.
         */

        await Promise.allSettled([
            loadDevice(),
            loadNetwork(),
            loadWifi(),
            loadNetworkSnapshot(),
            loadNetworkScore()
        ]);

        state.lastUpdate = new Date();

        updateLastRefreshTime();

    } catch (error) {

        console.error(
            "Dashboard refresh failed:",
            error
        );

    } finally {

        state.loading = false;

        if (showOverlay) {
            hideLoading();
        }
    }
}


/* ============================================================
   LAST UPDATE
   ============================================================ */

function updateLastRefreshTime() {
    if (!state.lastUpdate) {
        return;
    }

    /*
     * The current index.html may not have a dedicated
     * last-update element. This function safely does nothing
     * if it is not present.
     */

    setText(
        "lastUpdate",
        state.lastUpdate.toLocaleTimeString()
    );
}


/* ============================================================
   SECTION NAVIGATION
   ============================================================ */

function initializeNavigation() {

    const navigation =
        document.querySelectorAll(
            "[data-section]"
        );

    navigation.forEach(item => {

        item.addEventListener(
            "click",
            event => {

                event.preventDefault();

                const section =
                    item.dataset.section;

                if (!section) {
                    return;
                }

                switchSection(section);
            }
        );
    });
}


function switchSection(sectionName) {

    state.currentSection =
        sectionName;

    /*
     * Support common section selectors.
     */

    const sections =
        document.querySelectorAll(
            "[data-page-section], .page-section, section[id]"
        );

    sections.forEach(section => {

        const sectionId =
            section.dataset.pageSection ||
            section.id;

        if (!sectionId) {
            return;
        }

        const isActive =
            sectionId === sectionName;

        section.classList.toggle(
            "active",
            isActive
        );
    });

    /*
     * Navigation active state.
     */

    const navigation =
        document.querySelectorAll(
            "[data-section]"
        );

    navigation.forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.section === sectionName
        );
    });

    /*
     * Load diagnostics only when needed.
     */

    if (
        sectionName === "diagnostics" &&
        !state.diagnostics
    ) {
        loadDiagnostics();
    }
}


/* ============================================================
   BUTTON EVENTS
   ============================================================ */

function initializeButtons() {

    const refreshButton =
        $("refreshNetworkButton");

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                await refreshDashboard({
                    showOverlay: true,
                    message:
                        "Refreshing network information..."
                });

                showToast(
                    "Network",
                    "Network information refreshed.",
                    "success"
                );
            }
        );
    }


    const scanButton =
        $("scanNetworkButton");

    if (scanButton) {

        scanButton.addEventListener(
            "click",
            async () => {

                scanButton.disabled = true;

                const original =
                    scanButton.textContent;

                scanButton.textContent =
                    "Scanning...";

                try {

                    await loadNetworkSnapshot();
                    await loadNetworkScore();

                    showToast(
                        "Network Scan",
                        "Network scan completed.",
                        "success"
                    );

                } catch (error) {

                    showToast(
                        "Network Scan",
                        "Network scan failed.",
                        "error"
                    );

                } finally {

                    scanButton.disabled = false;

                    scanButton.textContent =
                        original;
                }
            }
        );
    }


    const speedButton =
        $("speedTestButton");

    if (speedButton) {

        speedButton.addEventListener(
            "click",
            runSpeedTest
        );
    }


    const diagnosticsButton =
        $("runDiagnosticsButton");

    if (diagnosticsButton) {

        diagnosticsButton.addEventListener(
            "click",
            async () => {

                diagnosticsButton.disabled =
                    true;

                const original =
                    diagnosticsButton.textContent;

                diagnosticsButton.textContent =
                    "Running...";

                try {

                    await loadDiagnostics();

                    showToast(
                        "Diagnostics",
                        "System diagnostics completed.",
                        "success"
                    );

                } catch (error) {

                    showToast(
                        "Diagnostics",
                        "Diagnostics failed.",
                        "error"
                    );

                } finally {

                    diagnosticsButton.disabled =
                        false;

                    diagnosticsButton.textContent =
                        original;
                }
            }
        );
    }
}


/* ============================================================
   KEYBOARD SHORTCUTS
   ============================================================ */

function initializeKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            /*
             * Ctrl/Cmd + R is intentionally not intercepted.
             *
             * Ctrl/Cmd + Shift + R:
             * manual application refresh.
             */

            if (
                event.ctrlKey &&
                event.shiftKey &&
                event.key.toLowerCase() === "r"
            ) {

                event.preventDefault();

                refreshDashboard({
                    showOverlay: true,
                    message:
                        "Refreshing IntelliLink X1..."
                });
            }
        }
    );
}


/* ============================================================
   AUTOMATIC REFRESH
   ============================================================ */

function startAutomaticRefresh() {

    stopAutomaticRefresh();

    state.refreshTimer =
        setInterval(
            () => {

                /*
                 * Don't interrupt an existing operation.
                 */

                if (
                    !state.loading
                ) {
                    refreshDashboard({
                        showOverlay: false
                    });
                }

            },
            APP_CONFIG.refreshInterval
        );
}


function stopAutomaticRefresh() {

    if (state.refreshTimer) {

        clearInterval(
            state.refreshTimer
        );

        state.refreshTimer = null;
    }
}


/* ============================================================
   HEALTH MONITOR
   ============================================================ */

function startHealthMonitor() {

    stopHealthMonitor();

    state.healthTimer =
        setInterval(
            () => {
                loadHealth();
            },
            APP_CONFIG.healthInterval
        );
}


function stopHealthMonitor() {

    if (state.healthTimer) {

        clearInterval(
            state.healthTimer
        );

        state.healthTimer = null;
    }
}


/* ============================================================
   BROWSER ONLINE / OFFLINE
   ============================================================ */

function initializeBrowserNetworkEvents() {

    window.addEventListener(
        "online",
        () => {

            showToast(
                "Connection",
                "Browser network connection restored.",
                "success"
            );

            loadHealth();
        }
    );


    window.addEventListener(
        "offline",
        () => {

            showToast(
                "Connection",
                "Browser appears to be offline.",
                "warning"
            );

            updateOfflineState();
        }
    );
}


/* ============================================================
   VISIBILITY CONTROL
   ============================================================ */

function initializeVisibilityEvents() {

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.hidden
            ) {

                stopAutomaticRefresh();
                stopHealthMonitor();

            } else {

                loadHealth();

                startAutomaticRefresh();
                startHealthMonitor();
            }
        }
    );
}


/* ============================================================
   API INFORMATION
   ============================================================ */

async function loadApiInformation() {

    try {

        const data =
            await apiRequest(
                `${APP_CONFIG.apiBase}`
            );

        /*
         * If footerVersion exists,
         * prefer backend version when available.
         */

        const version =
            data.version ||
            data.app_version ||
            data.api_version;

        if (version) {

            setText(
                "footerVersion",
                `v${version}`
            );
        }

        return data;

    } catch (error) {

        /*
         * API metadata is optional.
         */

        console.warn(
            "API information unavailable:",
            error.message
        );

        return null;
    }
}


/* ============================================================
   INITIAL UI STATE
   ============================================================ */

function initializeDefaultUI() {

    setText(
        "networkScore",
        "N/A"
    );

    setText(
        "networkQuality",
        "UNKNOWN"
    );

    setText(
        "latencyValue",
        "N/A"
    );

    setText(
        "jitterValue",
        "N/A"
    );

    setText(
        "packetLossValue",
        "N/A"
    );

    setText(
        "signalValue",
        "N/A"
    );

    setText(
        "downloadSpeed",
        "N/A"
    );

    setText(
        "uploadSpeed",
        "N/A"
    );

    setText(
        "wifiSSID",
        "N/A"
    );

    setText(
        "wifiStatus",
        "N/A"
    );

    setText(
        "connectionType",
        "N/A"
    );
}


/* ============================================================
   ERROR HANDLING
   ============================================================ */

window.addEventListener(
    "error",
    event => {

        console.error(
            "IntelliLink frontend error:",
            event.error || event.message
        );
    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "IntelliLink unhandled promise rejection:",
            event.reason
        );
    }
);


/* ============================================================
   APPLICATION STARTUP
   ============================================================ */

async function initializeApp() {

    if (state.initialized) {
        return;
    }

    state.initialized = true;

    console.log(
        `%c${APP_CONFIG.name}`,
        "font-weight:bold;font-size:18px;"
    );

    console.log(
        `Version: ${APP_CONFIG.version}`
    );

    console.log(
        "IntelliLink X1 frontend initializing..."
    );

    initializeDefaultUI();

    initializeNavigation();

    initializeButtons();

    initializeKeyboardShortcuts();

    initializeBrowserNetworkEvents();

    initializeVisibilityEvents();

    /*
     * Initial health check.
     */

    await loadHealth();

    /*
     * Load API metadata without blocking
     * the main dashboard.
     */

    loadApiInformation();

    /*
     * Initial dashboard data.
     */

    await refreshDashboard({
        showOverlay: true,
        message: "Initializing IntelliLink X1..."
    });

    /*
     * Background monitoring.
     */

    startAutomaticRefresh();

    startHealthMonitor();

    console.log(
        "IntelliLink X1 frontend ready."
    );
}


/* ============================================================
   DOM READY
   ============================================================ */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp,
        {
            once: true
        }
    );

} else {

    initializeApp();
}


/* ============================================================
   PUBLIC DEBUG API
   ============================================================ */

/*
 * Useful during development from browser console:
 *
 *   IntelliLink.refresh()
 *   IntelliLink.network()
 *   IntelliLink.device()
 *   IntelliLink.diagnostics()
 *   IntelliLink.speedTest()
 *
 */

window.IntelliLink = {

    refresh: () =>
        refreshDashboard({
            showOverlay: true
        }),

    network: loadNetwork,

    wifi: loadWifi,

    device: loadDevice,

    diagnostics: loadDiagnostics,

    speedTest: runSpeedTest,

    health: loadHealth,

    snapshot: loadNetworkSnapshot,

    score: loadNetworkScore,

    state: () => ({
        ...state
    })
};

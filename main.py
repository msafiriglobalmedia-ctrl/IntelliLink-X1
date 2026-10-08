"""
============================================================
INTELLILINK X1
AI-POWERED PREDICTIVE MULTI-CONNECTIVITY NETWORK SYSTEM
============================================================

Product:
    IntelliLink X1

Model:
    ILX1-WF01

Product Family:
    IntelliLink X-Series

Version:
    V0.1.0

Architecture:
    FastAPI + SQLite + HTML/CSS/JavaScript

Primary Functions:
    - Device identity
    - Network monitoring
    - Connectivity diagnostics
    - Internet health monitoring
    - Latency measurement
    - Packet-loss estimation
    - Network quality scoring
    - Speed-test framework
    - Network intelligence
    - REST API
    - System health monitoring

Prepared for:
    IntelliLink X1 Prototype

============================================================
IMPORTANT
============================================================
This software is a prototype network-management system.

It does NOT manufacture real:
    - IMEI
    - IMSI
    - ICCID
    - MAC addresses
    - carrier identities

Prototype identifiers are generated only for application
identification. Real hardware identifiers must come from
the actual hardware when hardware is connected.

============================================================
"""

from __future__ import annotations

import asyncio
import json
import os
import platform
import socket
import statistics
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles


# ============================================================
# APPLICATION CONSTANTS
# ============================================================

APP_NAME = "IntelliLink X1"
APP_VERSION = "0.1.0"
API_VERSION = "v1"

PRODUCT_FAMILY = "IntelliLink X-Series"
MODEL_NUMBER = "ILX1-WF01"
HARDWARE_REVISION = "ILX1-HW-R1.0"
FIRMWARE_VERSION = "ILX1-FW-1.0.0"

MANUFACTURER = "IntelliLink Systems"
DEVELOPER = "MSAFIRI GROUP"

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
INDEX_FILE = BASE_DIR / "index.html"

# Prototype application identifiers.
# These are NOT real SIM/IMEI/telecom identifiers.
DEVICE_UUID = str(uuid.uuid4())

DEVICE_ID = "ILX1-TZ-000001"
SMART_CARD_ID = "ILX1-SCC-DEMO-000001"
NETWORK_INTERFACE_ID = "ILX1-NIC-000001"
WIFI_PROFILE_ID = "ILX1-WIFI-000001"

SERIAL_NUMBER = "ILX1-SN-260001"
PRODUCT_KEY = "ILX1-PK-DEMO-000001"
SECURITY_MODULE_ID = "ILX1-SEC-000001"

START_TIME = time.time()


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=APP_NAME,
    description=(
        "AI-powered predictive multi-connectivity network "
        "management system for intelligent network monitoring, "
        "performance analysis and adaptive connectivity."
    ),
    version=APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# STATIC FILES
# ============================================================

if STATIC_DIR.exists():
    app.mount(
        "/static",
        StaticFiles(directory=str(STATIC_DIR)),
        name="static",
    )


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def utc_now() -> str:
    """Return current UTC timestamp in ISO-8601 format."""
    return datetime.now(timezone.utc).isoformat()


def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely convert a value to float."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    """Keep a numeric value inside a specified range."""
    return max(minimum, min(value, maximum))


def run_command(
    command: List[str],
    timeout: float = 3.0,
) -> Optional[str]:
    """
    Execute a system command safely.

    Android/Pydroid may not expose many Linux commands,
    therefore failures are intentionally handled.
    """
    try:
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=timeout,
            check=False,
        )

        if result.returncode == 0:
            return result.stdout.strip()

    except (
        FileNotFoundError,
        subprocess.SubprocessError,
        OSError,
        ValueError,
    ):
        pass

    return None


# ============================================================
# DEVICE INFORMATION
# ============================================================

def get_device_platform() -> Dict[str, Any]:
    """Collect safe platform information."""

    return {
        "system": platform.system(),
        "release": platform.release(),
        "version": platform.version(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "python_version": platform.python_version(),
        "architecture": platform.architecture()[0],
    }


def get_hostname() -> str:
    """Return host/device hostname safely."""

    try:
        return socket.gethostname()
    except Exception:
        return "UNKNOWN"


def get_local_ip() -> str:
    """
    Determine local network IP.

    No data is transmitted. A UDP socket is used only to
    determine the preferred local interface.
    """

    sock = socket.socket(
        socket.AF_INET,
        socket.SOCK_DGRAM,
    )

    try:
        sock.settimeout(1.0)

        # No actual payload is sent.
        sock.connect(("8.8.8.8", 80))

        return sock.getsockname()[0]

    except Exception:
        return "127.0.0.1"

    finally:
        sock.close()


def get_default_gateway() -> Optional[str]:
    """
    Attempt to discover the default gateway.

    Works on many Linux systems and gracefully falls back
    when Android does not expose routing information.
    """

    route_file = Path("/proc/net/route")

    try:
        if route_file.exists():
            lines = route_file.read_text(
                encoding="utf-8",
                errors="ignore",
            ).splitlines()

            for line in lines[1:]:
                parts = line.split()

                if len(parts) < 3:
                    continue

                interface = parts[0]
                destination = parts[1]
                gateway_hex = parts[2]

                if destination == "00000000":
                    try:
                        gateway_int = int(gateway_hex, 16)

                        gateway = socket.inet_ntoa(
                            gateway_int.to_bytes(
                                4,
                                byteorder="little",
                            )
                        )

                        if gateway:
                            return gateway

                    except Exception:
                        continue

    except Exception:
        pass

    return None


def get_network_interface() -> Dict[str, Any]:
    """Return basic network-interface information."""

    local_ip = get_local_ip()
    gateway = get_default_gateway()

    return {
        "interface_id": NETWORK_INTERFACE_ID,
        "local_ip": local_ip,
        "gateway": gateway,
        "hostname": get_hostname(),
        "interface_status": (
            "CONNECTED"
            if local_ip not in ("127.0.0.1", "0.0.0.0")
            else "DISCONNECTED"
        ),
    }


# ============================================================
# WI-FI INFORMATION
# ============================================================

def get_wifi_information() -> Dict[str, Any]:
    """
    Attempt to collect Wi-Fi information.

    Android applications may not expose SSID/BSSID without
    platform permissions. Therefore unavailable values are
    reported honestly rather than fabricated.
    """

    ssid = None
    bssid = None
    signal = None
    frequency = None
    channel = None
    security = None

    # Linux/Android wireless information.
    iw_output = run_command(
        ["iw", "dev"],
        timeout=2.0,
    )

    if iw_output:
        for line in iw_output.splitlines():
            line = line.strip()

            if line.startswith("ssid "):
                ssid = line[5:].strip()

    return {
        "profile_id": WIFI_PROFILE_ID,
        "technology": "Wi-Fi",
        "ssid": ssid or "UNAVAILABLE",
        "bssid": bssid or "UNAVAILABLE",
        "signal_dbm": signal,
        "frequency_mhz": frequency,
        "channel": channel,
        "security": security or "UNKNOWN",
        "status": "CONNECTED"
        if get_local_ip() != "127.0.0.1"
        else "DISCONNECTED",
    }


# ============================================================
# INTERNET CONNECTIVITY
# ============================================================

def check_host(
    host: str,
    port: int = 443,
    timeout: float = 2.0,
) -> Tuple[bool, Optional[float]]:
    """
    Test TCP connectivity to a host.

    Returns:
        (success, latency_ms)
    """

    start = time.perf_counter()

    try:
        with socket.create_connection(
            (host, port),
            timeout=timeout,
        ):
            latency = (
                time.perf_counter() - start
            ) * 1000.0

            return True, round(latency, 2)

    except OSError:
        return False, None


def internet_status() -> Dict[str, Any]:
    """
    Perform lightweight internet connectivity tests.
    """

    targets = [
        ("cloudflare.com", 443),
        ("google.com", 443),
        ("example.com", 443),
    ]

    results = []

    for host, port in targets:
        success, latency = check_host(
            host,
            port,
        )

        results.append(
            {
                "host": host,
                "port": port,
                "reachable": success,
                "latency_ms": latency,
            }
        )

    reachable = [
        item
        for item in results
        if item["reachable"]
    ]

    latencies = [
        item["latency_ms"]
        for item in reachable
        if item["latency_ms"] is not None
    ]

    average_latency = (
        round(statistics.mean(latencies), 2)
        if latencies
        else None
    )

    return {
        "connected": bool(reachable),
        "average_latency_ms": average_latency,
        "targets": results,
        "checked_at": utc_now(),
    }


# ============================================================
# LATENCY MONITORING
# ============================================================

def measure_latency(
    host: str = "cloudflare.com",
    port: int = 443,
    attempts: int = 4,
) -> Dict[str, Any]:
    """
    Measure TCP connection latency.

    This is intentionally conservative and does not perform
    an ICMP ping requiring elevated/system-specific access.
    """

    attempts = int(
        clamp(
            safe_float(attempts, 4),
            1,
            10,
        )
    )

    measurements: List[float] = []

    for _ in range(attempts):
        success, latency = check_host(
            host,
            port,
            timeout=3.0,
        )

        if success and latency is not None:
            measurements.append(latency)

    if not measurements:
        return {
            "host": host,
            "port": port,
            "attempts": attempts,
            "successful": 0,
            "failed": attempts,
            "latency_ms": None,
            "minimum_ms": None,
            "maximum_ms": None,
            "jitter_ms": None,
            "packet_loss_percent": 100.0,
            "status": "UNREACHABLE",
            "timestamp": utc_now(),
        }

    minimum = min(measurements)
    maximum = max(measurements)

    if len(measurements) > 1:
        differences = [
            abs(
                measurements[index]
                - measurements[index - 1]
            )
            for index in range(
                1,
                len(measurements),
            )
        ]

        jitter = statistics.mean(differences)

    else:
        jitter = 0.0

    successful = len(measurements)

    packet_loss = (
        (attempts - successful)
        / attempts
    ) * 100.0

    return {
        "host": host,
        "port": port,
        "attempts": attempts,
        "successful": successful,
        "failed": attempts - successful,
        "latency_ms": round(
            statistics.mean(measurements),
            2,
        ),
        "minimum_ms": round(minimum, 2),
        "maximum_ms": round(maximum, 2),
        "jitter_ms": round(jitter, 2),
        "packet_loss_percent": round(
            packet_loss,
            2,
        ),
        "status": "GOOD",
        "timestamp": utc_now(),
    }


# ============================================================
# NETWORK QUALITY ENGINE
# ============================================================

def calculate_network_score(
    latency_ms: Optional[float],
    jitter_ms: Optional[float],
    packet_loss_percent: Optional[float],
    signal_dbm: Optional[float] = None,
    download_mbps: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Calculate an IntelliLink network-quality score.

    Score range:
        0 - 100

    This is an engineering prototype score, not a telecom
    certification or carrier-grade KPI.
    """

    score = 100.0

    # --------------------------------------------------------
    # Latency
    # --------------------------------------------------------

    if latency_ms is None:
        score -= 35

    elif latency_ms <= 20:
        score -= 0

    elif latency_ms <= 50:
        score -= 5

    elif latency_ms <= 100:
        score -= 12

    elif latency_ms <= 200:
        score -= 25

    elif latency_ms <= 400:
        score -= 40

    else:
        score -= 55

    # --------------------------------------------------------
    # Jitter
    # --------------------------------------------------------

    jitter = safe_float(
        jitter_ms,
        default=0.0,
    )

    if jitter <= 5:
        score -= 0

    elif jitter <= 15:
        score -= 5

    elif jitter <= 30:
        score -= 12

    elif jitter <= 60:
        score -= 20

    else:
        score -= 30

    # --------------------------------------------------------
    # Packet Loss
    # --------------------------------------------------------

    loss = safe_float(
        packet_loss_percent,
        default=100.0,
    )

    if loss <= 0.1:
        score -= 0

    elif loss <= 1:
        score -= 5

    elif loss <= 3:
        score -= 15

    elif loss <= 5:
        score -= 25

    elif loss <= 10:
        score -= 40

    else:
        score -= 55

    # --------------------------------------------------------
    # Signal
    # --------------------------------------------------------

    if signal_dbm is not None:
        signal = safe_float(signal_dbm)

        if signal >= -50:
            score -= 0

        elif signal >= -60:
            score -= 3

        elif signal >= -70:
            score -= 8

        elif signal >= -80:
            score -= 15

        else:
            score -= 25

    # --------------------------------------------------------
    # Download speed
    # --------------------------------------------------------

    if download_mbps is not None:
        speed = safe_float(download_mbps)

        if speed >= 100:
            score += 0

        elif speed >= 50:
            score -= 2

        elif speed >= 20:
            score -= 5

        elif speed >= 5:
            score -= 12

        elif speed > 0:
            score -= 20

    score = clamp(
        score,
        0,
        100,
    )

    score = round(score)

    if score >= 90:
        quality = "EXCELLENT"

    elif score >= 75:
        quality = "VERY GOOD"

    elif score >= 60:
        quality = "GOOD"

    elif score >= 40:
        quality = "FAIR"

    elif score >= 20:
        quality = "POOR"

    else:
        quality = "CRITICAL"

    return {
        "score": score,
        "quality": quality,
    }


# ============================================================
# INTELLILINK INTELLIGENCE ENGINE
# ============================================================

def generate_recommendation(
    score: int,
    latency_ms: Optional[float],
    packet_loss_percent: Optional[float],
    jitter_ms: Optional[float],
) -> Dict[str, Any]:
    """
    Generate a rule-based recommendation.

    V0.1 intentionally uses deterministic engineering rules.
    A trained predictive model can be introduced in a later
    version after sufficient measurement data exists.
    """

    latency = (
        latency_ms
        if latency_ms is not None
        else 9999
    )

    loss = (
        packet_loss_percent
        if packet_loss_percent is not None
        else 100
    )

    jitter = (
        jitter_ms
        if jitter_ms is not None
        else 9999
    )

    if score >= 90:
        return {
            "action": "MAINTAIN",
            "priority": "LOW",
            "message": (
                "Current connection is performing "
                "at an excellent level. Maintain "
                "the active connection."
            ),
        }

    if loss >= 10:
        return {
            "action": "INVESTIGATE_PACKET_LOSS",
            "priority": "HIGH",
            "message": (
                "High packet loss detected. "
                "Investigate signal quality, "
                "router stability or upstream connectivity."
            ),
        }

    if latency >= 200:
        return {
            "action": "INVESTIGATE_LATENCY",
            "priority": "HIGH",
            "message": (
                "High latency detected. "
                "Consider evaluating another available "
                "network connection."
            ),
        }

    if jitter >= 60:
        return {
            "action": "INVESTIGATE_JITTER",
            "priority": "MEDIUM",
            "message": (
                "High jitter detected. "
                "Real-time applications may experience "
                "unstable performance."
            ),
        }

    if score < 60:
        return {
            "action": "SEARCH_ALTERNATIVE",
            "priority": "MEDIUM",
            "message": (
                "Network quality is below the preferred "
                "threshold. Evaluate alternative connectivity."
            ),
        }

    return {
        "action": "MONITOR",
        "priority": "LOW",
        "message": (
            "Connection is usable. Continue monitoring "
            "network performance."
        ),
    }


# ============================================================
# FULL NETWORK SNAPSHOT
# ============================================================

def collect_network_snapshot() -> Dict[str, Any]:
    """
    Collect a complete IntelliLink network snapshot.
    """

    interface = get_network_interface()
    wifi = get_wifi_information()

    latency = measure_latency(
        host="cloudflare.com",
        port=443,
        attempts=4,
    )

    internet = internet_status()

    score_data = calculate_network_score(
        latency_ms=latency["latency_ms"],
        jitter_ms=latency["jitter_ms"],
        packet_loss_percent=latency[
            "packet_loss_percent"
        ],
        signal_dbm=wifi["signal_dbm"],
    )

    recommendation = generate_recommendation(
        score=score_data["score"],
        latency_ms=latency["latency_ms"],
        packet_loss_percent=latency[
            "packet_loss_percent"
        ],
        jitter_ms=latency["jitter_ms"],
    )

    return {
        "timestamp": utc_now(),

        "device": {
            "device_id": DEVICE_ID,
            "model_number": MODEL_NUMBER,
            "serial_number": SERIAL_NUMBER,
            "hardware_revision": HARDWARE_REVISION,
            "firmware_version": FIRMWARE_VERSION,
        },

        "interface": interface,

        "wifi": wifi,

        "latency": latency,

        "internet": internet,

        "network_quality": score_data,

        "intelligence": recommendation,
    }


# ============================================================
# DEVICE IDENTITY
# ============================================================

def get_device_identity() -> Dict[str, Any]:
    """Return complete IntelliLink prototype identity."""

    return {
        "product_name": APP_NAME,
        "product_family": PRODUCT_FAMILY,
        "model_number": MODEL_NUMBER,

        "device_id": DEVICE_ID,
        "device_uuid": DEVICE_UUID,

        "serial_number": SERIAL_NUMBER,

        "smart_card": {
            "smart_card_id": SMART_CARD_ID,
            "status": "DEMO",
            "type": "SMART_CONNECTIVITY_CARD",
        },

        "network_interface": {
            "interface_id": NETWORK_INTERFACE_ID,
            "status": "ACTIVE",
        },

        "wifi_profile": {
            "profile_id": WIFI_PROFILE_ID,
        },

        "security": {
            "security_module_id": SECURITY_MODULE_ID,
            "status": "PROTOTYPE",
        },

        "software": {
            "firmware": FIRMWARE_VERSION,
            "application_version": APP_VERSION,
        },

        "hardware": {
            "revision": HARDWARE_REVISION,
            "status": "PROTOTYPE",
        },

        "manufacturer": MANUFACTURER,
        "developer": DEVELOPER,

        "platform": get_device_platform(),

        "created_for": (
            "IntelliLink X1 Network Management Prototype"
        ),
    }


# ============================================================
# DIAGNOSTICS
# ============================================================

def run_diagnostics() -> Dict[str, Any]:
    """Run system and network diagnostics."""

    local_ip = get_local_ip()
    gateway = get_default_gateway()

    internet = internet_status()

    checks = {
        "python_runtime": True,
        "network_interface": (
            local_ip != "127.0.0.1"
        ),
        "gateway_detected": gateway is not None,
        "internet_access": internet["connected"],
    }

    passed = sum(
        1
        for value in checks.values()
        if value
    )

    total = len(checks)

    if passed == total:
        status = "HEALTHY"

    elif passed >= total * 0.5:
        status = "DEGRADED"

    else:
        status = "CRITICAL"

    return {
        "status": status,
        "checks": checks,
        "passed": passed,
        "total": total,
        "timestamp": utc_now(),
    }


# ============================================================
# APPLICATION STARTUP
# ============================================================

@app.on_event("startup")
async def startup_event() -> None:
    """
    Application startup hook.

    Database initialization will be connected here when
    database.py is introduced.
    """

    print("=" * 60)
    print("INTELLILINK X1")
    print("Network Intelligence Platform")
    print("=" * 60)
    print(f"Model:       {MODEL_NUMBER}")
    print(f"Version:     {APP_VERSION}")
    print(f"Device ID:   {DEVICE_ID}")
    print(f"Firmware:    {FIRMWARE_VERSION}")
    print("=" * 60)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Application shutdown hook."""

    print("IntelliLink X1 shutting down...")


# ============================================================
# ROOT / DASHBOARD
# ============================================================

@app.get(
    "/",
    response_class=HTMLResponse,
)
async def root() -> HTMLResponse:
    """
    Serve the IntelliLink X1 dashboard.
    """

    if INDEX_FILE.exists():
        try:
            html = INDEX_FILE.read_text(
                encoding="utf-8",
            )

            return HTMLResponse(
                content=html,
                status_code=200,
            )

        except OSError as exc:
            return HTMLResponse(
                content=(
                    "<h1>IntelliLink X1</h1>"
                    f"<p>Dashboard read error: {exc}</p>"
                ),
                status_code=500,
            )

    return HTMLResponse(
        content="""
        <!DOCTYPE html>
        <html>
        <head>
            <title>IntelliLink X1</title>
            <meta name="viewport"
                  content="width=device-width, initial-scale=1">
        </head>
        <body>
            <h1>IntelliLink X1</h1>
            <p>Backend is running.</p>
            <p>index.html has not been created yet.</p>
            <p>API: <a href="/docs">/docs</a></p>
        </body>
        </html>
        """,
        status_code=200,
    )


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
async def health() -> Dict[str, Any]:
    """
    Application health endpoint.
    """

    uptime = time.time() - START_TIME

    return {
        "status": "healthy",
        "service": APP_NAME,
        "version": APP_VERSION,
        "model": MODEL_NUMBER,
        "device_id": DEVICE_ID,
        "uptime_seconds": round(
            uptime,
            2,
        ),
        "timestamp": utc_now(),
    }


# ============================================================
# API ROOT
# ============================================================

@app.get(f"/api/{API_VERSION}")
async def api_root() -> Dict[str, Any]:
    """API information."""

    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "api_version": API_VERSION,
        "status": "ONLINE",
        "endpoints": {
            "health": "/health",
            "device": "/api/v1/device",
            "network": "/api/v1/network",
            "wifi": "/api/v1/wifi",
            "latency": "/api/v1/network/latency",
            "diagnostics": "/api/v1/diagnostics",
            "snapshot": "/api/v1/network/snapshot",
            "score": "/api/v1/network/score",
        },
        "timestamp": utc_now(),
    }


# ============================================================
# DEVICE API
# ============================================================

@app.get(f"/api/{API_VERSION}/device")
async def device_api() -> Dict[str, Any]:
    """Return IntelliLink X1 device identity."""

    return {
        "success": True,
        "data": get_device_identity(),
        "timestamp": utc_now(),
    }


# ============================================================
# NETWORK INTERFACE API
# ============================================================

@app.get(f"/api/{API_VERSION}/network")
async def network_api() -> Dict[str, Any]:
    """Return network-interface information."""

    return {
        "success": True,
        "data": get_network_interface(),
        "timestamp": utc_now(),
    }


# ============================================================
# WIFI API
# ============================================================

@app.get(f"/api/{API_VERSION}/wifi")
async def wifi_api() -> Dict[str, Any]:
    """Return Wi-Fi information."""

    return {
        "success": True,
        "data": get_wifi_information(),
        "timestamp": utc_now(),
    }


# ============================================================
# LATENCY API
# ============================================================

@app.get(
    f"/api/{API_VERSION}/network/latency"
)
async def latency_api(
    host: str = Query(
        default="cloudflare.com",
        min_length=1,
        max_length=255,
    ),
    attempts: int = Query(
        default=4,
        ge=1,
        le=10,
    ),
) -> Dict[str, Any]:
    """Measure network latency."""

    result = measure_latency(
        host=host,
        port=443,
        attempts=attempts,
    )

    return {
        "success": True,
        "data": result,
        "timestamp": utc_now(),
    }


# ============================================================
# NETWORK SNAPSHOT API
# ============================================================

@app.get(
    f"/api/{API_VERSION}/network/snapshot"
)
async def network_snapshot_api() -> Dict[str, Any]:
    """
    Return complete network intelligence snapshot.
    """

    try:
        snapshot = await asyncio.to_thread(
            collect_network_snapshot
        )

        return {
            "success": True,
            "data": snapshot,
        }

    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "NETWORK_SNAPSHOT_FAILED",
                "message": str(exc),
                "timestamp": utc_now(),
            },
        )


# ============================================================
# SCORE API
# ============================================================

@app.get(
    f"/api/{API_VERSION}/network/score"
)
async def network_score_api() -> Dict[str, Any]:
    """
    Calculate current network quality score.
    """

    snapshot = collect_network_snapshot()

    return {
        "success": True,
        "data": {
            "score": snapshot[
                "network_quality"
            ]["score"],

            "quality": snapshot[
                "network_quality"
            ]["quality"],

            "recommendation": snapshot[
                "intelligence"
            ],
        },

        "timestamp": utc_now(),
    }


# ============================================================
# DIAGNOSTICS API
# ============================================================

@app.get(
    f"/api/{API_VERSION}/diagnostics"
)
async def diagnostics_api() -> Dict[str, Any]:
    """Run IntelliLink X1 diagnostics."""

    try:
        result = await asyncio.to_thread(
            run_diagnostics
        )

        return {
            "success": True,
            "data": result,
        }

    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "DIAGNOSTICS_FAILED",
                "message": str(exc),
                "timestamp": utc_now(),
            },
        )


# ============================================================
# FULL STATUS API
# ============================================================

@app.get(
    f"/api/{API_VERSION}/status"
)
async def full_status_api() -> Dict[str, Any]:
    """
    Return complete IntelliLink X1 operational status.
    """

    snapshot = collect_network_snapshot()

    return {
        "success": True,

        "system": {
            "application": APP_NAME,
            "version": APP_VERSION,
            "model": MODEL_NUMBER,
            "firmware": FIRMWARE_VERSION,
            "status": "ONLINE",
        },

        "device": get_device_identity(),

        "network": snapshot,

        "timestamp": utc_now(),
    }


# ============================================================
# SIMPLE SPEED TEST FRAMEWORK
# ============================================================

@app.get(
    f"/api/{API_VERSION}/speed-test"
)
async def speed_test_api() -> Dict[str, Any]:
    """
    Lightweight connectivity benchmark.

    V0.1 does not claim carrier-grade throughput measurement.
    It measures connection establishment latency and reports
    that full throughput testing will be added to the
    dedicated speed-test layer.
    """

    start = time.perf_counter()

    success, latency = check_host(
        "speed.cloudflare.com",
        443,
        timeout=5.0,
    )

    elapsed = (
        time.perf_counter() - start
    ) * 1000.0

    return {
        "success": True,

        "data": {
            "test_server": "speed.cloudflare.com",
            "connection_reachable": success,
            "connection_latency_ms": latency,
            "measurement_duration_ms": round(
                elapsed,
                2,
            ),

            "download_mbps": None,
            "upload_mbps": None,

            "status": (
                "SERVER_REACHABLE"
                if success
                else "SERVER_UNREACHABLE"
            ),

            "note": (
                "Full bandwidth measurement will be "
                "implemented in the dedicated IntelliLink "
                "speed-test module."
            ),
        },

        "timestamp": utc_now(),
    }


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request,
    exc: HTTPException,
) -> JSONResponse:
    """Return consistent API errors."""

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": "HTTP_ERROR",
            "message": exc.detail,
            "path": str(request.url.path),
            "timestamp": utc_now(),
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """
    Global safety net.

    Prevents an unexpected exception from producing an
    unstructured server response.
    """

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "INTERNAL_SERVER_ERROR",
            "message": str(exc),
            "path": str(request.url.path),
            "timestamp": utc_now(),
        },
    )


# ============================================================
# LOCAL DEVELOPMENT ENTRY POINT
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(
            os.environ.get(
                "PORT",
                "8000",
            )
        ),
        reload=False,
        log_level="info",
    )

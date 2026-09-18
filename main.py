"""
INTELLILINK X1
==============
Network intelligence, prediction & control dashboard.

Run:
    pip install -r requirements.txt
    python main.py
Then open:  http://127.0.0.1:8000

Environment variables (optional hooks for real switching):
    INTELLILINK_CMD_WIFI   e.g. "svc wifi enable"
    INTELLILINK_CMD_5G     e.g. "svc data enable && settings put global preferred_network_mode 20"
    INTELLILINK_CMD_4G     e.g. "settings put global preferred_network_mode 9"
    INTELLILINK_CMD_3G     e.g. "settings put global preferred_network_mode 1"
    INTELLILINK_PING_HOST  default 8.8.8.8
"""

import asyncio
import os
import platform
import re
import statistics
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

import psutil
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

try:
    import speedtest  # from speedtest-cli
    HAS_SPEEDTEST = True
except Exception:
    HAS_SPEEDTEST = False

# ------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
APP_NAME = "INTELLILINK X1"
PING_HOST = os.getenv("INTELLILINK_PING_HOST", "8.8.8.8")

SWITCH_CMDS = {
    "Wi-Fi": os.getenv("INTELLILINK_CMD_WIFI", ""),
    "5G":    os.getenv("INTELLILINK_CMD_5G", ""),
    "4G":    os.getenv("INTELLILINK_CMD_4G", ""),
    "3G":    os.getenv("INTELLILINK_CMD_3G", ""),
}

# ==================================================================
# STATE
# ==================================================================
class NetState:
    def __init__(self, window: int = 60):
        self.down = deque(maxlen=window)   # (ts, Mbps)
        self.up   = deque(maxlen=window)
        self.lat  = deque(maxlen=window)   # (ts, ms or None)
        self.history = deque(maxlen=180)   # snapshots for chart
        self.current = {
            "timestamp": None,
            "download_mbps": 0.0,
            "upload_mbps": 0.0,
            "latency_ms": 0.0,
            "jitter_ms": 0.0,
            "packet_loss": 0.0,
            "network_type": "Unknown",
            "interface": "—",
            "generation": "—",
            "health_score": 0.0,
            "grade": "—",
            "signal_bars": 0,
        }
        self.predictions = []
        self.policy = {
            "mode": "balanced",
            "active_app": None,
            "background_blocked": False,
            "allocations": {"video": 0.30, "download": 0.30, "browsing": 0.30, "other": 0.10},
        }
        self.auto_switch = True
        self.switch_log = deque(maxlen=30)
        self.events = deque(maxlen=80)
        self.threat_scans = deque(maxlen=40)


state = NetState()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def log_event(level: str, msg: str):
    state.events.append({"ts": now_iso(), "level": level, "msg": msg})


# ==================================================================
# NETWORK DETECTION
# ==================================================================
def detect_interface():
    """Return (friendly_name, iface_name)."""
    try:
        addrs = psutil.net_if_addrs()
        stats = psutil.net_if_stats()
    except Exception:
        return "Unknown", "—"

    def is_up(name):
        st = stats.get(name)
        return bool(st and st.isup)

    def has_ipv4(name):
        for a in addrs.get(name, []):
            if a.family.name == "AF_INET" and not a.address.startswith("127."):
                return True
        return False

    for name in addrs:
        if re.search(r"(wlan|wifi|wl\d)", name, re.I) and is_up(name) and has_ipv4(name):
            return "Wi-Fi", name
    for name in addrs:
        if re.search(r"(rmnet|ccmni|pdp|wwan|cell|enp.*usb)", name, re.I) and is_up(name):
            return "Cellular", name
    for name, st in stats.items():
        if name == "lo" or name.lower().startswith("loopback"):
            continue
        if st.isup and has_ipv4(name):
            return "Ethernet/Other", name
    return "Offline", "—"


def infer_generation(down_mbps: float, latency_ms: float) -> str:
    if down_mbps <= 0.05:
        return "—"
    if down_mbps >= 100 and latency_ms and latency_ms < 40:
        return "5G"
    if down_mbps >= 15:
        return "4G/LTE"
    if down_mbps >= 2:
        return "3G"
    if down_mbps >= 0.1:
        return "2G"
    return "Unknown"


def io_for(iface: str):
    try:
        per = psutil.net_io_counters(pernic=True)
        return per.get(iface) or psutil.net_io_counters()
    except Exception:
        return psutil.net_io_counters()


# ==================================================================
# LATENCY (ping)
# ==================================================================
async def measure_latency(host: str = PING_HOST, timeout: float = 1.5) -> Optional[float]:
    system = platform.system().lower()
    if system == "windows":
        cmd = ["ping", "-n", "1", "-w", str(int(timeout * 1000)), host]
    else:
        cmd = ["ping", "-c", "1", "-W", str(max(int(timeout), 1)), host]
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        out, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout + 1.0)
        text = out.decode(errors="ignore")
        m = re.search(r"time[=<]\s*([\d.]+)\s*ms", text, re.I)
        if m:
            return float(m.group(1))
        return None
    except Exception:
        return None


# ==================================================================
# SCORING
# ==================================================================
def health_score(down, up, lat, jitter, loss_frac) -> float:
    def lin(v, worst, best):
        if v <= best:
            return 1.0
        if v >= worst:
            return 0.0
        return 1.0 - (v - best) / (worst - best)

    s_down = lin(down, 0.5, 50)
    s_up   = lin(up, 0.2, 20)
    s_lat  = lin(lat, 500, 20)
    s_jit  = lin(jitter, 150, 5)
    s_loss = lin(loss_frac, 0.10, 0.0)
    score = (s_down * 0.32 + s_up * 0.13 + s_lat * 0.25 + s_jit * 0.12 + s_loss * 0.18) * 100
    return round(score, 1)


def grade(score: float) -> str:
    if score >= 85: return "A+ — Nzuri sana"
    if score >= 70: return "A — Nzuri"
    if score >= 55: return "B — Wastani"
    if score >= 40: return "C — Hafifu"
    if score >= 25: return "D — Mbaya"
    return "F — Mbovu sana"


def bars(score: float) -> int:
    return max(0, min(5, int(round(score / 20))))


# ==================================================================
# PREDICTION
# ==================================================================
def linear_predict(samples, seconds_ahead: int = 10) -> Optional[float]:
    pts = [(t, v) for t, v in samples if v is not None]
    if len(pts) < 6:
        return None
    t0 = pts[0][0]
    xs = [t - t0 for t, _ in pts]
    ys = [v for _, v in pts]
    n = len(xs)
    mx = sum(xs) / n
    my = sum(ys) / n
    denom = sum((x - mx) ** 2 for x in xs)
    if denom == 0:
        return my
    slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / denom
    intercept = my - slope * mx
    return max(0.0, slope * (xs[-1] + seconds_ahead) + intercept)


def build_predictions():
    preds = []
    for metric, samples, unit in [
        ("download_mbps", state.down, "Mbps"),
        ("upload_mbps",   state.up,   "Mbps"),
        ("latency_ms",    state.lat,  "ms"),
    ]:
        vals = [(t, v) for t, v in samples if v is not None]
        if len(vals) < 6:
            continue
        cur = vals[-1][1]
        p10 = linear_predict(vals, 10)
        if p10 is None:
            continue
        delta = ((p10 - cur) / cur * 100) if cur > 0 else 0.0
        preds.append({
            "metric": metric,
            "current": round(cur, 2),
            "predicted_10s": round(p10, 2),
            "delta_pct": round(delta, 1),
            "unit": unit,
        })
    state.predictions = preds


# ==================================================================
# SAMPLER LOOP
# ==================================================================
async def sampler():
    net_type, iface = detect_interface()
    prev = io_for(iface)
    prev_t = time.time()

    while True:
        await asyncio.sleep(1.0)
        try:
            cur_t = time.time()
            cur = io_for(iface)
            dt = max(cur_t - prev_t, 0.001)
            down_mbps = (cur.bytes_recv - prev.bytes_recv) * 8 / dt / 1e6
            up_mbps   = (cur.bytes_sent - prev.bytes_sent) * 8 / dt / 1e6
            prev, prev_t = cur, cur_t

            lat = await measure_latency()
            state.down.append((cur_t, down_mbps))
            state.up.append((cur_t, up_mbps))
            state.lat.append((cur_t, lat))

            lat_vals = [v for _, v in state.lat if v is not None]
            recent_lat = lat_vals[-15:] if lat_vals else []
            avg_lat = statistics.mean(recent_lat) if recent_lat else 0.0
            if len(recent_lat) >= 2:
                jitter = statistics.mean(abs(recent_lat[i] - recent_lat[i - 1])
                                         for i in range(1, len(recent_lat)))
            else:
                jitter = 0.0
            total = len(state.lat)
            loss = 1.0 - (len(lat_vals) / total) if total else 0.0

            net_type, iface = detect_interface()
            score = health_score(down_mbps, up_mbps, avg_lat, jitter, loss)
            gen = infer_generation(down_mbps, avg_lat)

            state.current.update({
                "timestamp": now_iso(),
                "download_mbps": round(down_mbps, 3),
                "upload_mbps":   round(up_mbps, 3),
                "latency_ms":    round(avg_lat, 1),
                "jitter_ms":     round(jitter, 1),
                "packet_loss":   round(loss * 100, 2),
                "network_type":  net_type,
                "interface":     iface,
                "generation":    gen,
                "health_score":  score,
                "grade":         grade(score),
                "signal_bars":   bars(score),
            })
            state.history.append({
                "t": cur_t,
                "down": round(down_mbps, 2),
                "up":   round(up_mbps, 2),
                "lat":  round(avg_lat, 1),
            })

            build_predictions()
            await auto_switch_check()

        except Exception as e:
            log_event("error", f"Sampler: {e}")


# ==================================================================
# AUTO SWITCH
# ==================================================================
async def trigger_switch(target: str, reason: str):
    entry = {
        "ts": now_iso(),
        "from": state.current["network_type"] + "/" + state.current["generation"],
        "to": target,
        "reason": reason,
        "executed": False,
    }
    cmd = SWITCH_CMDS.get(target, "")
    if cmd:
        try:
            proc = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await asyncio.wait_for(proc.communicate(), timeout=10)
            entry["executed"] = True
            entry["cmd"] = cmd
        except Exception as e:
            entry["error"] = str(e)
    state.switch_log.append(entry)
    log_event("warn", f"Switch → {target} ({reason})")


_last_switch_ts = 0.0

async def auto_switch_check():
    global _last_switch_ts
    if not state.auto_switch:
        return
    if time.time() - _last_switch_ts < 15:   # cooldown
        return

    down_pred = next((p for p in state.predictions if p["metric"] == "download_mbps"), None)
    if not down_pred:
        return
    cur = down_pred["current"]
    pred = down_pred["predicted_10s"]
    if cur < 1.0:
        return
    # Drop > 45% predicted => switch
    if pred < cur * 0.55:
        # Prefer Wi-Fi if available & command set, else 5G/4G
        if SWITCH_CMDS.get("Wi-Fi"):
            target = "Wi-Fi"
        elif SWITCH_CMDS.get("5G"):
            target = "5G"
        elif SWITCH_CMDS.get("4G"):
            target = "4G"
        else:
            target = "5G"  # recommend
        await trigger_switch(target, f"Kushuka kunatarajiwa: {cur}→{pred} Mbps")
        _last_switch_ts = time.time()


# ==================================================================
# THREAT ANALYSIS
# ==================================================================
SUSPICIOUS_TLDS = {
    "zip", "mov", "tk", "ml", "ga", "cf", "gq", "top", "xyz", "click",
    "work", "loan", "review", "country", "kim", "science", "party",
    "gdn", "stream", "racing", "win", "bid", "men", "date", "faith",
    "cricket", "accountant", "rest",
}
PHISH_WORDS = [
    "login", "verify", "secure", "account", "update", "bank", "paypal",
    "signin", "confirm", "password", "wallet", "invoice", "payment",
    "support", "metamask", "binance", "coinbase", "netflix", "amazon",
]
BRANDS = ["apple", "microsoft", "google", "facebook", "whatsapp", "instagram"]


def analyze_url(raw: str) -> dict:
    findings = []
    score = 0
    u = raw.strip()
    if not re.match(r"^[a-z][a-z0-9+.-]*://", u, re.I):
        u = "http://" + u
    try:
        p = urlparse(u)
    except Exception:
        return {"url": raw, "risk": 100, "level": "HIGH", "findings": ["URL si sahihi"]}

    host = (p.hostname or "").lower()
    path = (p.path or "").lower()
    query = (p.query or "").lower()
    full = u.lower()

    # IP literal
    if re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host):
        score += 30
        findings.append("Host ni IP address (bila domain jina)")

    # @ in URL
    if "@" in full.split("://", 1)[-1].split("/", 1)[0]:
        score += 25
        findings.append("Alama '@' kwenye URL (inadanganya browser)")

    # Punycode / homoglyph
    if "xn--" in host:
        score += 35
        findings.append("Punycode (xn--) — inaweza kuwa homoglyph attack")

    # Suspicious TLD
    tld = host.rsplit(".", 1)[-1] if "." in host else ""
    if tld in SUSPICIOUS_TLDS:
        score += 25
        findings.append(f"TLD ya kutiliwa shaka: .{tld}")

    # Phishing keywords
    hits = [w for w in PHISH_WORDS if w in host or w in path or w in query]
    if hits:
        score += min(20, 6 * len(hits))
        findings.append("Maneno ya phishing: " + ", ".join(hits[:5]))

    # Brand lookalike
    for b in BRANDS:
        if b in host and not host.endswith(b + ".com") and b + ".com" not in host:
            score += 20
            findings.append(f"Inaonekana kujifanya brand: {b}")
            break

    # Excessive subdomains
    if host.count(".") >= 4:
        score += 15
        findings.append("Subdomains nyingi kupita kiasi")

    # Non-standard port
    if p.port and p.port not in (80, 443, 8080, 8443):
        score += 10
        findings.append(f"Port isiyo ya kawaida: {p.port}")

    # Long URL
    if len(u) > 120:
        score += 10
        findings.append("URL ndefu kupita kiasi")

    # HTTP (no TLS)
    if p.scheme == "http":
        score += 8
        findings.append("HTTP (bila encryption)")

    score = min(100, score)
    level = "LOW" if score < 30 else "MEDIUM" if score < 60 else "HIGH"
    if not findings:
        findings.append("Hakuna dalili za hatari zilizoonekana")

    return {"url": raw, "risk": score, "level": level, "findings": findings}


# ==================================================================
# FASTAPI
# ==================================================================
app = FastAPI(title=APP_NAME)


@app.on_event("startup")
async def _startup():
    asyncio.create_task(sampler())
    log_event("info", f"{APP_NAME} imeanza. Ping host: {PING_HOST}")


@app.get("/", response_class=HTMLResponse)
async def index():
    return (BASE_DIR / "index.html").read_text(encoding="utf-8")


@app.get("/api/state")
async def api_state():
    return JSONResponse({
        **state.current,
        "predictions": state.predictions,
        "policy": state.policy,
        "auto_switch": state.auto_switch,
        "switch_log": list(state.switch_log)[-15:],
        "events": list(state.events)[-30:],
        "history": list(state.history)[-90:],
        "threat_scans": list(state.threat_scans)[-10:],
    })


class SwitchCmd(BaseModel):
    target: str
    reason: Optional[str] = "Manual"


@app.post("/api/switch")
async def api_switch(cmd: SwitchCmd):
    await trigger_switch(cmd.target, cmd.reason or "Manual")
    return {"ok": True}


class AutoSwitch(BaseModel):
    enabled: bool


@app.post("/api/auto-switch")
async def api_auto_switch(body: AutoSwitch):
    state.auto_switch = body.enabled
    log_event("info", f"Auto-switch: {'ON' if body.enabled else 'OFF'}")
    return {"auto_switch": state.auto_switch}


class PolicyIn(BaseModel):
    mode: str
    active_app: Optional[str] = None


POLICY_TABLE = {
    "balanced": {"video": 0.30, "download": 0.30, "browsing": 0.30, "other": 0.10},
    "video":    {"video": 0.70, "download": 0.05, "browsing": 0.15, "other": 0.10},
    "download": {"video": 0.10, "download": 0.75, "browsing": 0.10, "other": 0.05},
    "browsing": {"video": 0.15, "download": 0.05, "browsing": 0.70, "other": 0.10},
}


@app.post("/api/policy")
async def api_policy(body: PolicyIn):
    mode = body.mode if body.mode in POLICY_TABLE else "balanced"
    state.policy["mode"] = mode
    state.policy["active_app"] = body.active_app
    state.policy["allocations"] = POLICY_TABLE[mode]
    state.policy["background_blocked"] = mode in ("video", "download")
    log_event("info", f"Policy = {mode} (app: {body.active_app or '—'})")
    return state.policy


class UrlIn(BaseModel):
    url: str


@app.post("/api/scan-url")
async def api_scan_url(body: UrlIn):
    result = analyze_url(body.url)
    state.threat_scans.append({"ts": now_iso(), **result})
    log_event(
        "warn" if result["level"] == "HIGH" else "info",
        f"Scan {body.url} → {result['level']} ({result['risk']})",
    )
    return result


@app.post("/api/speedtest")
async def api_speedtest():
    if not HAS_SPEEDTEST:
        return JSONResponse(
            {"error": "speedtest-cli haipo. Endesha: pip install speedtest-cli"},
            status_code=503,
        )

    def _run():
        st = speedtest.Speedtest(secure=True)
        st.get_best_server()
        d = st.download() / 1e6
        u = st.upload() / 1e6
        return d, u, st.results.ping

    loop = asyncio.get_event_loop()
    try:
        d, u, ping = await loop.run_in_executor(None, _run)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

    log_event("info", f"Speedtest: ↓{d:.1f} Mbps ↑{u:.1f} Mbps ping {ping:.0f}ms")
    return {
        "download_mbps": round(d, 2),
        "upload_mbps":   round(u, 2),
        "ping_ms":       round(ping, 1),
        "server":        "auto",
    }


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json({
                **state.current,
                "predictions": state.predictions,
                "policy": state.policy,
                "auto_switch": state.auto_switch,
                "switch_log": list(state.switch_log)[-15:],
                "events": list(state.events)[-20:],
                "history": list(state.history)[-90:],
            })
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return
    except Exception:
        return


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

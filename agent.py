"""
IntelliLink X1 — Phone Agent
============================
Run this on your Android phone (via Termux) to let the IntelliLink X1
backend control your phone's network.

Requirements on the phone:
    pkg install python termux-api
    pip install websockets requests

Root access recommended for real network switching.
Alternatively, enable Wireless Debugging and pair ADB.

Usage:
    python agent.py --server https://intellilink-x1.onrender.com \
                    --device-id <DEVICE_ID> \
                    --token <TOKEN>

Get DEVICE_ID + TOKEN by registering a device in the IntelliLink X1 dashboard.
"""

import argparse
import asyncio
import json
import os
import re
import shutil
import subprocess
import time
from datetime import datetime, timezone

import requests
import websockets

# ==================================================================
# CONFIG
# ==================================================================
DEFAULT_SERVER = os.getenv("INTELLILINK_SERVER", "http://127.0.0.1:8000")
DEFAULT_DEVICE = os.getenv("INTELLILINK_DEVICE", "")
DEFAULT_TOKEN  = os.getenv("INTELLILINK_TOKEN", "")

TELEMETRY_INTERVAL = 3   # seconds
RECONNECT_DELAY    = 3   # seconds


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def log(level, msg):
    print(f"[{now_iso()}] [{level.upper()}] {msg}", flush=True)


# ==================================================================
# SHELL HELPERS
# ==================================================================
def has(cmd: str) -> bool:
    return shutil.which(cmd) is not None


def run(cmd, timeout=15):
    """Run a shell command, return (rc, stdout, stderr)."""
    try:
        p = subprocess.run(
            cmd, shell=isinstance(cmd, str),
            capture_output=True, text=True, timeout=timeout,
        )
        return p.returncode, p.stdout.strip(), p.stderr.strip()
    except subprocess.TimeoutExpired:
        return 124, "", "timeout"
    except Exception as e:
        return 1, "", str(e)


# ==================================================================
# CAPABILITIES DETECTION
# ==================================================================
def detect_capabilities() -> dict:
    caps = {
        "termux_api":   has("termux-telephony-cellinfo"),
        "svc":          has("svc"),
        "settings":     has("settings"),
        "su":           has("su"),
        "adb":          has("adb"),
        "ip":           has("ip"),
        "dumpsys":      has("dumpsys"),
    }
    caps["root"] = False
    if caps["su"]:
        rc, _, _ = run("su -c id", timeout=4)
        caps["root"] = (rc == 0)
    return caps


# ==================================================================
# NETWORK READ (signal, type)
# ==================================================================
def read_signal() -> dict:
    """Return signal bars, network type, operator if possible."""
    info = {
        "signal_bars": 0,
        "signal_dbm": None,
        "network_type": "Unknown",
        "generation": "—",
        "operator": None,
    }

    # Termux:API path
    if has("termux-telephony-cellinfo"):
        rc, out, _ = run("termux-telephony-cellinfo")
        if rc == 0 and out:
            try:
                data = json.loads(out)
                # Parse first registered cell
                for cell in data if isinstance(data, list) else [data]:
                    if cell.get("registered"):
                        dbm = cell.get("dbm")
                        if dbm is not None:
                            info["signal_dbm"] = dbm
                            info["signal_bars"] = dbm_to_bars(dbm)
                        net = cell.get("type") or cell.get("network_type")
                        if net:
                            info["network_type"] = net
                            info["generation"] = net_to_gen(net)
                        break
            except Exception:
                pass

    # dumpsys fallback
    if info["signal_bars"] == 0 and has("dumpsys"):
        rc, out, _ = run("dumpsys telephony.registry")
        if rc == 0:
            m = re.search(r"mSignalStrength=SignalStrength:\s*([\d,]+)", out)
            if m:
                try:
                    parts = [int(x) for x in m.group(1).split(",")]
                    lvl = parts[0] if parts else 0
                    info["signal_bars"] = max(0, min(5, lvl))
                except Exception:
                    pass
            m2 = re.search(r"mDataConnectionState=(\d+)", out)
            if m2 and info["network_type"] == "Unknown":
                info["network_type"] = "Cellular"
                info["generation"] = "LTE"

    if has("termux-telephony-deviceinfo"):
        rc, out, _ = run("termux-telephony-deviceinfo")
        if rc == 0:
            try:
                d = json.loads(out)
                info["operator"] = d.get("network_operator_name")
            except Exception:
                pass

    return info


def dbm_to_bars(dbm: int) -> int:
    """Convert dBm to 0-5 bars."""
    if dbm >= -70: return 5
    if dbm >= -85: return 4
    if dbm >= -100: return 3
    if dbm >= -110: return 2
    if dbm >= -120: return 1
    return 0


def net_to_gen(net: str) -> str:
    n = net.upper()
    if "5G" in n or "NR" in n: return "5G"
    if "LTE" in n or "4G" in n: return "4G"
    if "UMTS" in n or "HSPA" in n or "3G" in n: return "3G"
    if "EDGE" in n or "GPRS" in n or "2G" in n: return "2G"
    return "—"


# ==================================================================
# NETWORK CONTROL
# ==================================================================
def _su(cmd: str) -> tuple:
    """Run a command as root (falls back to normal if no su)."""
    if has("su"):
        return run(f"su -c {json.dumps(cmd)}")
    return run(cmd)


# Android preferred_network_mode values
#   0=WCDMA preferred, 1=GSM only, 2=WCDMA only, 3=GSM/WCDMA auto,
#   9=LTE/GSM/WCDMA, 11=LTE only, 12=LTE/WCDMA, 20=NR/LTE/GSM/WCDMA, 21=NR only
NETWORK_MODES = {
    "2G": 1,
    "3G": 2,
    "4G": 9,
    "5G": 20,
}


def switch_network(target: str) -> tuple:
    """Switch preferred network. target = 'Wi-Fi' | '2G' | '3G' | '4G' | '5G'."""
    target = target.strip()

    if target == "Wi-Fi":
        _su("svc wifi enable")
        _su("svc data disable")   # optional: turn off cellular
        return True, "Wi-Fi enabled"

    if target == "Cellular":
        _su("svc wifi disable")
        _su("svc data enable")
        return True, "Cellular enabled"

    mode = NETWORK_MODES.get(target)
    if mode is None:
        return False, f"Unknown target: {target}"

    # Enable cellular data
    _su("svc data enable")
    # Set preferred network mode
    rc, out, err = _su(f"settings put global preferred_network_mode {mode}")
    if rc != 0:
        return False, f"settings put failed: {err}"

    # Also try the SIM-specific key on dual-SIM devices
    _su(f"settings put global preferred_network_mode1 {mode}")

    return True, f"Preferred network → {target} (mode={mode})"


def toggle_data(on: bool) -> tuple:
    return _su(f"svc data {'enable' if on else 'disable'}"), "data toggled"


def toggle_wifi(on: bool) -> tuple:
    return _su(f"svc wifi {'enable' if on else 'disable'}"), "wifi toggled"


def apply_policy(args: dict) -> tuple:
    """
    Best-effort traffic policy. True per-app throttling needs root + tc/iptables.
    Here we do a lightweight version:
      - video mode: WiFi on (prefer high bandwidth)
      - download mode: both data + wifi on
      - balanced: leave as-is
    """
    mode = args.get("mode", "balanced")
    if mode == "video":
        return _su("svc wifi enable"), "video mode"
    if mode == "download":
        _su("svc wifi enable")
        _su("svc data enable")
        return True, "download mode"
    return True, "balanced (no change)"


# ==================================================================
# COMMAND HANDLER
# ==================================================================
async def handle_command(ws, msg: dict):
    cmd = msg.get("command")
    args = msg.get("args", {}) or {}
    log("info", f"Command: {cmd} args={args}")

    ok, detail = False, ""

    try:
        if cmd == "switch_network":
            ok, detail = switch_network(args.get("target", "4G"))

        elif cmd == "data":
            ok, detail = toggle_data(bool(args.get("on", True)))

        elif cmd == "wifi":
            ok, detail = toggle_wifi(bool(args.get("on", True)))

        elif cmd == "apply_policy":
            ok, detail = apply_policy(args)

        elif cmd == "get_signal":
            info = read_signal()
            await ws.send(json.dumps({
                "type": "telemetry",
                "data": info,
            }))
            ok, detail = True, json.dumps(info)

        elif cmd == "ping":
            ok, detail = True, "pong"

        else:
            ok, detail = False, f"Unknown command: {cmd}"

    except Exception as e:
        ok, detail = False, f"Exception: {e}"

    # Report result
    await ws.send(json.dumps({
        "type": "command_result",
        "command": cmd,
        "args": args,
        "ok": ok,
        "detail": detail,
        "ts": now_iso(),
    }))
    log("info" if ok else "warn", f"Result {cmd}: {ok} {detail}")


# ==================================================================
# MAIN LOOP
# ==================================================================
async def telemetry_loop(ws):
    while True:
        try:
            info = read_signal()
            await ws.send(json.dumps({"type": "telemetry", "data": info}))
        except Exception as e:
            log("warn", f"Telemetry send failed: {e}")
        await asyncio.sleep(TELEMETRY_INTERVAL)


async def run_agent(server: str, device_id: str, token: str):
    # Build ws url
    url = server.rstrip("/")
    ws_url = url.replace("https://", "wss://").replace("http://", "ws://")
    ws_url = f"{ws_url}/ws/agent/{device_id}?token={token}"

    while True:
        try:
            log("info", f"Connecting to {ws_url} ...")
            async with websockets.connect(ws_url, ping_interval=25, ping_timeout=10) as ws:
                log("info", "Connected ✓")

                # Send capabilities
                caps = detect_capabilities()
                log("info", f"Capabilities: {caps}")
                await ws.send(json.dumps({"type": "capabilities", "data": caps}))

                # Start telemetry
                tele_task = asyncio.create_task(telemetry_loop(ws))

                try:
                    async for raw in ws:
                        try:
                            msg = json.loads(raw)
                        except Exception:
                            continue
                        if msg.get("type") == "command":
                            await handle_command(ws, msg)
                finally:
                    tele_task.cancel()

        except Exception as e:
            log("warn", f"Disconnected: {e}")

        log("info", f"Reconnecting in {RECONNECT_DELAY}s ...")
        await asyncio.sleep(RECONNECT_DELAY)


def main():
    ap = argparse.ArgumentParser(description="IntelliLink X1 Phone Agent")
    ap.add_argument("--server", default=DEFAULT_SERVER,
                    help="Backend base URL (e.g. https://intellilink-x1.onrender.com)")
    ap.add_argument("--device-id", default=DEFAULT_DEVICE)
    ap.add_argument("--token", default=DEFAULT_TOKEN)
    ap.add_argument("--register", action="store_true",
                    help="Register a new device against the server and exit")
    ap.add_argument("--name", default="My Phone",
                    help="Device name (used with --register)")

    args = ap.parse_args()

    if args.register:
        r = requests.post(f"{args.server.rstrip('/')}/api/device/register",
                          json={"name": args.name}, timeout=15)
        r.raise_for_status()
        d = r.json()
        print()
        print("=" * 60)
        print(" Device registered! Save these values:")
        print("=" * 60)
        print(f"  DEVICE_ID = {d['device_id']}")
        print(f"  TOKEN     = {d['token']}")
        print()
        print(" Now run:")
        print(f"  python agent.py --server {args.server} \\")
        print(f"      --device-id {d['device_id']} --token {d['token']}")
        print("=" * 60)
        return

    if not args.device_id or not args.token:
        print("ERROR: --device-id and --token are required.")
        print("       First run with --register to get them.")
        return

    try:
        asyncio.run(run_agent(args.server, args.device_id, args.token))
    except KeyboardInterrupt:
        log("info", "Agent stopped by user")


if __name__ == "__main__":
    main()

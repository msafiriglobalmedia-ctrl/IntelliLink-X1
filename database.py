"""
============================================================
INTELLILINK X1
DATABASE MODULE
============================================================

Project:
    IntelliLink X1

Description:
    Intelligent Multi-Connectivity Network Management System

Database:
    SQLite

Database File:
    intellilink.db

Purpose:
    - Device identity
    - Network monitoring history
    - Speed-test history
    - Diagnostics
    - System events
    - Device configuration
    - Network connection records

Security:
    - No Wi-Fi passwords are stored
    - Sensitive credentials are never persisted
    - Device identifiers are locally generated
    - SQLite foreign-key enforcement enabled

============================================================
"""

from __future__ import annotations

import os
import sqlite3
import uuid
import secrets
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


# ============================================================
# PROJECT PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATABASE_FILE = BASE_DIR / "intellilink.db"

# Compatibility with code that expects DATABASE_PATH.
DATABASE_PATH = DATABASE_FILE

DATABASE_URL = f"sqlite:///{DATABASE_FILE}"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection() -> sqlite3.Connection:
    """
    Create and return a SQLite database connection.

    Row factory allows:

        row["column_name"]

    instead of:

        row[0]
    """

    connection = sqlite3.connect(
        DATABASE_FILE,
        timeout=30,
        check_same_thread=False,
    )

    connection.row_factory = sqlite3.Row

    # Enable foreign-key support.
    connection.execute("PRAGMA foreign_keys = ON;")

    # Improve reliability when several operations happen.
    connection.execute("PRAGMA journal_mode = WAL;")

    # Wait up to 5 seconds when the database is temporarily locked.
    connection.execute("PRAGMA busy_timeout = 5000;")

    return connection


# ============================================================
# TIME
# ============================================================

def utc_now() -> str:
    """
    Return current UTC time in ISO-8601 format.
    """

    return datetime.now(timezone.utc).isoformat()


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def init_db() -> None:
    """
    Create all IntelliLink X1 database tables.

    Safe to call every time the application starts.
    Existing tables are preserved.
    """

    DATABASE_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    connection = get_connection()

    try:
        cursor = connection.cursor()

        # ====================================================
        # DEVICE
        # ====================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS device (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                device_uuid TEXT NOT NULL UNIQUE,

                product_name TEXT NOT NULL DEFAULT 'IntelliLink X1',

                model_number TEXT NOT NULL UNIQUE,

                device_smart_card_number TEXT NOT NULL UNIQUE,

                serial_number TEXT NOT NULL UNIQUE,

                hardware_revision TEXT NOT NULL DEFAULT 'X1-HW-01',

                firmware_version TEXT NOT NULL DEFAULT '1.0.0',

                software_version TEXT NOT NULL DEFAULT '1.0.0',

                manufacturer TEXT NOT NULL DEFAULT 'IntelliLink',

                device_type TEXT NOT NULL DEFAULT 'Multi-Connectivity Network Manager',

                manufacture_date TEXT,

                activation_date TEXT,

                status TEXT NOT NULL DEFAULT 'ACTIVE',

                country_code TEXT DEFAULT 'TZ',

                timezone TEXT DEFAULT 'Africa/Dar_es_Salaam',

                mac_address TEXT,

                local_ip TEXT,

                hostname TEXT,

                uptime_seconds INTEGER NOT NULL DEFAULT 0,

                created_at TEXT NOT NULL,

                updated_at TEXT NOT NULL
            );
            """
        )

        # ====================================================
        # NETWORK CONNECTIONS
        # ====================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS network_connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                device_id INTEGER NOT NULL,

                connection_type TEXT NOT NULL,

                network_name TEXT,

                operator_name TEXT,

                interface_name TEXT,

                ip_address TEXT,

                gateway TEXT,

                dns_server TEXT,

                signal_strength INTEGER,

                signal_quality REAL,

                download_speed_mbps REAL,

                upload_speed_mbps REAL,

                latency_ms REAL,

                jitter_ms REAL,

                packet_loss_percent REAL,

                connection_status TEXT NOT NULL DEFAULT 'UNKNOWN',

                is_active INTEGER NOT NULL DEFAULT 0,

                measured_at TEXT NOT NULL,

                FOREIGN KEY (device_id)
                    REFERENCES device(id)
                    ON DELETE CASCADE
            );
            """
        )

        # ====================================================
        # NETWORK SAMPLES
        # ====================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS network_samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                device_id INTEGER NOT NULL,

                network_type TEXT NOT NULL,

                latency_ms REAL,

                jitter_ms REAL,

                packet_loss_percent REAL,

                download_mbps REAL,

                upload_mbps REAL,

                signal_strength INTEGER,

                signal_quality REAL,

                response_time_ms REAL,

                score REAL,

                quality TEXT,

                measured_at TEXT NOT NULL,

                FOREIGN KEY (device_id)
                    REFERENCES device(id)
                    ON DELETE CASCADE
            );
            """
        )

        # ====================================================
        # SPEED TESTS
        # ====================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS speed_tests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                device_id INTEGER NOT NULL,

                network_type TEXT NOT NULL,

                server_name TEXT,

                server_location TEXT,

                download_mbps REAL,

                upload_mbps REAL,

                latency_ms REAL,

                jitter_ms REAL,

                packet_loss_percent REAL,

                test_duration_seconds REAL,

                result_quality TEXT,

                tested_at TEXT NOT NULL,

                FOREIGN KEY (device_id)
                    REFERENCES device(id)
                    ON DELETE CASCADE
            );
            """
        )

        # ====================================================
        # DIAGNOSTICS
        # ====================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS diagnostics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                device_id INTEGER NOT NULL,

                diagnostic_type TEXT NOT NULL,

                component TEXT,

                status TEXT NOT NULL,

                severity TEXT NOT NULL DEFAULT 'INFO',

                message TEXT,

                diagnostic_code TEXT,

                recommended_action TEXT,

                diagnostic_data TEXT,

                created_at TEXT NOT NULL,

                FOREIGN KEY (device_id)
                    REFERENCES device(id)
                    ON DELETE CASCADE
            );
            """
        )

        # ====================================================
        # SYSTEM EVENTS
        # ====================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS system_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                device_id INTEGER,

                event_type TEXT NOT NULL,

                event_level TEXT NOT NULL DEFAULT 'INFO',

                message TEXT NOT NULL,

                metadata TEXT,

                created_at TEXT NOT NULL,

                FOREIGN KEY (device_id)
                    REFERENCES device(id)
                    ON DELETE SET NULL
            );
            """
        )

        # ====================================================
        # DEVICE SETTINGS
        # ====================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS device_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                device_id INTEGER NOT NULL UNIQUE,

                preferred_network TEXT DEFAULT 'AUTO',

                auto_switch INTEGER NOT NULL DEFAULT 1,

                predictive_mode INTEGER NOT NULL DEFAULT 1,

                monitoring_enabled INTEGER NOT NULL DEFAULT 1,

                diagnostics_enabled INTEGER NOT NULL DEFAULT 1,

                telemetry_enabled INTEGER NOT NULL DEFAULT 1,

                power_saving_mode INTEGER NOT NULL DEFAULT 0,

                max_data_usage_mb INTEGER,

                preferred_dns TEXT,

                updated_at TEXT NOT NULL,

                FOREIGN KEY (device_id)
                    REFERENCES device(id)
                    ON DELETE CASCADE
            );
            """
        )

        # ====================================================
        # NETWORK SWITCH EVENTS
        # ====================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS network_switches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                device_id INTEGER NOT NULL,

                from_network TEXT,

                to_network TEXT NOT NULL,

                reason TEXT,

                previous_score REAL,

                new_score REAL,

                automatic INTEGER NOT NULL DEFAULT 1,

                successful INTEGER NOT NULL DEFAULT 0,

                switched_at TEXT NOT NULL,

                FOREIGN KEY (device_id)
                    REFERENCES device(id)
                    ON DELETE CASCADE
            );
            """
        )

        # ====================================================
        # INDEXES
        # ====================================================

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_network_samples_device_time
            ON network_samples(device_id, measured_at);
            """
        )

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_speed_tests_device_time
            ON speed_tests(device_id, tested_at);
            """
        )

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_diagnostics_device_time
            ON diagnostics(device_id, created_at);
            """
        )

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_network_connections_device_time
            ON network_connections(device_id, measured_at);
            """
        )

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_events_device_time
            ON system_events(device_id, created_at);
            """
        )

        connection.commit()

    finally:
        connection.close()


# ============================================================
# DEVICE IDENTITY
# ============================================================

def generate_device_uuid() -> str:
    """
    Generate permanent UUID for an IntelliLink X1 unit.
    """

    return str(uuid.uuid4()).upper()


def generate_model_number() -> str:
    """
    Official-style product model identifier.

    Example:
        ILX-X1-5G-001
    """

    return "ILX-X1-5G-001"


def generate_smart_card_number() -> str:
    """
    Generate an IntelliLink Smart Card identifier.

    This is NOT a SIM-card number.

    Format:
        ILXSC-TZ-XXXXXXXXXXXXXXXX

    The value is generated locally and does not represent
    a real telecom subscriber identity.
    """

    random_part = secrets.token_hex(8).upper()

    return f"ILXSC-TZ-{random_part}"


def generate_serial_number() -> str:
    """
    Generate unique hardware serial number.
    """

    random_part = secrets.token_hex(6).upper()

    return f"ILX1-{random_part}"


# ============================================================
# DEVICE CREATION
# ============================================================

def create_device(
    hostname: str = "INTELLILINK-X1",
    mac_address: Optional[str] = None,
    local_ip: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create the first IntelliLink X1 device record.

    If a device already exists, return the existing device.
    """

    connection = get_connection()

    try:
        existing = connection.execute(
            """
            SELECT *
            FROM device
            ORDER BY id ASC
            LIMIT 1
            """
        ).fetchone()

        if existing:
            return dict(existing)

        now = utc_now()

        device_uuid = generate_device_uuid()
        model_number = generate_model_number()
        smart_card = generate_smart_card_number()
        serial_number = generate_serial_number()

        connection.execute(
            """
            INSERT INTO device (
                device_uuid,
                product_name,
                model_number,
                device_smart_card_number,
                serial_number,
                hardware_revision,
                firmware_version,
                software_version,
                manufacturer,
                device_type,
                manufacture_date,
                activation_date,
                status,
                country_code,
                timezone,
                mac_address,
                local_ip,
                hostname,
                uptime_seconds,
                created_at,
                updated_at
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            """,
            (
                device_uuid,
                "IntelliLink X1",
                model_number,
                smart_card,
                serial_number,
                "X1-HW-01",
                "1.0.0",
                "1.0.0",
                "IntelliLink",
                "Multi-Connectivity Network Manager",
                now,
                now,
                "ACTIVE",
                "TZ",
                "Africa/Dar_es_Salaam",
                mac_address,
                local_ip,
                hostname,
                0,
                now,
                now,
            ),
        )

        device_id = connection.execute(
            "SELECT last_insert_rowid()"
        ).fetchone()[0]

        # Default settings
        connection.execute(
            """
            INSERT INTO device_settings (
                device_id,
                preferred_network,
                auto_switch,
                predictive_mode,
                monitoring_enabled,
                diagnostics_enabled,
                telemetry_enabled,
                power_saving_mode,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                device_id,
                "AUTO",
                1,
                1,
                1,
                1,
                1,
                0,
                now,
            ),
        )

        connection.commit()

        device = connection.execute(
            """
            SELECT *
            FROM device
            WHERE id = ?
            """,
            (device_id,),
        ).fetchone()

        return dict(device)

    finally:
        connection.close()


# ============================================================
# GET DEVICE
# ============================================================

def get_device() -> Optional[Dict[str, Any]]:
    """
    Return the primary IntelliLink X1 device.
    """

    connection = get_connection()

    try:
        row = connection.execute(
            """
            SELECT *
            FROM device
            ORDER BY id ASC
            LIMIT 1
            """
        ).fetchone()

        return dict(row) if row else None

    finally:
        connection.close()


def get_device_settings() -> Optional[Dict[str, Any]]:
    """
    Return device configuration.
    """

    connection = get_connection()

    try:
        row = connection.execute(
            """
            SELECT
                device_settings.*
            FROM device_settings
            INNER JOIN device
                ON device.id = device_settings.device_id
            ORDER BY device.id ASC
            LIMIT 1
            """
        ).fetchone()

        return dict(row) if row else None

    finally:
        connection.close()


# ============================================================
# UPDATE DEVICE
# ============================================================

def update_device(
    **fields: Any,
) -> bool:
    """
    Safely update allowed device fields.
    """

    allowed_fields = {
        "firmware_version",
        "software_version",
        "hardware_revision",
        "status",
        "mac_address",
        "local_ip",
        "hostname",
        "uptime_seconds",
    }

    updates = []

    values = []

    for field, value in fields.items():

        if field not in allowed_fields:
            continue

        updates.append(f"{field} = ?")
        values.append(value)

    if not updates:
        return False

    updates.append("updated_at = ?")
    values.append(utc_now())

    connection = get_connection()

    try:

        device = connection.execute(
            """
            SELECT id
            FROM device
            ORDER BY id ASC
            LIMIT 1
            """
        ).fetchone()

        if not device:
            return False

        values.append(device["id"])

        connection.execute(
            f"""
            UPDATE device
            SET {", ".join(updates)}
            WHERE id = ?
            """,
            values,
        )

        connection.commit()

        return True

    finally:
        connection.close()


# ============================================================
# NETWORK SAMPLE
# ============================================================

def save_network_sample(
    network_type: str,
    latency_ms: Optional[float] = None,
    jitter_ms: Optional[float] = None,
    packet_loss_percent: Optional[float] = None,
    download_mbps: Optional[float] = None,
    upload_mbps: Optional[float] = None,
    signal_strength: Optional[int] = None,
    signal_quality: Optional[float] = None,
    response_time_ms: Optional[float] = None,
    score: Optional[float] = None,
    quality: Optional[str] = None,
) -> int:
    """
    Save a network performance observation.
    """

    device = get_device()

    if not device:
        device = create_device()

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            INSERT INTO network_samples (
                device_id,
                network_type,
                latency_ms,
                jitter_ms,
                packet_loss_percent,
                download_mbps,
                upload_mbps,
                signal_strength,
                signal_quality,
                response_time_ms,
                score,
                quality,
                measured_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                device["id"],
                network_type,
                latency_ms,
                jitter_ms,
                packet_loss_percent,
                download_mbps,
                upload_mbps,
                signal_strength,
                signal_quality,
                response_time_ms,
                score,
                quality,
                utc_now(),
            ),
        )

        connection.commit()

        return cursor.lastrowid

    finally:
        connection.close()


# ============================================================
# SPEED TEST
# ============================================================

def save_speed_test(
    network_type: str,
    download_mbps: Optional[float] = None,
    upload_mbps: Optional[float] = None,
    latency_ms: Optional[float] = None,
    jitter_ms: Optional[float] = None,
    packet_loss_percent: Optional[float] = None,
    server_name: Optional[str] = None,
    server_location: Optional[str] = None,
    test_duration_seconds: Optional[float] = None,
    result_quality: Optional[str] = None,
) -> int:
    """
    Save speed-test result.
    """

    device = get_device()

    if not device:
        device = create_device()

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            INSERT INTO speed_tests (
                device_id,
                network_type,
                server_name,
                server_location,
                download_mbps,
                upload_mbps,
                latency_ms,
                jitter_ms,
                packet_loss_percent,
                test_duration_seconds,
                result_quality,
                tested_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                device["id"],
                network_type,
                server_name,
                server_location,
                download_mbps,
                upload_mbps,
                latency_ms,
                jitter_ms,
                packet_loss_percent,
                test_duration_seconds,
                result_quality,
                utc_now(),
            ),
        )

        connection.commit()

        return cursor.lastrowid

    finally:
        connection.close()


# ============================================================
# DIAGNOSTIC RECORD
# ============================================================

def save_diagnostic(
    diagnostic_type: str,
    status: str,
    component: Optional[str] = None,
    severity: str = "INFO",
    message: Optional[str] = None,
    diagnostic_code: Optional[str] = None,
    recommended_action: Optional[str] = None,
    diagnostic_data: Optional[str] = None,
) -> int:
    """
    Save a diagnostic event.
    """

    device = get_device()

    if not device:
        device = create_device()

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            INSERT INTO diagnostics (
                device_id,
                diagnostic_type,
                component,
                status,
                severity,
                message,
                diagnostic_code,
                recommended_action,
                diagnostic_data,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                device["id"],
                diagnostic_type,
                component,
                status,
                severity,
                message,
                diagnostic_code,
                recommended_action,
                diagnostic_data,
                utc_now(),
            ),
        )

        connection.commit()

        return cursor.lastrowid

    finally:
        connection.close()


# ============================================================
# SYSTEM EVENT
# ============================================================

def log_event(
    event_type: str,
    message: str,
    event_level: str = "INFO",
    metadata: Optional[str] = None,
) -> int:
    """
    Store a system event.
    """

    device = get_device()

    device_id = device["id"] if device else None

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            INSERT INTO system_events (
                device_id,
                event_type,
                event_level,
                message,
                metadata,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                device_id,
                event_type,
                event_level,
                message,
                metadata,
                utc_now(),
            ),
        )

        connection.commit()

        return cursor.lastrowid

    finally:
        connection.close()


# ============================================================
# NETWORK SWITCH
# ============================================================

def record_network_switch(
    to_network: str,
    from_network: Optional[str] = None,
    reason: Optional[str] = None,
    previous_score: Optional[float] = None,
    new_score: Optional[float] = None,
    automatic: bool = True,
    successful: bool = False,
) -> int:
    """
    Record a network-selection decision.
    """

    device = get_device()

    if not device:
        device = create_device()

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            INSERT INTO network_switches (
                device_id,
                from_network,
                to_network,
                reason,
                previous_score,
                new_score,
                automatic,
                successful,
                switched_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                device["id"],
                from_network,
                to_network,
                reason,
                previous_score,
                new_score,
                1 if automatic else 0,
                1 if successful else 0,
                utc_now(),
            ),
        )

        connection.commit()

        return cursor.lastrowid

    finally:
        connection.close()


# ============================================================
# HISTORY
# ============================================================

def get_network_history(
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Return recent network measurements.
    """

    limit = max(1, min(int(limit), 500))

    connection = get_connection()

    try:

        rows = connection.execute(
            """
            SELECT *
            FROM network_samples
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


def get_speed_history(
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Return recent speed tests.
    """

    limit = max(1, min(int(limit), 500))

    connection = get_connection()

    try:

        rows = connection.execute(
            """
            SELECT *
            FROM speed_tests
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


def get_diagnostics(
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Return recent diagnostic results.
    """

    limit = max(1, min(int(limit), 500))

    connection = get_connection()

    try:

        rows = connection.execute(
            """
            SELECT *
            FROM diagnostics
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


def get_events(
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Return recent system events.
    """

    limit = max(1, min(int(limit), 500))

    connection = get_connection()

    try:

        rows = connection.execute(
            """
            SELECT *
            FROM system_events
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

def get_dashboard_summary() -> Dict[str, Any]:
    """
    Return compact data for IntelliLink X1 dashboard.
    """

    device = get_device()

    if not device:
        device = create_device()

    connection = get_connection()

    try:

        latest_network = connection.execute(
            """
            SELECT *
            FROM network_samples
            ORDER BY id DESC
            LIMIT 1
            """
        ).fetchone()

        latest_speed = connection.execute(
            """
            SELECT *
            FROM speed_tests
            ORDER BY id DESC
            LIMIT 1
            """
        ).fetchone()

        latest_diagnostic = connection.execute(
            """
            SELECT *
            FROM diagnostics
            ORDER BY id DESC
            LIMIT 1
            """
        ).fetchone()

        return {
            "device": device,
            "latest_network": (
                dict(latest_network)
                if latest_network
                else None
            ),
            "latest_speed_test": (
                dict(latest_speed)
                if latest_speed
                else None
            ),
            "latest_diagnostic": (
                dict(latest_diagnostic)
                if latest_diagnostic
                else None
            ),
        }

    finally:
        connection.close()


# ============================================================
# DATABASE HEALTH
# ============================================================

def database_health() -> Dict[str, Any]:
    """
    Check whether the IntelliLink database is operational.
    """

    connection = get_connection()

    try:

        connection.execute("SELECT 1").fetchone()

        tables = connection.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            ORDER BY name
            """
        ).fetchall()

        return {
            "status": "healthy",
            "database": "SQLite",
            "file": str(DATABASE_FILE),
            "tables": [
                row["name"]
                for row in tables
            ],
            "timestamp": utc_now(),
        }

    except Exception as exc:

        return {
            "status": "error",
            "database": "SQLite",
            "error": str(exc),
            "timestamp": utc_now(),
        }

    finally:
        connection.close()


# ============================================================
# STARTUP
# ============================================================

def initialize_intellilink() -> Dict[str, Any]:
    """
    Complete IntelliLink X1 database startup routine.

    1. Creates database
    2. Creates tables
    3. Creates device identity
    4. Creates default settings
    5. Logs startup event
    """

    init_db()

    device = create_device()

    log_event(
        event_type="SYSTEM_STARTUP",
        message="IntelliLink X1 database initialized successfully.",
        event_level="INFO",
    )

    return {
        "status": "ready",
        "device": device,
        "database": str(DATABASE_FILE),
    }


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    result = initialize_intellilink()

    print("=" * 60)
    print("INTELLILINK X1 DATABASE")
    print("=" * 60)

    print(f"Status       : {result['status']}")
    print(f"Database     : {result['database']}")

    device = result["device"]

    print(f"Product      : {device['product_name']}")
    print(f"Model Number : {device['model_number']}")
    print(f"Serial       : {device['serial_number']}")
    print(
        f"Smart Card   : "
        f"{device['device_smart_card_number']}"
    )
    print(f"Device UUID  : {device['device_uuid']}")
    print(f"Firmware     : {device['firmware_version']}")
    print(f"Hardware     : {device['hardware_revision']}")
    print(f"Status       : {device['status']}")

    print("=" * 60)
    print("Database initialization completed.")
    print("=" * 60)

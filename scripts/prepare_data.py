"""
NASA C-MAPSS Turbofan Engine Data → RAG Documents
Transforms raw sensor CSVs into text documents for AnythingLLM ingestion.

FIX: Engine summaries and fleet overviews now use TEST data + RUL file,
     which reflects real mid-life engine health (not run-to-failure training data).
"""

import os
import numpy as np
import pandas as pd
from pathlib import Path

# ── CONFIG ──────────────────────────────────────────────────────────────
DATASET_PATH = Path(r"E:\nasa-chatbot\dataset")
OUTPUT_PATH = Path(__file__).parent.parent / "data" / "processed"

SENSOR_NAMES = {
    "sensor_1":  ("T2",          "Total temperature at fan inlet",      "°R"),
    "sensor_2":  ("T24",         "Total temperature at LPC outlet",     "°R"),
    "sensor_3":  ("T30",         "Total temperature at HPC outlet",     "°R"),
    "sensor_4":  ("T50",         "Total temperature at LPT outlet",     "°R"),
    "sensor_5":  ("P2",          "Pressure at fan inlet",               "psia"),
    "sensor_6":  ("P15",         "Total pressure in bypass-duct",       "psia"),
    "sensor_7":  ("P30",         "Total pressure at HPC outlet",        "psia"),
    "sensor_8":  ("Nf",          "Physical fan speed",                  "rpm"),
    "sensor_9":  ("Nc",          "Physical core speed",                 "rpm"),
    "sensor_10": ("epr",         "Engine pressure ratio (P50/P2)",      "—"),
    "sensor_11": ("Ps30",        "Static pressure at HPC outlet",       "psia"),
    "sensor_12": ("phi",         "Ratio of fuel flow to Ps30",          "pps/psi"),
    "sensor_13": ("NRf",         "Corrected fan speed",                 "rpm"),
    "sensor_14": ("NRc",         "Corrected core speed",                "rpm"),
    "sensor_15": ("BPR",         "Bypass Ratio",                        "—"),
    "sensor_16": ("farB",        "Burner fuel-air ratio",               "—"),
    "sensor_17": ("htBleed",     "Bleed Enthalpy",                      "—"),
    "sensor_18": ("Nf_dmd",      "Demanded fan speed",                  "rpm"),
    "sensor_19": ("PCNfR_dmd",   "Demanded corrected fan speed",        "rpm"),
    "sensor_20": ("W31",         "HPT coolant bleed",                   "lbm/s"),
    "sensor_21": ("W32",         "LPT coolant bleed",                   "lbm/s"),
}

COLUMNS = (
    ["engine_id", "cycle", "op_setting_1", "op_setting_2", "op_setting_3"]
    + [f"sensor_{i}" for i in range(1, 22)]
)

SUBSET_INFO = {
    "FD001": {"conditions": 1, "faults": 1, "fault_type": "HPC Degradation"},
    "FD002": {"conditions": 6, "faults": 1, "fault_type": "HPC Degradation"},
    "FD003": {"conditions": 1, "faults": 2, "fault_type": "HPC Degradation + Fan Degradation"},
    "FD004": {"conditions": 6, "faults": 2, "fault_type": "HPC Degradation + Fan Degradation"},
}

# Sensors that actually vary and carry health information
KEY_SENSORS = [2, 3, 4, 7, 8, 9, 11, 12, 13, 14, 15, 17, 20, 21]


# ── DATA LOADING ────────────────────────────────────────────────────────

def load_dataset(subset: str):
    """
    Load test data with correct RUL values from the RUL file.

    The RUL file contains the TRUE remaining cycles for each engine
    at the point where the test recording ends.

    So for every row in test data:
        RUL = (RUL from file) + (last_cycle_of_engine - current_cycle)

    This means:
    - At the last recorded cycle → RUL = value from RUL file (e.g. 112)
    - At earlier cycles → RUL is higher (engine was healthier then)
    """
    test_path  = DATASET_PATH / f"test_{subset}.txt"
    rul_path   = DATASET_PATH / f"RUL_{subset}.txt"

    test = pd.read_csv(test_path, sep=r"\s+", header=None, names=COLUMNS)
    rul  = pd.read_csv(rul_path,  sep=r"\s+", header=None, names=["RUL"])

    # Attach engine_id to RUL file (engines are numbered 1..N in order)
    rul["engine_id"] = range(1, len(rul) + 1)

    # Find the last recorded cycle for each engine in the test set
    test_last = (
        test.groupby("engine_id")["cycle"]
        .max()
        .reset_index()
        .rename(columns={"cycle": "last_cycle"})
    )

    # Merge last_cycle and RUL into the test dataframe
    test = test.merge(test_last, on="engine_id")
    test = test.merge(rul,       on="engine_id")

    # Calculate RUL for every row:
    # At last_cycle  → RUL = rul_file_value
    # At earlier cycle → RUL = rul_file_value + (last_cycle - current_cycle)
    test["RUL"] = test["RUL"] + (test["last_cycle"] - test["cycle"])
    test.drop(columns=["last_cycle"], inplace=True)

    return test


# ── HEALTH CLASSIFICATION ────────────────────────────────────────────────

def get_health_status(rul: int) -> str:
    if rul <= 15:
        return "CRITICAL"
    elif rul <= 40:
        return "DEGRADED"
    elif rul <= 80:
        return "WATCH"
    else:
        return "HEALTHY"


def get_risk_level(rul: int) -> str:
    if rul <= 15:
        return "CRITICAL"
    elif rul <= 40:
        return "HIGH"
    elif rul <= 80:
        return "MEDIUM"
    else:
        return "LOW"


# ── TREND ANALYSIS ───────────────────────────────────────────────────────

def compute_trend(values: pd.Series, window: int = 30) -> float:
    """Percentage change over the last N cycles."""
    if len(values) < 2:
        return 0.0
    recent = values.iloc[-min(window, len(values)):]
    if recent.iloc[0] == 0:
        return 0.0
    return ((recent.iloc[-1] - recent.iloc[0]) / abs(recent.iloc[0])) * 100


def trend_label(pct: float) -> str:
    if abs(pct) < 0.5:
        return "Stable"
    elif pct > 3:
        return "Rising ↑ ALERT"
    elif pct > 0.5:
        return "Rising ↑"
    elif pct < -3:
        return "Declining ↓ ALERT"
    else:
        return "Declining ↓"


# ── DOCUMENT GENERATORS ──────────────────────────────────────────────────

def generate_engine_summary(engine_data: pd.DataFrame, engine_id: int, subset: str) -> str:
    """
    Generate a health report for one engine using its CURRENT state
    (the last recorded cycle in the test data).
    RUL here is the real remaining life from the NASA RUL file.
    """
    latest      = engine_data.iloc[-1]          # most recent cycle
    total_cycles = int(latest["cycle"])          # cycles recorded so far
    current_rul  = int(latest["RUL"])            # true remaining life
    status       = get_health_status(current_rul)
    risk         = get_risk_level(current_rul)
    info         = SUBSET_INFO[subset]

    lines = [
        f"ENGINE HEALTH REPORT — {subset} Dataset",
        "=" * 50,
        f"Engine ID      : {engine_id}",
        f"Dataset        : {subset} ({info['fault_type']})",
        f"Op. Conditions : {info['conditions']}",
        f"Cycles Recorded: {total_cycles}",
        f"RUL (Remaining): {current_rul} cycles",
        f"Health Status  : {status}",
        f"Risk Level     : {risk}",
        "",
        "SENSOR READINGS & TRENDS (Last 30 Cycles)",
        "-" * 50,
    ]

    for s_idx in KEY_SENSORS:
        col = f"sensor_{s_idx}"
        sym, desc, unit = SENSOR_NAMES[col]
        val       = latest[col]
        trend_pct = compute_trend(engine_data[col])
        label     = trend_label(trend_pct)
        lines.append(
            f"  Sensor {s_idx:2d} ({sym:10s} — {desc}): "
            f"{val:.2f} {unit} | Trend: {label} ({trend_pct:+.1f}%)"
        )

    lines.append("")

    # Maintenance recommendation based on real RUL
    if current_rul <= 15:
        lines.append("⚠️  MAINTENANCE: IMMEDIATE inspection required!")
        lines.append(f"   Engine {engine_id} will fail within {current_rul} cycles.")
        lines.append("   Ground the engine and schedule full teardown.")
    elif current_rul <= 40:
        lines.append("⚠️  MAINTENANCE: Schedule inspection within 10 cycles.")
        lines.append(f"   Engine {engine_id} shows advancing degradation.")
    elif current_rul <= 80:
        lines.append("📋 MAINTENANCE: Monitor closely. Schedule next routine check.")
    else:
        lines.append("✅ MAINTENANCE: No immediate action. Engine operating normally.")

    lines.extend([
        "",
        "OPERATING CONDITIONS (Latest Cycle)",
        "-" * 50,
        f"  Setting 1 (Altitude)               : {latest['op_setting_1']:.4f}",
        f"  Setting 2 (Mach Number)             : {latest['op_setting_2']:.4f}",
        f"  Setting 3 (Throttle Resolver Angle) : {latest['op_setting_3']:.4f}",
    ])

    return "\n".join(lines)


def generate_fleet_overview(engine_ruls: dict, subset: str) -> str:
    """
    Fleet-wide summary using real RUL values from the test set.
    engine_ruls = { engine_id: rul_value }
    """
    lines = [
        f"FLEET OVERVIEW — {subset} Dataset",
        "=" * 50,
        f"Dataset        : {subset} ({SUBSET_INFO[subset]['fault_type']})",
        f"Total Engines  : {len(engine_ruls)}",
        "",
        "ENGINE STATUS SUMMARY",
        "-" * 50,
    ]

    critical, degraded, watch, healthy = [], [], [], []
    for eid, rul in sorted(engine_ruls.items()):
        bucket = get_health_status(rul)
        if bucket == "CRITICAL":
            critical.append((eid, rul))
        elif bucket == "DEGRADED":
            degraded.append((eid, rul))
        elif bucket == "WATCH":
            watch.append((eid, rul))
        else:
            healthy.append((eid, rul))

    lines.append(f"\n🔴 CRITICAL ({len(critical)} engines) — Ground immediately:")
    for eid, rul in critical:
        lines.append(f"  Engine {eid}: RUL = {rul} cycles")

    lines.append(f"\n🟠 DEGRADED ({len(degraded)} engines) — Schedule inspection soon:")
    for eid, rul in degraded:
        lines.append(f"  Engine {eid}: RUL = {rul} cycles")

    lines.append(f"\n🟡 WATCH ({len(watch)} engines) — Monitor closely:")
    for eid, rul in watch:
        lines.append(f"  Engine {eid}: RUL = {rul} cycles")

    lines.append(f"\n🟢 HEALTHY ({len(healthy)} engines) — Normal operation:")
    for eid, rul in healthy:
        lines.append(f"  Engine {eid}: RUL = {rul} cycles")

    return "\n".join(lines)


def generate_alerts(all_data: dict) -> str:
    """Active alerts across all subsets — only CRITICAL and DEGRADED engines."""
    lines = [
        "ACTIVE ENGINE ALERTS",
        "=" * 50,
        "Source: NASA C-MAPSS Test Dataset (real RUL values)",
        "",
    ]

    alert_count = 0
    for subset, engine_ruls in all_data.items():
        for eid, rul in sorted(engine_ruls.items()):
            if rul <= 15:
                lines.append(
                    f"🔴 CRITICAL | {subset} Engine {eid:3d} | "
                    f"RUL: {rul:3d} cycles | Action: GROUND IMMEDIATELY"
                )
                alert_count += 1
            elif rul <= 40:
                lines.append(
                    f"🟠 WARNING  | {subset} Engine {eid:3d} | "
                    f"RUL: {rul:3d} cycles | Action: Schedule inspection"
                )
                alert_count += 1

    if alert_count == 0:
        lines.append("✅ No active alerts. All engines operating within safe parameters.")
    else:
        lines.insert(4, f"Total Active Alerts: {alert_count}\n")

    return "\n".join(lines)


def generate_domain_docs() -> dict:
    """Static domain knowledge documents — unchanged."""
    docs = {}

    docs["turbofan_basics"] = """TURBOFAN ENGINE FUNDAMENTALS
==================================================
A turbofan engine is a type of air-breathing jet engine widely used in commercial and military aviation.

MAIN COMPONENTS:
- Fan: Large front fan that draws in air. Most air bypasses the core (bypass air).
- Low Pressure Compressor (LPC): Compresses air before it enters the high pressure section.
- High Pressure Compressor (HPC): Further compresses air to very high pressures before combustion.
- Combustion Chamber: Fuel is mixed with compressed air and ignited.
- High Pressure Turbine (HPT): Extracts energy from hot gases to drive the HPC.
- Low Pressure Turbine (LPT): Extracts energy to drive the fan and LPC.
- Nozzle: Accelerates exhaust gases to produce thrust.

KEY PERFORMANCE METRICS:
- Bypass Ratio (BPR): Ratio of bypass air to core air. Higher BPR = more fuel efficient.
- Engine Pressure Ratio (EPR): Ratio of exhaust pressure to inlet pressure. Indicates thrust.
- Exhaust Gas Temperature (EGT): Monitored for engine health. Rising EGT = degradation.

COMMON FAILURE MODES IN C-MAPSS:
1. HPC Degradation: Efficiency and flow capacity of the HPC decrease over time.
   Symptoms: Rising temperatures (T30), declining pressures (P30, Ps30), BPR changes.
2. Fan Degradation: Fan blade erosion or damage reduces efficiency.
   Symptoms: Changes in fan speed (Nf), bypass ratio, and inlet temperatures.
"""

    docs["sensor_dictionary"] = """C-MAPSS SENSOR DICTIONARY
==================================================
The C-MAPSS dataset monitors 21 sensors on each turbofan engine.

OPERATIONAL SETTINGS:
- Setting 1: Altitude (affects air density and engine performance)
- Setting 2: Mach Number (flight speed ratio to speed of sound)
- Setting 3: Throttle Resolver Angle (TRA - power demand)

TEMPERATURE SENSORS:
- Sensor 1  (T2)   : Total temperature at fan inlet [°R] — Ambient conditions
- Sensor 2  (T24)  : Total temperature at LPC outlet [°R] — LPC health indicator
- Sensor 3  (T30)  : Total temperature at HPC outlet [°R] — KEY: HPC degradation marker
- Sensor 4  (T50)  : Total temperature at LPT outlet [°R] — Turbine health

PRESSURE SENSORS:
- Sensor 5  (P2)   : Pressure at fan inlet [psia] — Nearly constant (ambient)
- Sensor 6  (P15)  : Total pressure in bypass-duct [psia] — Fan performance
- Sensor 7  (P30)  : Total pressure at HPC outlet [psia] — KEY: HPC health
- Sensor 11 (Ps30) : Static pressure at HPC outlet [psia] — KEY: Degradation marker

SPEED SENSORS:
- Sensor 8  (Nf)   : Physical fan speed [rpm] — Fan mechanical health
- Sensor 9  (Nc)   : Physical core speed [rpm] — Core mechanical health
- Sensor 13 (NRf)  : Corrected fan speed [rpm] — Normalized fan performance
- Sensor 14 (NRc)  : Corrected core speed [rpm] — Normalized core performance

RATIO & FLOW SENSORS:
- Sensor 10 (epr)  : Engine pressure ratio [—] — Overall thrust indicator
- Sensor 12 (phi)  : Fuel flow to Ps30 ratio [pps/psi] — Fuel efficiency
- Sensor 15 (BPR)  : Bypass Ratio [—] — KEY: Overall engine efficiency
- Sensor 16 (farB) : Burner fuel-air ratio [—] — Combustion efficiency

BLEED & DEMAND SENSORS:
- Sensor 17 (htBleed)    : Bleed Enthalpy [—] — Cooling system demand
- Sensor 18 (Nf_dmd)     : Demanded fan speed [rpm] — Control system output
- Sensor 19 (PCNfR_dmd)  : Demanded corrected fan speed [rpm] — Control demand
- Sensor 20 (W31)        : HPT coolant bleed [lbm/s] — Turbine cooling flow
- Sensor 21 (W32)        : LPT coolant bleed [lbm/s] — Turbine cooling flow

KEY sensors for degradation detection: 2, 3, 4, 7, 8, 9, 11, 12, 13, 14, 15, 17, 20, 21.
Sensors 1, 5, 6, 10, 16, 18, 19 are nearly constant in FD001/FD003 (single operating condition).
"""

    docs["failure_modes"] = """ENGINE FAILURE MODES AND DEGRADATION PATTERNS
==================================================

1. HPC (High Pressure Compressor) DEGRADATION
   Present in: FD001, FD002, FD003, FD004
   What happens: HPC efficiency and flow capacity gradually decrease.
   Root cause: Blade tip erosion, fouling, or seal wear in the compressor.

   Detectable symptoms:
   - Sensor 3  (T30)  : Temperature RISES as compressor works harder
   - Sensor 7  (P30)  : Pressure DROPS as compressor loses effectiveness
   - Sensor 11 (Ps30) : Static pressure DROPS
   - Sensor 12 (phi)  : Fuel-flow ratio INCREASES (burning more fuel for same output)
   - Sensor 15 (BPR)  : DECREASES as core flow changes
   - Sensor 9  (Nc)   : Core speed may INCREASE to compensate

   Typical progression:
   - Early   (RUL > 100) : Subtle changes, hard to detect
   - Mid     (RUL 40-100): Clear trends visible in T30, P30, phi
   - Late    (RUL < 40)  : Rapid deterioration, multiple sensors alarming
   - Critical (RUL < 15) : Imminent failure, ground immediately

2. FAN DEGRADATION
   Present in: FD003, FD004
   What happens: Fan blade efficiency decreases.
   Root cause: Foreign object damage (FOD), erosion, blade tip rub.

   Detectable symptoms:
   - Sensor 8  (Nf) : Fan speed changes
   - Sensor 15 (BPR): Bypass ratio shifts
   - Sensor 2  (T24): LPC outlet temperature changes

3. COMBINED HPC + FAN DEGRADATION (FD003, FD004)
   Both degradation modes progress simultaneously or sequentially.

MAINTENANCE THRESHOLDS:
- RUL > 80  cycles : HEALTHY  — Normal scheduled maintenance
- RUL 40-80 cycles : WATCH    — Increase monitoring frequency
- RUL 15-40 cycles : DEGRADED — Schedule inspection within 10 cycles
- RUL < 15  cycles : CRITICAL — Ground engine, immediate inspection
"""

    docs["rul_explanation"] = """REMAINING USEFUL LIFE (RUL) EXPLAINED
==================================================

WHAT IS RUL?
Remaining Useful Life (RUL) is the number of flight cycles an engine
can complete before it requires maintenance or fails.

In the C-MAPSS dataset:
- Each cycle = one complete flight (takeoff → cruise → landing)
- RUL = 0 means the engine has reached end of life
- The RUL values in this system come from the NASA RUL test files,
  representing engines that are CURRENTLY in service (not yet failed)

HOW RUL IS CALCULATED (test data):
  RUL at any cycle = RUL_from_file + (last_recorded_cycle - current_cycle)
  Example: Engine last recorded at cycle 150, RUL file says 50.
           At cycle 130: RUL = 50 + (150 - 130) = 70 cycles remaining.

DATASET SUBSETS:
- FD001: 100 test engines, 1 operating condition, HPC Degradation only
- FD002: 259 test engines, 6 operating conditions, HPC Degradation only
- FD003: 100 test engines, 1 operating condition, HPC + Fan Degradation
- FD004: 248 test engines, 6 operating conditions, HPC + Fan Degradation (hardest)
"""

    return docs


def generate_fleet_summary(all_rul_data: dict) -> str:
    """
    Compact fleet-wide summary — designed to fit in a SINGLE embedding chunk.
    This is the go-to document for fleet-wide queries like "how many critical engines?"
    """
    lines = [
        "FLEET-WIDE STATUS SUMMARY — ALL DATASETS",
        "=" * 50,
        "Source: NASA C-MAPSS Test Data (real RUL values)",
        "",
    ]

    total_engines = 0
    total_critical = 0
    total_degraded = 0
    total_watch = 0
    total_healthy = 0

    for subset in ["FD001", "FD002", "FD003", "FD004"]:
        if subset not in all_rul_data:
            continue
        engine_ruls = all_rul_data[subset]
        info = SUBSET_INFO[subset]

        critical = [(eid, rul) for eid, rul in engine_ruls.items() if rul <= 15]
        degraded = [(eid, rul) for eid, rul in engine_ruls.items() if 15 < rul <= 40]
        watch    = [(eid, rul) for eid, rul in engine_ruls.items() if 40 < rul <= 80]
        healthy  = [(eid, rul) for eid, rul in engine_ruls.items() if rul > 80]

        total_engines  += len(engine_ruls)
        total_critical += len(critical)
        total_degraded += len(degraded)
        total_watch    += len(watch)
        total_healthy  += len(healthy)

        lines.append(f"{subset} — {info['fault_type']} | {info['conditions']} operating condition(s)")
        lines.append(f"  Total Engines : {len(engine_ruls)}")
        lines.append(f"  🔴 CRITICAL   : {len(critical)} engines")
        if critical:
            crit_list = ", ".join(f"Engine {eid} (RUL={rul})" for eid, rul in sorted(critical))
            lines.append(f"     → {crit_list}")
        lines.append(f"  🟠 DEGRADED   : {len(degraded)} engines")
        if degraded:
            deg_list = ", ".join(f"Engine {eid} (RUL={rul})" for eid, rul in sorted(degraded))
            lines.append(f"     → {deg_list}")
        lines.append(f"  🟡 WATCH      : {len(watch)} engines")
        lines.append(f"  🟢 HEALTHY    : {len(healthy)} engines")
        lines.append("")

    lines.extend([
        "FLEET-WIDE TOTALS",
        "-" * 50,
        f"Total Engines  : {total_engines}",
        f"🔴 CRITICAL    : {total_critical} engines — GROUND IMMEDIATELY",
        f"🟠 DEGRADED    : {total_degraded} engines — Schedule inspection",
        f"🟡 WATCH       : {total_watch} engines — Monitor closely",
        f"🟢 HEALTHY     : {total_healthy} engines — Normal operation",
        "",
        f"Fleet Health Score: {(total_healthy / total_engines * 100):.1f}% healthy",
        f"Engines needing action: {total_critical + total_degraded} ({(total_critical + total_degraded) / total_engines * 100:.1f}%)",
    ])

    return "\n".join(lines)


# ── MAIN ─────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("NASA C-MAPSS → RAG Document Generator (FIXED)")
    print("Using TEST data with real RUL values")
    print("=" * 60)

    for subdir in ["engine_summaries", "domain_knowledge", "fleet_overviews", "alerts"]:
        (OUTPUT_PATH / subdir).mkdir(parents=True, exist_ok=True)

    all_rul_data = {}

    for subset in ["FD001", "FD002", "FD003", "FD004"]:
        print(f"\n📂 Processing {subset}...")
        try:
            test = load_dataset(subset)
        except FileNotFoundError as e:
            print(f"   ⚠️  Skipping {subset}: {e}")
            continue

        engine_ids = sorted(test["engine_id"].unique())
        print(f"   Found {len(engine_ids)} engines")

        subset_ruls = {}
        subset_dir = OUTPUT_PATH / "engine_summaries" / subset
        subset_dir.mkdir(parents=True, exist_ok=True)

        for eid in engine_ids:
            engine_data = test[test["engine_id"] == eid].sort_values("cycle")

            # RUL at the LAST recorded cycle = value from NASA RUL file
            current_rul = int(engine_data.iloc[-1]["RUL"])
            subset_ruls[eid] = current_rul

            summary = generate_engine_summary(engine_data, eid, subset)
            filepath = subset_dir / f"engine_{eid:03d}.txt"
            filepath.write_text(summary, encoding="utf-8")

        all_rul_data[subset] = subset_ruls

        # Count by status for info
        statuses = [get_health_status(r) for r in subset_ruls.values()]
        print(f"   ✅ {len(engine_ids)} engines | "
              f"Critical: {statuses.count('CRITICAL')} | "
              f"Degraded: {statuses.count('DEGRADED')} | "
              f"Watch: {statuses.count('WATCH')} | "
              f"Healthy: {statuses.count('HEALTHY')}")

        overview = generate_fleet_overview(subset_ruls, subset)
        (OUTPUT_PATH / "fleet_overviews" / f"fleet_{subset}.txt").write_text(overview, encoding="utf-8")
        print(f"   ✅ Fleet overview generated")

    alerts = generate_alerts(all_rul_data)
    (OUTPUT_PATH / "alerts" / "active_alerts.txt").write_text(alerts, encoding="utf-8")
    print(f"\n🚨 Active alerts document generated")

    # Compact fleet summary — fits in one embedding chunk
    fleet_summary = generate_fleet_summary(all_rul_data)
    (OUTPUT_PATH / "fleet_overviews" / "fleet_summary_all.txt").write_text(fleet_summary, encoding="utf-8")
    print(f"📊 Compact fleet summary generated")

    domain_docs = generate_domain_docs()
    for name, content in domain_docs.items():
        (OUTPUT_PATH / "domain_knowledge" / f"{name}.txt").write_text(content, encoding="utf-8")
    print(f"📚 {len(domain_docs)} domain knowledge documents generated")

    total = sum(len(v) for v in all_rul_data.values()) + len(domain_docs) + len(all_rul_data) + 2
    print(f"\n{'=' * 60}")
    print(f"✅ DONE! {total} documents → {OUTPUT_PATH}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
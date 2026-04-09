from collections import defaultdict
from datetime import datetime

from dateutil.parser import isoparse

from app.models.schemas import AnalysisOut, LogIn
from app.utils.constants import MALICIOUS_IPS, RISK_WEIGHTS, SENSITIVE_FILES


def _parse_time(value: datetime | str) -> datetime:
    if isinstance(value, datetime):
        return value
    return isoparse(value)


def _status_from_score(score: float) -> str:
    if score <= 30:
        return "Safe"
    if score <= 70:
        return "Suspicious"
    return "Attack"


def _single_log_signals(log: LogIn) -> tuple[float, list[str]]:
    score = 0.0
    reasons: list[str] = []
    timestamp = _parse_time(log.timestamp)

    if log.ip_address in MALICIOUS_IPS:
        score += RISK_WEIGHTS["malicious_ip"]
        reasons.append(f"Source IP {log.ip_address} appears on the simulated malicious reputation list")

    if timestamp.hour < 5:
        score += RISK_WEIGHTS["unusual_hours"]
        reasons.append("Activity occurred during unusual operating hours (00:00-05:00)")

    if log.action == "file_access" and log.file_path in SENSITIVE_FILES:
        score += RISK_WEIGHTS["sensitive_file"]
        reasons.append(f"Sensitive resource access detected: {log.file_path}")

    if log.action == "login" and not log.success:
        score += RISK_WEIGHTS["failed_login"]
        reasons.append("Login attempt failed")

    return score, reasons


def analyze_log(log: LogIn) -> AnalysisOut:
    score, reasons = _single_log_signals(log)
    final_score = min(100.0, round(score, 2))
    if not reasons:
        reasons = ["No high-risk anomaly patterns found for this event"]

    return AnalysisOut(
        status=_status_from_score(final_score),
        risk_score=final_score,
        reason="; ".join(reasons),
    )


def analyze_batch(logs: list[LogIn]) -> list[AnalysisOut]:
    base_scores: list[float] = []
    all_reasons: list[list[str]] = []

    for log in logs:
        score, reasons = _single_log_signals(log)
        base_scores.append(score)
        all_reasons.append(reasons)

    failed_login_count = defaultdict(int)
    user_events = defaultdict(list)

    for index, log in enumerate(logs):
        event_time = _parse_time(log.timestamp)
        user_events[log.user_id].append((event_time, log.country, index))

        if log.action == "login" and not log.success:
            failed_login_count[log.user_id] += 1

    for user_id, count in failed_login_count.items():
        if count >= 3:
            for idx, log in enumerate(logs):
                if log.user_id == user_id and log.action == "login" and not log.success:
                    base_scores[idx] += RISK_WEIGHTS["repeated_failed_login"]
                    all_reasons[idx].append("Multiple failed login attempts observed for the same user")

    for user_id, items in user_events.items():
        items.sort(key=lambda item: item[0])
        for current, next_item in zip(items, items[1:]):
            current_time, current_country, current_idx = current
            next_time, next_country, next_idx = next_item
            if current_country != next_country and (next_time - current_time).total_seconds() <= 2 * 3600:
                base_scores[current_idx] += RISK_WEIGHTS["impossible_travel"]
                base_scores[next_idx] += RISK_WEIGHTS["impossible_travel"]
                all_reasons[current_idx].append("Impossible travel pattern detected between consecutive events")
                all_reasons[next_idx].append("Impossible travel pattern detected between consecutive events")

    results: list[AnalysisOut] = []
    for score, reasons in zip(base_scores, all_reasons):
        final_score = min(100.0, round(score, 2))
        if not reasons:
            reasons = ["No high-risk anomaly patterns found for this event"]
        results.append(
            AnalysisOut(
                status=_status_from_score(final_score),
                risk_score=final_score,
                reason="; ".join(dict.fromkeys(reasons)),
            )
        )

    return results

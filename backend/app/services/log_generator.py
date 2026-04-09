from datetime import datetime, timedelta, timezone
import random

from app.models.schemas import LogIn
from app.utils.constants import MALICIOUS_IPS, SENSITIVE_FILES

USERS = ["alex", "maya", "sam", "jordan", "riley", "dana", "lee", "noah", "olivia", "kai"]
COUNTRIES = ["US", "DE", "IN", "JP", "BR", "GB", "CA", "AU", "SG", "ZA"]
CITIES = ["New York", "Berlin", "Bengaluru", "Tokyo", "Sao Paulo", "London", "Toronto", "Sydney", "Singapore", "Cape Town"]
ACTIONS = ["login", "file_access", "api_call"]
COMMON_FILES = ["/docs/guide.md", "/reports/q2.pdf", "/engineering/roadmap.md", "/tmp/build.log"]
SAFE_IPS = ["34.120.10.1", "8.8.8.8", "1.1.1.1", "52.13.24.8", "172.217.20.46", "18.198.22.14"]


def generate_logs(count: int) -> list[LogIn]:
    now = datetime.now(timezone.utc)
    logs: list[LogIn] = []
    bad_ips = list(MALICIOUS_IPS)

    for _ in range(count):
        user = random.choice(USERS)
        action = random.choices(ACTIONS, weights=[0.45, 0.35, 0.20], k=1)[0]
        country_index = random.randint(0, len(COUNTRIES) - 1)
        timestamp = now - timedelta(minutes=random.randint(1, 12 * 60))
        success = True
        file_path = None

        if action == "login":
            success = random.choices([True, False], weights=[0.8, 0.2], k=1)[0]
        if action == "file_access":
            file_path = random.choices([*COMMON_FILES, *SENSITIVE_FILES], weights=[6, 6, 6, 6, 1, 1, 1, 1], k=1)[0]

        ip_address = random.choices([*SAFE_IPS, *bad_ips], weights=[12, 12, 12, 12, 12, 12, 1, 1, 1, 1], k=1)[0]

        logs.append(
            LogIn(
                user_id=user,
                action=action,
                success=success,
                ip_address=ip_address,
                country=COUNTRIES[country_index],
                city=CITIES[country_index],
                file_path=file_path,
                timestamp=timestamp,
            )
        )

    return sorted(logs, key=lambda item: item.timestamp)

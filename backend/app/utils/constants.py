MALICIOUS_IPS = {
    "185.220.101.4",
    "103.102.166.224",
    "45.95.147.61",
    "91.214.124.17",
}

SENSITIVE_FILES = {
    "/etc/shadow",
    "/finance/payroll.xlsx",
    "/secrets/prod.env",
    "/hr/employee-records.csv",
}

RISK_WEIGHTS = {
    "malicious_ip": 35,
    "unusual_hours": 20,
    "sensitive_file": 25,
    "failed_login": 18,
    "repeated_failed_login": 30,
    "impossible_travel": 32,
}

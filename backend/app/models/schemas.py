from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class GenerateLogsRequest(BaseModel):
    count: int = Field(default=20, ge=1, le=200)


class LogIn(BaseModel):
    user_id: str
    action: str
    success: bool = True
    ip_address: str
    country: str
    city: str | None = None
    file_path: str | None = None
    timestamp: datetime


class AnalyzeBatchRequest(BaseModel):
    logs: list[LogIn]


class AnalysisOut(BaseModel):
    status: Literal["Safe", "Suspicious", "Attack"]
    risk_score: float = Field(ge=0, le=100)
    reason: str


class LogWithAnalysis(BaseModel):
    log: LogIn
    analysis: AnalysisOut


class AnalyzeBatchResponse(BaseModel):
    results: list[LogWithAnalysis]
    summary: dict[str, int]

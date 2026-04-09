from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.entities import AnalysisResult, LogEntry
from app.models.schemas import AnalyzeBatchRequest, AnalyzeBatchResponse, AnalysisOut, GenerateLogsRequest, LogIn, LogWithAnalysis
from app.services.detection_agent import analyze_batch, analyze_log
from app.services.log_generator import generate_logs

router = APIRouter()


def _persist_log(db: Session, payload: LogIn) -> LogEntry:
    log_entry = LogEntry(
        user_id=payload.user_id,
        action=payload.action,
        success=payload.success,
        ip_address=payload.ip_address,
        country=payload.country,
        city=payload.city,
        file_path=payload.file_path,
        timestamp=payload.timestamp,
    )
    db.add(log_entry)
    db.flush()
    return log_entry


def _persist_analysis(db: Session, log_id: int, analysis: AnalysisOut) -> None:
    db.add(
        AnalysisResult(
            log_id=log_id,
            status=analysis.status,
            risk_score=analysis.risk_score,
            reason=analysis.reason,
        )
    )


@router.post("/generate-logs", response_model=list[LogIn])
def generate_logs_endpoint(payload: GenerateLogsRequest, db: Session = Depends(get_db)):
    logs = generate_logs(payload.count)

    for log in logs:
        _persist_log(db, log)

    db.commit()
    return logs


@router.post("/analyze-log", response_model=AnalysisOut)
def analyze_single_log_endpoint(log: LogIn, db: Session = Depends(get_db)):
    analysis = analyze_log(log)
    log_entry = _persist_log(db, log)
    _persist_analysis(db, log_entry.id, analysis)
    db.commit()
    return analysis


@router.post("/analyze-batch", response_model=AnalyzeBatchResponse)
def analyze_batch_endpoint(payload: AnalyzeBatchRequest, db: Session = Depends(get_db)):
    analyses = analyze_batch(payload.logs)
    results: list[LogWithAnalysis] = []

    for log, analysis in zip(payload.logs, analyses):
        log_entry = _persist_log(db, log)
        _persist_analysis(db, log_entry.id, analysis)
        results.append(LogWithAnalysis(log=log, analysis=analysis))

    db.commit()

    summary = {"Safe": 0, "Suspicious": 0, "Attack": 0}
    for item in analyses:
        summary[item.status] += 1

    return AnalyzeBatchResponse(results=results, summary=summary)

FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SENTRA_DISABLE_FINBERT=1 \
    PYTHONPATH=/app

COPY requirements.txt .
RUN pip install --no-cache-dir requests psycopg[binary] redis pandas plotly streamlit sqlalchemy websocket-client

COPY ingestion /app/ingestion
COPY nlp /app/nlp
COPY analytics /app/analytics
COPY alerting /app/alerting
COPY dashboard /app/dashboard
COPY worker.py /app/worker.py

CMD ["python", "worker.py"]

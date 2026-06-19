FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim

RUN groupadd -r cartunez && useradd --no-log-init -r -g cartunez cartunez

WORKDIR /app

COPY --from=builder --chown=cartunez:cartunez /install /usr/local

COPY --chown=cartunez:cartunez . .

USER cartunez

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

#!/bin/bash
set -e
cd backend
exec uvicorn main:app \
  --host 0.0.0.0 \
  --port $PORT \
  --workers 1 \
  --timeout-keep-alive 30 \
  --timeout-notify 5 \
  --access-log

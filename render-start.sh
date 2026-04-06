#!/bin/bash
cd Backend && exec uvicorn main:app --host 0.0.0.0 --port $PORT

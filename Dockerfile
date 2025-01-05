FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Use shell form to allow environment variable expansion
CMD gunicorn --bind 0.0.0.0:${PORT:-8080} api.index:app 
FROM python:3.11-slim

WORKDIR /code

COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . /code

EXPOSE 5001

# Use Gunicorn with 1 worker (fits free-tier memory)
CMD bash -c "gunicorn --workers 1 --threads 1 --bind 0.0.0.0:$PORT app:app"

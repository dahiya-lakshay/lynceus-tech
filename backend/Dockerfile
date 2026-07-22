FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train once at image build time so model artifacts ship inside the image.
# (Re-run manually with `python -m app.ml.train` if you replace transactions.csv.)
RUN python -m app.ml.train

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

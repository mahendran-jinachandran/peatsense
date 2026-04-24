#!/bin/bash

echo "Waiting for PostgreSQL..."
while ! nc -z $DB_HOST $DB_PORT; do
    sleep 1
done
echo "PostgreSQL is up."

echo "Running migrations..."
python manage.py migrate

echo "Creating superuser if not exists..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@peatsense.com', 'admin123')
    print('Superuser created.')
else:
    print('Superuser already exists.')
"

echo "Seeding sample data..."
python manage.py seed_data

echo "Starting Gunicorn..."
gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --reload \
    --access-logfile - \
    --error-logfile -
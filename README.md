# PeatSense

PeatSense is a geospatial platform for classifying land cover in satellite imagery using machine learning. You upload a satellite image, run a KMeans classification and the result gets painted onto an interactive map, each land cover type in a different colour. 

---

## What It Does

- Upload raster (GeoTIFF) and vector (GeoJSON) datasets
- View them as layers on an interactive Leaflet map
- Toggle layers on and off
- Run KMeans land cover classification on any raster dataset
- Choose how many clusters (2 to 20) and which colour scheme
- See the prediction painted on the map with a colour legend
- Every inference run is tracked in MLflow with parameters and metrics
- Logged Users can register, upload their own private datasets and run their own analysis
- Admins can see and manage all datasets

---

## Stack

**Backend:** Django 4.2, Django REST Framework (DRF), SimpleJWT, rasterio, scikit-learn, MLflow, PostgreSQL, Gunicorn

**Frontend:** Next.js 16, React 18, React-Leaflet 4, Axios, Tailwind CSS, TypeScript

**Infrastructure:** Docker, Docker Compose

---

## Getting Started

### What You Need

- Docker Desktop installed and running
- Git
- That is it — no Python, no Node.js needed locally

### Clone and Run

```bash
git clone <your-repo-url>
cd peatsense
cp .env.example .env
docker-compose up --build
```

The first build takes about 5 minutes because it installs GDAL, rasterio and the other dependencies. The subsequent run takes about 30 seconds.

### What Starts Up

```
PostgreSQL      → localhost:5432
MLflow          → localhost:5001
Django API      → localhost:8000
Next.js         → localhost:3000
```

### Default Login

```
Username: admin
Password: admin123
```

The admin account is created automatically. Two sample datasets are also seeded — A London satellite image and Irish Garda district boundaries.

### First Thing to Try

1. Open `http://localhost:3000`
2. You will be redirected to the map
3. Log in with admin / admin123
4. Toggle on the London Satellite Image in the sidebar
5. The satellite image appears on the map
6. The Run Analysis panel appears at the bottom of the sidebar
7. Click Run Analysis
8. Wait about 20-30 seconds
9. The land cover prediction appears on the map with a colour legend

---

## Project Structure

```
peatsense/
├── backend/
│   ├── apps/
│   │   ├── datasets/          # dataset
│   │   │   ├── models.py
│   │   │   ├── services.py    # rasterio processing
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── management/commands/seed_data.py
│   │   ├── inference/         # ML pipeline
│   │   │   ├── models.py
│   │   │   ├── services.py    # KMeans + MLflow
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── management/commands/register_model.py
│   │   └── users/             # auth
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   └── urls.py
│   ├── utils/
│   │   └── colours.py         # colour scheme system
│   ├── data/                  # sample files and model
│   ├── Dockerfile
│   ├── entrypoint.sh
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── map/page.tsx
│   ├── components/
│   │   ├── map/               # Leaflet components
│   │   ├── sidebar/           # dataset list + inference panel
│   │   ├── legend/            # colour legend
│   │   └── ui/                # navbar + upload modal
│   ├── hooks/                 # useAuth, useDatasets, useInference, useMapLayers
│   ├── services/api.ts        # all API calls in one place
│   ├── types/index.ts         # TypeScript interfaces
│   └── Dockerfile
├── mlflow/
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## API Reference

All endpoints are prefixed with `/api/`.

### Auth

| Method | Endpoint | Protected | What it does |
|--------|----------|-----------|--------------|
| POST | /api/auth/token/ | No | Login. Returns access + refresh tokens |
| POST | /api/auth/token/refresh/ | No | Exchange refresh token for new access token |
| POST | /api/auth/register/ | No | Create a new account |
| GET | /api/auth/me/ | Yes | Returns the logged in user's details |

**Login request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Login response:**
```json
{
  "access": "eyJhbGci...",
  "refresh": "eyJhbGci..."
}
```

Include the access token in every protected request:
```
Authorization: Bearer eyJhbGci...
```

---

### Datasets

| Method | Endpoint | Protected | What it does |
|--------|----------|-----------|--------------|
| GET | /api/datasets/ | No | List datasets visible to the current user |
| GET | /api/datasets/{id}/ | No | Full metadata for one dataset |
| GET | /api/datasets/{id}/raster/ | No | The raster as a PNG with bounds in response headers |
| GET | /api/datasets/{id}/vector/ | No | The vector data as GeoJSON |
| POST | /api/datasets/upload/ | Yes | Upload a new dataset |
| PATCH | /api/datasets/{id}/update/ | Yes | Update name or description |
| DELETE | /api/datasets/{id}/delete/ | Yes | Delete a dataset |
| PATCH | /api/datasets/{id}/visibility/ | Yes | Toggle public/private |

**What the raster endpoint returns:**

The PNG is in the response body. The geographic bounds are in custom response headers:

```
X-Bounds-West: -0.482
X-Bounds-South: 51.259
X-Bounds-East: 0.409
X-Bounds-North: 51.730
```

The frontend reads these headers to pin the image at the correct location on the map.

**Dataset visibility:**

Datasets are private by default. Only the uploader and admins can see them.

```
Not logged in  → public datasets only
Regular user   → public datasets + own uploads
Admin          → everything
```

---

### Inference

| Method | Endpoint | Protected | What it does |
|--------|----------|-----------|--------------|
| POST | /api/inference/run/ | Yes | Run KMeans on a raster dataset |
| GET | /api/inference/{id}/result/ | No | Get the result of a completed job |
| GET | /api/inference/jobs/ | Yes | List your inference history |
| GET | /api/inference/colour-schemes/ | No | List available colour schemes |

**Run inference request:**
```json
{
  "dataset_id": 1,
  "n_clusters": 8,
  "colour_scheme": "terrain"
}
```

**Run inference response:**
```json
{
  "id": 1,
  "status": "completed",
  "result_image_url": "/media/inference_results/result_job_1.png",
  "result_bounds": {
    "west": -0.482,
    "south": 51.259,
    "east": 0.409,
    "north": 51.730
  },
  "colour_legend": {
    "0": {"hex": "#4a7c59", "rgb": [74, 124, 89], "label": "Cluster 0"},
    "1": {"hex": "#8b6914", "rgb": [139, 105, 20], "label": "Cluster 1"}
  },
  "mlflow_run_id": "469529ba861b4ec0..."
}
```

**Available colour schemes:**

| Scheme | Description |
|--------|-------------|
| default | High contrast colours, good for general use |
| terrain | Earth tones — greens, browns, tans. Intuitive for land cover |
| spectral | Rainbow from red to purple. Good for presentations |
| monochrome | Shades of grey. Good for printing |

---

## Environment Variables

Copy `.env.example` to `.env` before running. The defaults work out of the box for local development.

```
SECRET_KEY          Django secret key
DEBUG               True for development
DB_NAME             peatsense
DB_USER             peatsense
DB_PASSWORD         peatsense123
DB_HOST             db
DB_PORT             5432
MLFLOW_TRACKING_URI http://mlflow:5000
DJANGO_SUPERUSER_USERNAME  admin
DJANGO_SUPERUSER_PASSWORD  admin123
DJANGO_SUPERUSER_EMAIL     admin@peatsense.com
```

---

## Design Decisions

---

### Backend

**Why split into three apps (datasets, inference, users)?**

Each app has a single responsibility. The datasets app knows nothing about inference. The inference app knows nothing about authentication. The users app knows nothing about rasters. This means you can change how inference works without touching dataset code and vice versa. It also makes the codebase easier to navigate, if something is wrong with an upload, you go to the datasets app. If something is wrong with a prediction, you go to inference.

**Why a service layer?**

The views handle HTTP — they validate input, call the right service and return a response. The services handle business logic — they open files, run models, generate images. Mixing these two concerns is what makes code hard to maintain. A view that does rasterio reprojection and HTTP response formatting at the same time becomes impossible to test and reason about. Keeping them separate means the inference service can be called from a management command, a Celery task or a view — the logic does not change.

**Why MLflow?**

The research notebook had no record of what was run. You could run the same analysis twice with different settings and have no way to compare them. MLflow gives every inference run a unique ID and logs the parameters, metrics and output artifact. Six months later you can open the MLflow dashboard and see exactly what was run, with what settings, how long it took and what the result looked like. This is basic scientific reproducibility applied to ML.

**Why synchronous inference?**

Adding Celery and Redis — which is what you would use for proper async processing — means two more Docker containers, a task queue configuration, and a polling mechanism in the frontend. For the sample data provided, inference takes 20-30 seconds which is acceptable. The InferenceJob model already has all the status fields needed (pending, running, completed, failed) so moving to async later is a straightforward change — you wrap the service call in a Celery task and the rest stays the same.

**Why not a custom User model?**

Django's built-in User model covers everything we need — username, password (properly hashed), email, is_staff flag. Writing a custom User model from scratch to replicate this would be wasted effort and would introduce bugs. The rule in Django is to always use a custom User model if you think you might need one later, but since our only extension was role-based access — and is_staff already handles that — the built-in model is the right choice.

**Why pre-process the raster on upload?**

The original approach re-ran the full rasterio reprojection and PNG conversion on every single request for the raster layer. For a file with 30 million pixels this takes several seconds every time. Now we do it once when the dataset is uploaded, save the PNG to disk, and serve it directly on subsequent requests. The response time drops from several seconds to milliseconds. We also reuse the same PNG for inference — instead of reopening and reprocessing the GeoTIFF, PIL reads the PNG directly.

**Why are datasets private by default?**

Users might upload experimental or sensitive data they are not ready to share. Making datasets private by default means they have to consciously make something public — rather than accidentally exposing data. Admins control what becomes publicly visible, which is appropriate for a scientific platform where data quality matters.

---

### Frontend

**Why Next.js instead of plain React?**

The assignment specified Next.js. Beyond that, Next.js gives us file-based routing (no routing configuration needed), server-side rendering for fast initial page loads, and the rewrite proxy feature which elegantly solves the CORS problem without any backend changes.

**Why are all API calls in one file (services/api.ts)?**

If ten components each write their own `axios.get('/api/datasets/')`, you have ten places to update when the URL changes, ten places where token injection needs to work, and ten different approaches to error handling. One central API file means one place to change. The Axios interceptors — which automatically inject the JWT token into every request and silently refresh it when it expires — are configured once and apply everywhere. No component ever thinks about authentication.

**Why store the refresh token in localStorage?**

The access token lives in memory — it disappears on page refresh, which is secure. The refresh token lives in localStorage — it survives page refresh, which gives users persistent login. When the page loads, if there is a refresh token in localStorage, we silently exchange it for a new access token before the user sees anything. From the user's perspective they are always logged in until they click Logout. The security trade-off is that localStorage is accessible by JavaScript, so an XSS attack could steal the refresh token. For a scientific tool this risk is acceptable. The production improvement would be storing the refresh token in an httpOnly cookie that JavaScript cannot access at all.

**Why React 18 and not React 19?**

react-leaflet v5 requires React 19. react-leaflet v4 works with React 18. React 19 was very new at the time of development and the ecosystem was still catching up. react-leaflet v4 with React 18 is stable, well-tested and widely used in production. We use react-leaflet@4.2.1.

**Why custom hooks for state management?**

The map page needs dataset data, layer toggle state and inference state all at the same time. Putting all of this directly in the page component would make it enormous and hard to follow. Custom hooks (useDatasets, useMapLayers, useInference, useAuth) each manage one concern and are tested and changed independently. The page component just calls the hooks and passes the results to the right components as props.

**Why does the upload bypass the Next.js proxy?**

Next.js has a 10MB limit on request bodies it proxies. Our raster files can be much larger than that. Rather than complex workarounds, uploads go directly to the Django backend at `localhost:8000`. This works because Django has CORS configured to allow requests from `localhost:3000` in development. All other API calls still go through the Next.js proxy.

---

## Improvements Over the Research Notebook

The original notebook had several issues that this implementation addresses:

The notebook hardcoded exactly 8 colours. If you changed `n_clusters` to anything other than 8 the colours were either unused or the code crashed. Our colour system generates exactly the right number of colours for whatever cluster count the user picks — 2 through 20 — with four different named palettes to choose from.

The notebook had no record of what was run. Same analysis, different settings, no way to compare. MLflow now logs every run with its parameters, processing time, pixel count, and output image.

The notebook was a script you ran once. This is an API that any client can call, with authentication, dataset management, and result persistence.

---

## Known Limitations

File uploads are limited to 200MB. For larger rasters, the system would need tile-based processing (using rasterio's windowed reading to process 512×512 pixel chunks at a time) combined with Celery for background processing to avoid HTTP timeouts.

Inference runs synchronously. For large files this means the HTTP request stays open for the full duration. The job pattern is already in place for async migration — the InferenceJob model has all the necessary status fields.

The refresh token is stored in localStorage. For a financial or healthcare application this would need to be an httpOnly cookie set by the server. For a scientific tool this is an acceptable trade-off.

Raster files are reprojected from their native CRS to WGS84 for display. This is the right approach for web mapping but means inference runs on the reprojected pixel values rather than the original. For most use cases this makes no practical difference.

There is no progress indicator during inference. The user sees "Analysing..." for up to 30 seconds with no indication of how far along processing is.

---

## Future Improvements

Tile-based raster processing using rasterio's windowed reading — keeps memory constant regardless of file size, could process files of any size on modest hardware.

Celery + Redis for async inference — returns immediately with a job ID, frontend polls for status, no timeout issues, multiple users can run inference simultaneously.

httpOnly cookie for the refresh token — eliminates the XSS risk of localStorage storage entirely.

MapTiler base map — the current OpenStreetMap tiles work well but MapTiler's vector tiles are faster and can be styled to match the application's green colour scheme.

Named cluster labels — scientists should be able to rename "Cluster 0" to "Active Bog" or "Degraded Peatland". The colour legend structure already supports this, it just needs a UI and a database field.

PostGIS for vector storage — currently GeoJSON files are stored on disk and served as static files. Storing geometries in PostGIS would enable spatial queries like "which datasets overlap this bounding box" or "find all datasets within 50km of this point".

Model retraining pipeline — upload new training data, retrain KMeans, register as a new MLflow version, switch the active version. Currently the model is fixed.

---

## Running Tests

The backend can be tested with curl or any HTTP client. Make sure Docker is running first.

```bash
# Get all datasets (public)
curl http://localhost:8000/api/datasets/

# Login
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Run inference (replace TOKEN with your access token)
curl -X POST http://localhost:8000/api/inference/run/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"dataset_id": 1, "n_clusters": 8, "colour_scheme": "terrain"}'
```

The MLflow dashboard shows all inference runs at `http://localhost:5001`.

The Django admin panel is at `http://localhost:8000/admin/` — log in with admin / admin123 to see all database records directly.
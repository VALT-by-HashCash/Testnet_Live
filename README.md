# Breadcrumbs - TestNet Vue Frontend

Pay users for their data - TestNet frontend with email verification system

## Tech Stack

**Frontend:** Vue 3 + Vite  
**Client (Legacy):** React  
**Server:** Django + PostgreSQL

---

## 🆕 TestNet Vue Frontend

This branch includes a complete Vue 3 frontend for TestNet with email verification.

### Features
- ✅ Email-based testnet access with OTP verification
- ✅ Temporary profile creation without user accounts
- ✅ Vue 3 + Vite for fast development
- ✅ Responsive Tailwind CSS styling
- ✅ Environment-based API configuration

### Active Components
- **ValtDashboard** - Complete testnet dashboard with email verification
- **LoginForm** - Authentication interface
- **Auth Service Test** - API connectivity testing
- **ComponentShowcase** - Landing page

### Project Structure

```
vue-frontend/
├── index.html                    # Entry point
├── package.json                  # Dependencies
├── vite.config.js               # Build configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── .env.development             # Local API URLs (localhost:8000)
├── .env.production              # Production API URLs (breadcrumbsdata.com)
├── src/
│   ├── main.js                  # App initialization
│   ├── App.vue                  # Root component
│   ├── style.css                # Global styles with Tailwind
│   ├── components/
│   │   ├── ValtDashboard.vue    # Main testnet dashboard (833 lines)
│   │   ├── LoginForm.vue        # Login UI (171 lines)
│   │   └── DebugTest.vue        # Debug utilities
│   ├── views/
│   │   ├── ComponentShowcase.vue # Landing page (271 lines)
│   │   └── Login.vue             # Login view
│   ├── router/
│   │   └── index.js             # Vue Router config (143 lines)
│   ├── services/
│   │   └── api.js               # API client (571 lines)
│   └── stores/
│       └── valt.js              # Pinia state management (298 lines)

server/controllers/
└── profiles.py                   # Email verification endpoints (+166 lines)
    ├── send_testnet_code()      # Sends 6-digit OTP via SendGrid
    ├── verify_testnet_code()    # Validates OTP
    └── check_email_exists()     # Email lookup

HashCashApp/
└── urls.py                       # API routing (+3 lines)
```

### Backend API Endpoints

```python
# Added in server/controllers/profiles.py
POST /api/profiles/send_testnet_code/
POST /api/profiles/verify_testnet_code/
POST /api/profiles/check_email_exists/
```

---

## Run Locally

### Backend (Django + PostgreSQL)

1. Install [Docker](https://www.docker.com/products/docker-desktop)

2. Ensure Docker is running by opening Docker Desktop.

3. Clone repo

```bash
  git clone https://github.com/VALT-by-HashCash/Breadcrumbs
```

4. Go to project directory and run docker compose up

```bash
  cd ./Breadcrumbs
  docker compose up
```

- The Server will try to connect to the db before it's ready on first run. Restart if needed: `docker compose down` then `docker compose up`.

### Vue Frontend (TestNet)

1. Navigate to the vue-frontend directory

```bash
  cd ./Breadcrumbs/vue-frontend
```

2. Install dependencies

```bash
  npm install
```

3. Start the development server

```bash
  npm run dev
```

The Vue app will be available at **http://localhost:3001**

> **Note:** The `.env.development` file is already included and configured to connect to `http://localhost:8000`

### Testing Email Verification

1. Navigate to http://localhost:3001/valt-full
2. Enter your email address
3. Check the Django terminal for the 6-digit OTP code (development mode)
4. Enter the code to verify and access the testnet dashboard

---

## Run Locally (Legacy React Frontend)

## Documentation

Helpful Docker commands

- list currently running: `docker ps`
- list containers: `docker container ls`
- list images: `docker image ls -a`
- remove: `docker rm <container_name>` or `docker rm <image_name>`
- start bash inside container: `docker exec -it <container_name> bash`
- start bash inside image: `docker run -it <image_name> sh`

### Running Docker with Pdb (Python Debugger)

1. Start docker containers `docker compose up`
2. In a separate terminal, run `docker attach <container_name>`

## Issues

### Docker

- Probably permission related: `database | WARNING: could not open statistics file "pg_stat_tmp/global.stat": Operation not permitted`

## Handy shit

change package.json => scripts => electron:start command to electron_start_(WIN OR MAC) depending on os

bash ./scripts/heroku-seed.sh

bash ./scripts/migrate.sh

Please run

`git update-index --assume-unchanged ./server/constants.py`

to prevent pushing constants to the repo.

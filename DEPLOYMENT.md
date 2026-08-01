# 🚀 Free Deployment Guide (WebSockets + Docker + Redis Supported)

Hosting Django ASGI applications with WebSockets and Redis for free requires platforms that support persistent TCP/WebSocket connections (`wss://`) and Docker containers.

Here are the **top recommended free platforms** and step-by-step instructions to deploy your Omegle clone.

---

## 📊 Platform Comparison Matrix

| Platform | Free Tier | WebSockets (`wss://`) | Free Redis | Docker Support | Best For |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🌟 **Render.com** | **100% Free** | ✅ Yes | ✅ Free Managed Redis | ✅ Yes | **Easiest 1-Click Setup** |
| 🚀 **Fly.io** | Free Allowance | ✅ Yes | ✅ Upstash Redis | ✅ Native Docker | Lowest Latency |
| ⚡ **Koyeb** | Free Service | ✅ Yes | ✅ Redis Add-on | ✅ Yes | Fast Global Edge |
| 🛡️ **Oracle Cloud** | **Always Free** (24GB RAM VM) | ✅ Unlimited | ✅ Self-hosted Docker | ✅ Yes | **Best for Concurrency** |

---

## Option 1: Render.com (Recommended - Easiest Setup)

Render offers a free Web Service tier + free Managed Redis instance out-of-the-box with automatic SSL certificates (`https://` and `wss://`).

### Step 1: Create `render.yaml` (Infrastructure as Code)

In your repository root ([`D:\learning\Omegle`](file:///D:/learning/Omegle)), create a `render.yaml` file:

```yaml
services:
  # 1. Django ASGI Backend Web Service
  - type: web
    name: omegle-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
    envVars:
      - key: REDIS_HOST
        fromService:
          type: redis
          name: omegle-redis
          property: host
      - key: REDIS_PORT
        fromService:
          type: redis
          name: omegle-redis
          property: port
      - key: DEBUG
        value: "False"
      - key: SECRET_KEY
        generateValue: true

  # 2. React Frontend Web Service
  - type: web
    name: omegle-frontend
    env: docker
    dockerfilePath: ./frontend/Dockerfile

  # 3. Free Managed Redis Instance
  - type: redis
    name: omegle-redis
    ipAllowList: [] # Internal network access only
```

### Step 2: Deploy to Render
1. Push your code to **GitHub** or **GitLab**.
2. Go to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository. Render will automatically build & deploy the backend, frontend, and Redis!

---

## Option 2: Fly.io (Fast & Low Latency)

Fly.io runs Docker containers close to your users on global edge nodes with native WebSocket support.

### Step 1: Install Fly CLI & Login
```bash
# Windows PowerShell
iwr https://fly.io/install.ps1 -useb | iex
fly auth login
```

### Step 2: Create Upstash Redis
```bash
fly redis create
# Choose name: omegle-redis (Note down the Redis URL and Host)
```

### Step 3: Deploy Backend & Frontend
```bash
cd backend
fly launch --name omegle-backend
fly set secrets REDIS_HOST=<your-redis-host> REDIS_PORT=6379 SECRET_KEY=<random-key>
fly deploy

cd ../frontend
fly launch --name omegle-frontend
fly deploy
```

---

## Option 3: Oracle Cloud Always Free (Best for High Concurrency)

If you expect **thousands of concurrent users**, Oracle Cloud offers an **Always Free ARM Instance** with:
- **4 OCPU Cores (Ampere Altra)**
- **24 GB RAM**
- **200 GB Storage**
- **10 TB free monthly bandwidth**

### Steps:
1. Create a free account at [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. Launch a free Ampere Ubuntu VM.
3. Install Docker & Git:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose git
   ```
4. Clone your repository and run:
   ```bash
   git clone <your-repo-url> omegle
   cd omegle
   sudo docker-compose up --build -d
   ```
5. Open HTTP/HTTPS ports (`80`, `443`) in Oracle Cloud Security Rules. You now have a full, high-speed Omegle server running for **$0/month forever**!

---

## 🔒 Important Note on WebSockets & SSL (`wss://`)

When deploying on production domains with HTTPS (`https://`):
- Modern browsers **block plain `ws://` connections** from secure pages (`https://`).
- Use **`wss://`** (WebSocket Secure).
- **Render**, **Fly.io**, and **Nginx with Let's Encrypt** automatically handle SSL certificates and terminate `wss://` into your Django Channels ASGI backend seamlessly.

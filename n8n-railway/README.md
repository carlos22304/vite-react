# n8n on Railway

This repo deploys n8n to Railway using the official Docker image.

---

## Setup

1. **Export workflows from local n8n**
   - In your local n8n: **Settings → Export → Download all workflows**
   - Place the JSONs into `/workflows/`
   - Do NOT export credentials with secrets. Recreate them later in Railway.

2. **Local run (optional)**
   ```bash
   docker build -t n8n-railway .
   docker run -it --rm -p 5678:5678 \
     -e N8N_PORT=5678 -e GENERIC_TIMEZONE=America/New_York n8n-railway

### Documentation Vision - Web UI

This project has been converted from a CLI tool to a Next.js web application.

#### Features
- Web-based UI for processing videos.
- File picker for video input.
- Server-side output directory configuration.
- Real-time preview of generated documentation.
- Debug mode toggle.

#### Running the Application Locally

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up environment variables:**
    Create a `.env` file in the root directory and add your API keys:
    ```env
    MISTRAL_API_KEY=your_mistral_api_key
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Running with Docker

You can easily run this application inside a Docker container.

1.  **Build the Docker image:**
    ```bash
    docker build -t documentation-vision .
    ```

2.  **Run the container:**
    ```bash
    docker run -p 3000:3000 --env-file .env documentation-vision
    ```

#### Dockerfile Details

The `Dockerfile` uses a multi-stage build to keep the final image size small and includes `ffmpeg` which is required for video processing.

```dockerfile
# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-slim
WORKDIR /app

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
```

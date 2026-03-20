<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/bd64f61e-bdd6-483d-81e4-fbd8a896db13

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run with Docker

You can run the application in a Docker container using the provided `Dockerfile` and `docker-compose.yml`.

1. Ensure you have Docker installed.
2. Set the `GEMINI_API_KEY` in `.env.local`.
3. Build and run the container:
   ```bash
   docker-compose up --build
   ```
4. Access the application at `http://localhost:8080`.

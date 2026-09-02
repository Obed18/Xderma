# XDerma AI Backend Integration

## Backend

From the classifier project:

```powershell
cd "C:\Users\IN JESUS IS LIFE\Downloads\XDERMA PROJECT\xderma\HAM10000-Skin-Lesion-Classifier-main"
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

Create or edit the backend-only env file:

```powershell
notepad .env
```

The API loads `models/efficientnet_inference.pth` at startup and exposes:

- `GET /health`
- `GET /classes`
- `POST /predict`
- `POST /predict/batch`
- `POST /chat`

Open `http://127.0.0.1:8000/docs` to test the upload endpoint.

For hosted chat responses, set these server-side environment variables in `HAM10000-Skin-Lesion-Classifier-main/.env` before starting `uvicorn`:

```env
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_REFERER=http://localhost:8000
OPENROUTER_TITLE=XDerma
```

If `OPENROUTER_API_KEY` is not set, `/chat` uses a local development fallback response.

## Mobile App

Set the Expo public API URL in `.env`:

```env
EXPO_PUBLIC_XDERMA_AI_API_URL=http://127.0.0.1:8000
```

Use the correct host for your runtime:

- iOS simulator or web: `http://127.0.0.1:8000`
- Android emulator: `http://10.0.2.2:8000`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:8000`

cd "C:\Users\IN JESUS IS LIFE\Downloads\XDERMA PROJECT\xderma\HAM10000-Skin-Lesion-Classifier-main"
.\.venv\Scripts\python.exe -m uvicorn api.main:app --host 0.0.0.0 --port 8000

Then start Expo:

```powershell
cd "C:\Users\IN JESUS IS LIFE\Downloads\XDERMA PROJECT\xderma"
npm run start:online
```
cd "C:\Users\IN JESUS IS LIFE\Downloads\XDERMA PROJECT\xderma\HAM10000-Skin-Lesion-Classifier-main"

.\.venv\Scripts\Activate.ps1

uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

If you need a tunnel directly, skip Expo's online dependency validation check:

```powershell
$env:EXPO_NO_DEPENDENCY_VALIDATION="1"
npx.cmd expo start --clear --tunnel
```

Restart Expo after changing `.env`.

Adding a Specialist

Invoke-RestMethod -Method Post `
  -Uri "https://thkkdsjvaoficunylgkc.supabase.co/functions/v1/create-specialist-telegram-link" `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer sb_publishable_pR2EXPhYcGHsq0wmWss6bA_Gbz87xrH"
    "apikey" = "sb_publishable_pR2EXPhYcGHsq0wmWss6bA_Gbz87xrH"
  } `
  -Body (@{ specialist_name = "Dr. Obed Otu Ayor" } | ConvertTo-Json)

## Telegram Specialist Chat

Deploy the Telegram Edge Functions:

```powershell
cd "C:\Users\IN JESUS IS LIFE\Downloads\XDERMA PROJECT\xderma"
npx.cmd supabase functions deploy create-specialist-telegram-link --project-ref thkkdsjvaoficunylgkc
npx.cmd supabase functions deploy send-specialist-telegram-message --project-ref thkkdsjvaoficunylgkc
npx.cmd supabase functions deploy telegram-webhook --project-ref thkkdsjvaoficunylgkc
npx.cmd supabase functions deploy configure-telegram-webhook --project-ref thkkdsjvaoficunylgkc
```

Required Supabase Edge Function secrets:

```powershell
npx.cmd supabase secrets set TELEGRAM_BOT_TOKEN="your-telegram-bot-token" --project-ref thkkdsjvaoficunylgkc
npx.cmd supabase secrets set TELEGRAM_BOT_USERNAME="xdermaspecialist_bot" --project-ref thkkdsjvaoficunylgkc
```

After deploying `telegram-webhook`, tell Telegram where to send bot updates:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://thkkdsjvaoficunylgkc.supabase.co/functions/v1/configure-telegram-webhook" `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer sb_publishable_pR2EXPhYcGHsq0wmWss6bA_Gbz87xrH"
    "apikey" = "sb_publishable_pR2EXPhYcGHsq0wmWss6bA_Gbz87xrH"
  } `
  -Body (@{ action = "set" } | ConvertTo-Json)
```

Check the current Telegram webhook:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://thkkdsjvaoficunylgkc.supabase.co/functions/v1/configure-telegram-webhook" `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer sb_publishable_pR2EXPhYcGHsq0wmWss6bA_Gbz87xrH"
    "apikey" = "sb_publishable_pR2EXPhYcGHsq0wmWss6bA_Gbz87xrH"
  } `
  -Body (@{ action = "info" } | ConvertTo-Json)
```

If a specialist pressed Start before the webhook was configured, Telegram will not necessarily replay that click. Ask them to open the generated link again or send the command manually in the bot chat:

```text
/start xd_your_connection_code
```
  
## Data Flow

1. User captures or selects a lesion image in `SkinAnalysisScreen`.
2. The app validates type and size, then runs the local quality gate.
3. `src/services/skinAnalysisApi.ts` uploads the image as multipart form data to `/predict`.
4. FastAPI preprocesses the image and runs EfficientNet-B0 inference.
5. The app navigates to `ResultsScreen` with the prediction payload.
6. `AnalysisCard` displays the image, prediction, confidence, probabilities, risk level, recommendation, and clinical advisory.
7. `AiChatScreen` posts user questions to `/chat`; the backend adds safety instructions and optional latest-scan context before calling the hosted chat provider.

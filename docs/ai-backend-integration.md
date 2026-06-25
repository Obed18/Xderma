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

The API loads `models/efficientnet_inference.pth` at startup and exposes:

- `GET /health`
- `GET /classes`
- `POST /predict`
- `POST /predict/batch`

Open `http://127.0.0.1:8000/docs` to test the upload endpoint.

## Mobile App

Set the Expo public API URL in `.env`:

```env
EXPO_PUBLIC_XDERMA_AI_API_URL=http://127.0.0.1:8000
```

Use the correct host for your runtime:

- iOS simulator or web: `http://127.0.0.1:8000`
- Android emulator: `http://10.0.2.2:8000`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:8000`

Then start Expo:

```powershell
cd "C:\Users\IN JESUS IS LIFE\Downloads\XDERMA PROJECT\xderma"
npm run start:online
```

Restart Expo after changing `.env`.

## Data Flow

1. User captures or selects a lesion image in `SkinAnalysisScreen`.
2. The app validates type and size, then runs the local quality gate.
3. `src/services/skinAnalysisApi.ts` uploads the image as multipart form data to `/predict`.
4. FastAPI preprocesses the image and runs EfficientNet-B0 inference.
5. The app navigates to `ResultsScreen` with the prediction payload.
6. `AnalysisCard` displays the image, prediction, confidence, probabilities, risk level, recommendation, and clinical advisory.




import io
import json
import os
import secrets
import time
import logging
import base64
import asyncio
import urllib.error
import urllib.request
from collections import defaultdict, deque
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms
import torchvision.models as models
import torch.nn as nn
import numpy as np
from dotenv import load_dotenv

from pathlib import Path
from PIL import Image
from typing import List, Optional

from fastapi import Depends, FastAPI, File, Request, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from contextlib import asynccontextmanager

# ── Logging 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Constants 
BASE_DIR    = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / ".env.production")

MODEL_PATH  = BASE_DIR / "models" / "efficientnet_inference.pth"
IMG_SIZE    = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]
MAX_FILE_SIZE = 10 * 1024 * 1024          # 10 MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/bmp"}
MAX_BATCH     = 10


def get_optional_secret(name: str) -> Optional[str]:
    value = os.getenv(name)
    if not value:
        return None

    stripped = value.strip()
    if not stripped or stripped.startswith("replace-with-"):
        return None

    return stripped


API_KEY = os.getenv("XDERMA_API_KEY") or os.getenv("API_KEY")
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_EXEMPT_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}
OPENROUTER_API_KEY = get_optional_secret("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
OPENROUTER_REFERER = os.getenv("OPENROUTER_REFERER", "https://xderma.local")
OPENROUTER_TITLE = os.getenv("OPENROUTER_TITLE", "XDerma")
OPENROUTER_TIMEOUT_SECONDS = int(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "30"))

CLASS_DESCRIPTIONS = {
    "akiec": {
        "full_name"   : "Actinic Keratosis / Intraepithelial Carcinoma",
        "description" : "A rough, scaly patch caused by years of sun exposure.",
        "malignant"   : True,
    },
    "bcc": {
        "full_name"   : "Basal Cell Carcinoma",
        "description" : "The most common type of skin cancer, rarely spreads.",
        "malignant"   : True,
    },
    "bkl": {
        "full_name"   : "Benign Keratosis",
        "description" : "Non-cancerous skin growths including seborrheic keratoses.",
        "malignant"   : False,
    },
    "df": {
        "full_name"   : "Dermatofibroma",
        "description" : "A benign skin growth that often appears on the legs.",
        "malignant"   : False,
    },
    "mel": {
        "full_name"   : "Melanoma",
        "description" : "A serious form of skin cancer that develops from melanocytes.",
        "malignant"   : True,
    },
    "nv": {
        "full_name"   : "Melanocytic Nevi",
        "description" : "Common moles. Usually benign growths of melanocytes.",
        "malignant"   : False,
    },
    "vasc": {
        "full_name"   : "Vascular Lesions",
        "description" : "Includes angiomas, angiokeratomas, and pyogenic granulomas.",
        "malignant"   : False,
    },
}

# ── Global model state (populated at startup) 
app_state: dict = {}


# ── Model builder 
def build_efficientnet(num_classes: int) -> nn.Module:
    """Recreate the same architecture used in training."""
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.4, inplace=True),
        nn.Linear(in_features, 512),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.3),
        nn.Linear(512, num_classes),
    )
    return model


# ── Lifespan: load model once at startup 
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model weights and metadata on startup, clean up on shutdown."""
    logger.info(" Starting HAM10000 Classifier API...")

    if not MODEL_PATH.exists():
        logger.error(f" Model file not found: {MODEL_PATH}")
        raise RuntimeError(
            f"Model file not found at {MODEL_PATH}. "
            "Run Notebook 2 first to generate the model file."
        )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f" Using device: {device}")

    # Load checkpoint
    checkpoint = torch.load(MODEL_PATH, map_location=device, weights_only=False)

    # Build model and load weights
    num_classes = checkpoint["num_classes"]
    model       = build_efficientnet(num_classes)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    # Image transform
    transform = transforms.Compose([
        transforms.Resize((checkpoint["img_size"], checkpoint["img_size"])),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=checkpoint["imagenet_mean"],
            std=checkpoint["imagenet_std"]
        ),
    ])


    raw_idx_to_class = checkpoint["idx_to_class"]
    idx_to_class_normalized = {str(k): v for k, v in raw_idx_to_class.items()}

    app_state["model"]        = model
    app_state["device"]       = device
    app_state["transform"]    = transform
    app_state["idx_to_class"] = idx_to_class_normalized
    app_state["num_classes"]  = num_classes
    app_state["startup_time"] = time.time()

    logger.info(f" Model loaded — {num_classes} classes")
    logger.info(f"   Test Accuracy : {checkpoint.get('test_accuracy', 'N/A')}")
    logger.info(f"   Test Macro F1 : {checkpoint.get('test_macro_f1',  'N/A')}")
    logger.info(f"   Test ROC-AUC  : {checkpoint.get('test_roc_auc',   'N/A')}")

    yield  # ← app runs here

    logger.info(" Shutting down API...")
    app_state.clear()


# ── FastAPI app 
app = FastAPI(
    title       = "HAM10000 Skin Lesion Classifier",
    description = (
        "EfficientNet-B0 model trained on the HAM10000 dataset.\n\n"
        "Classifies dermoscopy images into 7 skin lesion categories.\n\n"
        "**This is a research tool — not a medical diagnostic device.**"
    ),
    version     = "1.0.0",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "Accept"],
    allow_credentials=False,
)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
rate_limit_store: defaultdict[str, deque[float]] = defaultdict(deque)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Basic per-client IP fixed-window limiter for single-container deployments."""
    if request.url.path in RATE_LIMIT_EXEMPT_PATHS:
        return await call_next(request)

    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = (
        forwarded_for.split(",")[0].strip()
        if forwarded_for
        else request.client.host if request.client else "unknown"
    )

    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    requests = rate_limit_store[client_ip]

    while requests and requests[0] <= window_start:
        requests.popleft()

    if len(requests) >= RATE_LIMIT_REQUESTS:
        retry_after = max(1, int(RATE_LIMIT_WINDOW_SECONDS - (now - requests[0])))
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."},
            headers={"Retry-After": str(retry_after)},
        )

    requests.append(now)
    return await call_next(request)


async def require_api_key(x_api_key: Optional[str] = Depends(api_key_header)) -> None:
    """Require X-API-Key when XDERMA_API_KEY/API_KEY is configured."""
    if not API_KEY:
        logger.warning("API key authentication is disabled. Set XDERMA_API_KEY in production.")
        return

    if not x_api_key or not secrets.compare_digest(x_api_key, API_KEY):
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


# ── Pydantic response models 
class ClassProbability(BaseModel):
    class_key   : str
    full_name   : str
    probability : float
    percentage  : str


class PredictionResponse(BaseModel):
    filename          : str
    predicted_class   : str
    full_name         : str
    confidence        : float
    confidence_pct    : str
    risk_level        : str
    is_malignant      : bool
    malignant_warning : str
    recommendation    : str
    all_probabilities : List[ClassProbability]
    gradcam_data_url  : Optional[str] = None
    inference_time_ms : float


class BatchPredictionResponse(BaseModel):
    total_images : int
    results      : List[PredictionResponse]
    total_time_ms: float


class HealthResponse(BaseModel):
    status       : str
    model_loaded : bool
    device       : str
    num_classes  : int
    uptime_sec   : float


class ChatHistoryMessage(BaseModel):
    sender    : str
    text      : str


class ChatScanContext(BaseModel):
    condition  : Optional[str] = None
    shortName  : Optional[str] = None
    confidence : Optional[str] = None
    priority   : Optional[str] = None


class ChatRequest(BaseModel):
    message         : str
    conversation_id : Optional[str] = None
    messages        : List[ChatHistoryMessage] = []
    latest_scan     : Optional[ChatScanContext] = None


class ChatResponse(BaseModel):
    message         : str
    model           : str
    provider        : str
    conversation_id : Optional[str] = None


# ── Helpers 
def validate_image_file(file: UploadFile) -> None:
    """Raise HTTPException if file is not a valid image."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid file type '{file.content_type}'. "
                f"Accepted types: {', '.join(ALLOWED_TYPES)}"
            ),
        )


async def read_image(file: UploadFile) -> Image.Image:
    """Read upload bytes and decode as PIL Image."""
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size is {MAX_FILE_SIZE // (1024*1024)} MB."
        )

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image file.")

    return image


def apply_colormap(cam: np.ndarray) -> np.ndarray:
    """Create a lightweight jet-like heatmap without requiring OpenCV."""
    x = np.clip(cam, 0, 1)
    r = np.clip(1.5 - np.abs(4 * x - 3), 0, 1)
    g = np.clip(1.5 - np.abs(4 * x - 2), 0, 1)
    b = np.clip(1.5 - np.abs(4 * x - 1), 0, 1)
    return np.stack([r, g, b], axis=-1)


def build_gradcam_data_url(image: Image.Image, cam: np.ndarray) -> str:
    """Blend Grad-CAM with the uploaded image and return a PNG data URL."""
    heatmap = Image.fromarray((apply_colormap(cam) * 255).astype(np.uint8))
    heatmap = heatmap.resize(image.size, Image.Resampling.BILINEAR).convert("RGBA")

    original = image.convert("RGBA")
    heatmap_array = np.array(heatmap).astype(np.float32)
    original_array = np.array(original).astype(np.float32)

    heatmap_array[..., 3] = 115
    blended = (0.58 * original_array + 0.42 * heatmap_array).clip(0, 255).astype(np.uint8)
    output = Image.fromarray(blended, mode="RGBA")

    buffer = io.BytesIO()
    output.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def run_inference(image: Image.Image, include_gradcam: bool = True) -> tuple:
    """
    Run model inference on a single PIL image.
    Returns (predicted_class_key, confidence, all_probs_dict).
    """
    model     = app_state["model"]
    device    = app_state["device"]
    transform = app_state["transform"]
    idx_to_class = app_state["idx_to_class"]

    # Preprocess
    tensor = transform(image).unsqueeze(0).to(device)
    activations = []
    gradients = []
    forward_handle = None
    backward_handle = None

    if include_gradcam:
        target_layer = model.features[-1]

        def save_activation(_module, _input, output):
            activations.append(output)

        def save_gradient(_module, _grad_input, grad_output):
            gradients.append(grad_output[0])

        forward_handle = target_layer.register_forward_hook(save_activation)
        backward_handle = target_layer.register_full_backward_hook(save_gradient)

    try:
        # Forward pass
        start   = time.perf_counter()
        model.zero_grad(set_to_none=True)
        logits  = model(tensor)
        probs_tensor = F.softmax(logits, dim=1).squeeze()
        pred_idx = int(torch.argmax(probs_tensor).item())

        gradcam_data_url = None
        if include_gradcam:
            score = logits[0, pred_idx]
            score.backward()

            if activations and gradients:
                activation = activations[0].detach()
                gradient = gradients[0].detach()
                weights = gradient.mean(dim=(2, 3), keepdim=True)
                cam = (weights * activation).sum(dim=1).squeeze()
                cam = F.relu(cam)
                cam_min = cam.min()
                cam_max = cam.max()

                if float(cam_max - cam_min) > 1e-8:
                    cam = (cam - cam_min) / (cam_max - cam_min)

                gradcam_data_url = build_gradcam_data_url(
                    image,
                    cam.cpu().numpy()
                )
    finally:
        if forward_handle:
            forward_handle.remove()
        if backward_handle:
            backward_handle.remove()

    elapsed = (time.perf_counter() - start) * 1000   # ms

    probs        = probs_tensor.detach().cpu().numpy()
    pred_key     = idx_to_class[str(pred_idx)]
    confidence   = float(probs[pred_idx])

    all_probs = {
        idx_to_class[str(i)]: float(probs[i])
        for i in range(len(probs))
    }

    return pred_key, confidence, all_probs, elapsed, gradcam_data_url


def build_prediction_response(
    filename : str,
    pred_key : str,
    confidence: float,
    all_probs : dict,
    elapsed_ms: float,
    gradcam_data_url: Optional[str] = None,
) -> PredictionResponse:
    """Assemble the full PredictionResponse object."""
    cls_info    = CLASS_DESCRIPTIONS[pred_key]
    is_malignant = cls_info["malignant"]
    risk_level = "High" if is_malignant and confidence >= 0.7 else "Medium" if is_malignant else "Low"
    if not is_malignant and confidence < 0.65:
        risk_level = "Medium"

    recommendation = (
        "Book a dermatologist review as soon as possible. If the lesion is changing, bleeding, painful, or rapidly growing, seek urgent medical care."
        if is_malignant else
        "Continue routine skin monitoring, protect the area from sun exposure, and consult a clinician if the lesion changes or symptoms persist."
    )

    sorted_probs = sorted(all_probs.items(), key=lambda x: x[1], reverse=True)

    return PredictionResponse(
        filename        = filename,
        predicted_class = pred_key,
        full_name       = cls_info["full_name"],
        confidence      = round(confidence, 6),
        confidence_pct  = f"{confidence * 100:.2f}%",
        risk_level      = risk_level,
        is_malignant    = is_malignant,
        malignant_warning = (
            "Potentially malignant lesion detected. Please consult a dermatologist."
            if is_malignant else
            "Classified as benign. Regular monitoring is still recommended."
        ),
        recommendation  = recommendation,
        all_probabilities=[
            ClassProbability(
                class_key   = k,
                full_name   = CLASS_DESCRIPTIONS[k]["full_name"],
                probability = round(v, 6),
                percentage  = f"{v * 100:.2f}%",
            )
            for k, v in sorted_probs
        ],
        gradcam_data_url=gradcam_data_url,
        inference_time_ms=round(elapsed_ms, 2),
    )


def build_local_chat_response(question: str, latest_scan: Optional[ChatScanContext]) -> str:
    """Development fallback used when no hosted chat provider key is configured."""
    lower_question = question.lower()
    condition = latest_scan.condition if latest_scan and latest_scan.condition else None
    confidence = latest_scan.confidence if latest_scan and latest_scan.confidence else None

    if "melanoma" in lower_question:
        return (
            "Diagnosis Summary\n"
            "Melanoma is a serious skin cancer that can spread if it is not found early.\n\n"
            "Explanation\n"
            "It often begins in pigment-producing cells and may look like a changing mole or new dark spot.\n\n"
            "Common Symptoms\n"
            "- Asymmetry\n"
            "- Irregular border\n"
            "- Uneven color\n"
            "- Growth or change over time\n\n"
            "Recommended Next Steps\n"
            "- Arrange a dermatologist review\n"
            "- Track changes with photos\n"
            "- Seek urgent care for rapid changes"
        )

    if "treatment" in lower_question:
        context_summary = (
            f"Your latest context is {condition} at {confidence} screening confidence."
            if condition and confidence
            else "No scan result was provided for this chat."
        )
        return (
            f"Diagnosis Summary\n{context_summary}\n\n"
            "Explanation\n"
            "Many skin conditions are treatable, especially when they are found early and reviewed by a clinician.\n\n"
            "Common Treatment Options\n"
            "- Surgical removal for selected lesions\n"
            "- Mohs surgery for sensitive areas when appropriate\n"
            "- Topical therapy for selected superficial cases\n"
            "- Light-based therapy in limited cases\n\n"
            "Recommended Next Steps\n"
            "- Book a dermatology appointment\n"
            "- Bring your scan and heatmap\n"
            "- Ask which treatment best fits the lesion location"
        )

    context_summary = (
        f"Your current XDerma context points to {condition} with {confidence} confidence."
        if condition and confidence
        else "No scan result was provided for this chat."
    )

    return (
        f"Diagnosis Summary\n{context_summary}\n\n"
        "Explanation\n"
        "XDerma is a screening aid, not a diagnosis. A dermatologist should confirm the result, especially if the lesion is new, changing, bleeding, painful, or not healing.\n\n"
        "Common Things To Monitor\n"
        "- Size, color, and border changes\n"
        "- Bleeding after minor irritation\n"
        "- Sores that do not heal\n"
        "- New symptoms such as pain or itching\n\n"
        "Recommended Next Steps\n"
        "- Schedule a dermatologist visit\n"
        "- Monitor changes with clear photos\n"
        "- Use daily broad-spectrum sunscreen"
    )


def build_chat_system_prompt(latest_scan: Optional[ChatScanContext]) -> str:
    scan_context = "No scan context was provided."
    if latest_scan:
        scan_context = (
            f"Latest scan: condition={latest_scan.condition or 'unknown'}, "
            f"short_name={latest_scan.shortName or 'unknown'}, "
            f"confidence={latest_scan.confidence or 'unknown'}, "
            f"priority={latest_scan.priority or 'unknown'}."
        )

    return (
        "You are XDerma AI, a careful dermatology education assistant inside a skin screening app. "
        "Give concise, structured answers with headings when useful. "
        "Do not claim to diagnose, prescribe, or replace a clinician. "
        "Encourage dermatology review for concerning, changing, bleeding, painful, or rapidly growing lesions. "
        f"{scan_context}"
    )


def call_openrouter_chat(chat_request: ChatRequest) -> str:
    history = []
    for message in chat_request.messages[-12:]:
        role = "assistant" if message.sender == "ai" else "user"
        if message.text.strip():
            history.append({"role": role, "content": message.text.strip()})

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": build_chat_system_prompt(chat_request.latest_scan)},
            *history,
            {"role": "user", "content": chat_request.message.strip()},
        ],
        "temperature": 0.35,
    }

    request = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": OPENROUTER_REFERER,
            "X-OpenRouter-Title": OPENROUTER_TITLE,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=OPENROUTER_TIMEOUT_SECONDS) as response:
        response_payload = json.loads(response.read().decode("utf-8"))

    content = response_payload["choices"][0]["message"]["content"]
    if not isinstance(content, str) or not content.strip():
        raise ValueError("OpenRouter returned an empty chat response.")

    return content.strip()


# ── Routes 
@app.get("/", tags=["General"], dependencies=[Depends(require_api_key)])
async def root():
    return {
        "message"    : "HAM10000 Skin Lesion Classifier API",
        "version"    : "1.0.0",
        "docs"       : "/docs",
        "health"     : "/health",
        "endpoints"  : {
            "GET  /health"         : "Health check",
            "GET  /classes"        : "List all 7 classes",
            "POST /predict"        : "Single image prediction",
            "POST /predict/batch"  : "Batch prediction (up to 10 images)",
            "POST /chat"           : "Dermatology education chat",
        },
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
async def health():
    """Check if the API and model are healthy."""
    model_loaded = "model" in app_state
    uptime       = time.time() - app_state.get("startup_time", time.time())
    device_str   = str(app_state.get("device", "unknown"))

    return HealthResponse(
        status       = "ok" if model_loaded else "degraded",
        model_loaded = model_loaded,
        device       = device_str,
        num_classes  = app_state.get("num_classes", 0),
        uptime_sec   = round(uptime, 2),
    )


@app.get("/classes", tags=["General"], dependencies=[Depends(require_api_key)])
async def get_classes():
    """Return all 7 skin lesion classes with descriptions."""
    return {
        "num_classes": len(CLASS_DESCRIPTIONS),
        "classes"    : [
            {
                "key"        : key,
                "full_name"  : info["full_name"],
                "description": info["description"],
                "malignant"  : info["malignant"],
            }
            for key, info in CLASS_DESCRIPTIONS.items()
        ],
    }


@app.post(
    "/chat",
    response_model=ChatResponse,
    tags=["Chat"],
    dependencies=[Depends(require_api_key)],
)
async def chat(chat_request: ChatRequest):
    """
    Answer dermatology education questions for the XDerma AI chat screen.

    Configure OPENROUTER_API_KEY on the server for hosted model responses.
    Without a provider key, the endpoint returns a deterministic local fallback for development.
    """
    if not chat_request.message.strip():
        raise HTTPException(status_code=400, detail="Message is required.")

    if not OPENROUTER_API_KEY:
        return ChatResponse(
            message=build_local_chat_response(chat_request.message, chat_request.latest_scan),
            model="local-development-fallback",
            provider="xderma-local",
            conversation_id=chat_request.conversation_id,
        )

    try:
        answer = await asyncio.to_thread(call_openrouter_chat, chat_request)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        logger.error(f"OpenRouter HTTP error: {e.code} {detail}")
        raise HTTPException(status_code=502, detail="The AI chat provider rejected the request.")
    except urllib.error.URLError as e:
        logger.error(f"OpenRouter connection error: {e}")
        raise HTTPException(status_code=502, detail="The AI chat provider is not reachable.")
    except Exception as e:
        logger.error(f"Chat generation error: {e}")
        raise HTTPException(status_code=500, detail="The AI chat response could not be generated.")

    return ChatResponse(
        message=answer,
        model=OPENROUTER_MODEL,
        provider="openrouter",
        conversation_id=chat_request.conversation_id,
    )


@app.post(
    "/predict",
    response_model=PredictionResponse,
    tags=["Prediction"],
    dependencies=[Depends(require_api_key)],
)
async def predict(file: UploadFile = File(..., description="Dermoscopy image (JPG/PNG)")):
    """
    Predict skin lesion class for a single image.

    - **file**: Upload a dermoscopy image (JPG or PNG, max 10 MB)

    Returns the predicted class, confidence score, and probabilities for all 7 classes.
    """
    if "model" not in app_state:
        raise HTTPException(status_code=503, detail="Model not loaded. Try again shortly.")

    validate_image_file(file)
    image = await read_image(file)

    logger.info(f" Predicting: {file.filename}  size={image.size}")

    try:
        pred_key, confidence, all_probs, elapsed_ms, gradcam_data_url = run_inference(
            image,
            include_gradcam=True,
        )
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

    response = build_prediction_response(
        filename   = file.filename or "uploaded_image",
        pred_key   = pred_key,
        confidence = confidence,
        all_probs  = all_probs,
        elapsed_ms = elapsed_ms,
        gradcam_data_url = gradcam_data_url,
    )

    logger.info(
        f"   → {pred_key} ({confidence*100:.1f}%)  "
        f"malignant={response.is_malignant}  "
        f"time={elapsed_ms:.1f}ms"
    )
    return response


@app.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    tags=["Prediction"],
    dependencies=[Depends(require_api_key)],
)
async def predict_batch(
    files: List[UploadFile] = File(..., description=f"Up to {MAX_BATCH} dermoscopy images")
):
    """
    Predict skin lesion class for multiple images at once.

    - **files**: Upload up to 10 dermoscopy images
    - Returns a list of predictions in the same order as input files
    """
    if "model" not in app_state:
        raise HTTPException(status_code=503, detail="Model not loaded. Try again shortly.")

    if len(files) > MAX_BATCH:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Maximum batch size is {MAX_BATCH}."
        )

    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    logger.info(f" Batch prediction: {len(files)} images")

    batch_start = time.perf_counter()
    results     = []

    for file in files:
        validate_image_file(file)
        image = await read_image(file)

        try:
            pred_key, confidence, all_probs, elapsed_ms, _gradcam_data_url = run_inference(
                image,
                include_gradcam=False,
            )
            response = build_prediction_response(
                filename   = file.filename or "uploaded_image",
                pred_key   = pred_key,
                confidence = confidence,
                all_probs  = all_probs,
                elapsed_ms = elapsed_ms,
            )
            results.append(response)
        except Exception as e:
            logger.error(f"Inference error on {file.filename}: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Inference failed for {file.filename}: {str(e)}"
            )

    total_ms = (time.perf_counter() - batch_start) * 1000
    logger.info(f"   Batch done — total time: {total_ms:.1f}ms")

    return BatchPredictionResponse(
        total_images  = len(files),
        results       = results,
        total_time_ms = round(total_ms, 2),
    )

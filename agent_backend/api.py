import os
import uuid
import glob
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from agent.perito_core import PeritoAgent

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="API Agente Perito de Vehículos", version="1.0.0")

# ───────────────────────────────────────────────────────────
# FIX #1: CORS restringido a orígenes conocidos
# ───────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.environ.get(
    "CORS_ORIGINS", "http://localhost:3000,http://localhost:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ───────────────────────────────────────────────────────────
# FIX #3: Límite de tamaño de archivo (20 MB)
# ───────────────────────────────────────────────────────────
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

# Extensiones de imagen permitidas
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Firmas de magic bytes para validación real del tipo de archivo
IMAGE_SIGNATURES = {
    b"\xff\xd8\xff": "jpeg",
    b"\x89PNG\r\n\x1a\n": "png",
    b"RIFF": "webp",  # WebP comienza con RIFF
}

UPLOAD_DIR = Path("/tmp/perito_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

CROPS_DIR = Path("/tmp/vehicle_crops")

# Thread pool para no bloquear el event loop con las llamadas a Ollama/YOLO
executor = ThreadPoolExecutor(max_workers=4)


def _validate_image_magic_bytes(file_bytes: bytes) -> bool:
    """
    FIX #6: Valida que los primeros bytes del archivo correspondan
    a una firma de imagen real (JPEG, PNG o WebP).
    """
    for signature in IMAGE_SIGNATURES:
        if file_bytes[:len(signature)] == signature:
            return True
    return False


def _cleanup_temp_files(file_path: Path) -> None:
    """
    FIX #5: Elimina la imagen subida y los crops generados
    para evitar acumulación de datos sensibles en disco.
    """
    try:
        if file_path.exists():
            os.remove(file_path)
    except OSError:
        logger.warning(f"No se pudo eliminar {file_path}")

    try:
        for crop_file in glob.glob(str(CROPS_DIR / "*.jpg")):
            os.remove(crop_file)
    except OSError:
        logger.warning("Error limpiando crops temporales")


@app.post("/api/analyze")
async def analyze_vehicle_image(file: UploadFile = File(...)):
    """
    Endpoint para subir una imagen y lanzar el peritaje agéntico.
    """
    # ── Validación de Content-Type (primera capa) ──
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo subido no es una imagen válida.")

    # ── FIX #3: Leer contenido y verificar tamaño ──
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Archivo demasiado grande. Máximo permitido: {MAX_FILE_SIZE // (1024*1024)} MB."
        )

    # ── FIX #6: Validar magic bytes reales ──
    if not _validate_image_magic_bytes(contents):
        raise HTTPException(
            status_code=400,
            detail="El archivo no es una imagen válida (verificación de cabecera fallida)."
        )

    # ── FIX #2: Sanitizar nombre de archivo con UUID ──
    original_ext = Path(file.filename).suffix.lower() if file.filename else ""
    if original_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extensión no permitida. Extensiones válidas: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    safe_name = f"{uuid.uuid4().hex}{original_ext}"
    file_path = UPLOAD_DIR / safe_name

    # Guardar imagen
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
    except Exception as e:
        # ── FIX #7: No exponer detalles internos ──
        logger.exception("Error al guardar la imagen en disco")
        raise HTTPException(status_code=500, detail="Error interno del servidor.")

    try:
        # FIX #1: Crear agente por petición (evita race condition en concurrencia)
        # y usar run_in_executor para no bloquear el event loop principal.
        model_name = os.environ.get("OLLAMA_MODEL", "llama3.2-vision")
        local_agent = PeritoAgent(model_name=model_name)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor, 
            local_agent.analyze_vehicle, 
            str(file_path.absolute())
        )

        return {
            "status": "success",
            "message": "Análisis completado",
            "data": result
        }
    except Exception as e:
        # ── FIX #7: Log interno, mensaje genérico al cliente ──
        logger.exception("Error durante el análisis del agente")
        raise HTTPException(status_code=500, detail="Error interno del servidor.")
    finally:
        # ── FIX #5: Limpiar archivos temporales siempre ──
        _cleanup_temp_files(file_path)


@app.post("/api/compare")
async def compare_vehicles_endpoint(
    file_before: UploadFile = File(...),
    file_after: UploadFile = File(...)
):
    """
    Endpoint para subir imagen Antes y Después para detectar fraudes.
    """
    for file in [file_before, file_after]:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Los archivos subidos no son imágenes válidas.")

    contents_before = await file_before.read()
    contents_after = await file_after.read()

    for contents in [contents_before, contents_after]:
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Archivo demasiado grande.")
        if not _validate_image_magic_bytes(contents):
            raise HTTPException(status_code=400, detail="Archivo inválido por firma.")

    ext_b = Path(file_before.filename).suffix.lower() if file_before.filename else ""
    ext_a = Path(file_after.filename).suffix.lower() if file_after.filename else ""
    
    if ext_b not in ALLOWED_EXTENSIONS or ext_a not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Extensión no permitida.")

    path_before = UPLOAD_DIR / f"{uuid.uuid4().hex}{ext_b}"
    path_after = UPLOAD_DIR / f"{uuid.uuid4().hex}{ext_a}"

    try:
        with open(path_before, "wb") as f: f.write(contents_before)
        with open(path_after, "wb") as f: f.write(contents_after)
    except Exception:
        logger.exception("Error al guardar imágenes de comparativa")
        raise HTTPException(status_code=500, detail="Error interno.")

    try:
        model_name = os.environ.get("OLLAMA_MODEL", "llama3.2-vision")
        local_agent = PeritoAgent(model_name=model_name)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor, 
            local_agent.compare_vehicles, 
            str(path_before.absolute()),
            str(path_after.absolute())
        )

        return {
            "status": "success",
            "message": "Análisis comparativo completado",
            "data": result
        }
    except Exception:
        logger.exception("Error durante el análisis comparativo")
        raise HTTPException(status_code=500, detail="Error interno del servidor.")
    finally:
        _cleanup_temp_files(path_before)
        _cleanup_temp_files(path_after)

@app.get("/health")
def health_check():
    return {"status": "ok"}

import os
import cv2
import logging
import uuid
from pathlib import Path
from ultralytics import YOLO

logger = logging.getLogger(__name__)

class YoloExtractor:
    def __init__(self, model_path: str = None):
        """
        Inicializa el extractor cargando el modelo YOLO.
        Detecta si el modelo custom (entrenado) existe y lo usa,
        si no, hace fallback al modelo base yolov8n.pt.
        """
        if model_path is None:
            # Buscar el modelo custom por defecto
            custom_model = "runs/detect/yolov8_car_parts/weights/best.pt"
            if os.path.exists(custom_model):
                model_path = custom_model
                self.is_custom_model = True
                logger.info(f"Cargando modelo YOLO fine-tuneado: {model_path}")
            else:
                model_path = "yolov8n.pt"
                self.is_custom_model = False
                logger.info(f"Cargando modelo YOLO base COCO: {model_path}")
        else:
            self.is_custom_model = "yolov8n.pt" not in model_path

        self.model = YOLO(model_path)
        self.output_dir = Path("/tmp/vehicle_crops")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def extract_vehicle_parts(self, image_path: str) -> dict:
        """
        Si usa modelo custom: Detecta y recorta piezas exactas del coche.
        Si usa modelo base: Corta matemáticamente (grid) la caja del coche.
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"No se encontró la imagen en: {image_path}")

        logger.info(f"Analizando imagen: {image_path}")
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"No se pudo cargar la imagen: {image_path}")

        h_img, w_img = image.shape[:2]
        
        # Inferencia pasando el array de OpenCV directamente a YOLO
        results = self.model(image, verbose=False)[0]
        
        extracted_parts = {}
        
        if len(results.boxes) == 0:
            logger.info("No se detectaron objetos.")
            return extracted_parts

        if self.is_custom_model:
            # 1A. Extracción directa basada en piezas detectadas por YOLO fine-tuneado
            for box in results.boxes:
                cls_id = int(box.cls[0].item())
                class_name = self.model.names[cls_id]
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                
                # Añadir un pequeño padding a la pieza
                pad_x = (x2 - x1) * 0.10
                pad_y = (y2 - y1) * 0.10
                crop_x1 = max(0, int(x1 - pad_x))
                crop_y1 = max(0, int(y1 - pad_y))
                crop_x2 = min(w_img, int(x2 + pad_x))
                crop_y2 = min(h_img, int(y2 + pad_y))
                
                crop = image[crop_y1:crop_y2, crop_x1:crop_x2]
                if crop.size == 0:
                    continue
                
                crop_filename = f"coche_pieza_{class_name}_{uuid.uuid4().hex[:6]}.jpg"
                crop_path = self.output_dir / crop_filename
                cv2.imwrite(str(crop_path), crop)
                
                key = f"pieza_{class_name}"
                box_norm = [
                    crop_x1 / w_img,
                    crop_y1 / h_img,
                    crop_x2 / w_img,
                    crop_y2 / h_img
                ]
                if key not in extracted_parts:
                    extracted_parts[key] = []
                extracted_parts[key].append({
                    "path": str(crop_path.absolute()),
                    "box_norm": box_norm
                })
                logger.info(f"Guardando recorte de pieza detectada: {key}")
            
            return extracted_parts

        else:
            # 1B. Fallback al troceado geométrico si usamos el modelo genérico
            vehicle_classes = ['car', 'truck', 'bus', 'motorcycle']
            main_vehicle_box = None
            max_area = 0

            for box in results.boxes:
                cls_id = int(box.cls[0].item())
                class_name = self.model.names[cls_id]
                if class_name in vehicle_classes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    area = (x2 - x1) * (y2 - y1)
                    if area > max_area:
                        max_area = area
                        main_vehicle_box = (x1, y1, x2, y2)

            if not main_vehicle_box:
                logger.info("No se encontró ningún vehículo principal.")
                return extracted_parts

            main_x1, main_y1, main_x2, main_y2 = main_vehicle_box
            logger.info(f"Vehículo principal identificado con área {max_area:.0f}")

            w = main_x2 - main_x1
            h = main_y2 - main_y1

            col_w = w / 3.0
            row_h = h / 2.0

            grid_names = [
                ("superior_izquierdo", 0, 0),
                ("superior_centro", 1, 0),
                ("superior_derecho", 2, 0),
                ("inferior_izquierdo", 0, 1),
                ("inferior_centro", 1, 1),
                ("inferior_derecho", 2, 1)
            ]

            for region_name, col_idx, row_idx in grid_names:
                gx1 = main_x1 + (col_idx * col_w)
                gy1 = main_y1 + (row_idx * row_h)
                gx2 = gx1 + col_w
                gy2 = gy1 + row_h

                pad_x = col_w * 0.10
                pad_y = row_h * 0.10

                crop_x1 = max(0, int(gx1 - pad_x))
                crop_y1 = max(0, int(gy1 - pad_y))
                crop_x2 = min(w_img, int(gx2 + pad_x))
                crop_y2 = min(h_img, int(gy2 + pad_y))

                crop = image[crop_y1:crop_y2, crop_x1:crop_x2]
                if crop.size == 0:
                    continue

                crop_filename = f"coche_{region_name}.jpg"
                crop_path = self.output_dir / crop_filename
                cv2.imwrite(str(crop_path), crop)
                
                key = f"cuadrante_{region_name}"
                box_norm = [
                    crop_x1 / w_img,
                    crop_y1 / h_img,
                    crop_x2 / w_img,
                    crop_y2 / h_img
                ]
                if key not in extracted_parts:
                    extracted_parts[key] = []
                extracted_parts[key].append({
                    "path": str(crop_path.absolute()),
                    "box_norm": box_norm
                })
                logger.info(f"Guardando recorte geométrico: {key}")

            return extracted_parts

# Patrón Singleton para evitar recargar el modelo en cada llamada
_yolo_instance = None

def get_yolo_extractor() -> YoloExtractor:
    global _yolo_instance
    custom_model_path = "runs/detect/yolov8_car_parts/weights/best.pt"
    
    if _yolo_instance is None:
        logger.info("Inicializando YoloExtractor (cargando pesos)...")
        _yolo_instance = YoloExtractor()
    else:
        # Si la instancia usa el modelo base pero el modelo custom ya ha terminado de entrenar: HOT-RELOAD
        if not getattr(_yolo_instance, 'is_custom_model', False) and os.path.exists(custom_model_path):
            logger.info("¡Nuevo modelo fine-tuneado detectado! Reinicializando YoloExtractor para usar best.pt...")
            _yolo_instance = YoloExtractor()
            
    return _yolo_instance

# Función wrapper para ser utilizada fácilmente como herramienta por el VLM
def extract_vehicle_parts_tool(image_path: str) -> dict:
    """
    Herramienta que recorta y extrae las partes detectadas de un vehículo.
    """
    extractor = get_yolo_extractor()
    return extractor.extract_vehicle_parts(image_path)

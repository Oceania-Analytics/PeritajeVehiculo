import os
from pathlib import Path
from roboflow import Roboflow
from ultralytics import YOLO

def main():
    # 1. Descargar dataset desde Roboflow (Dataset Opción B: Segmentación convertido a YOLO)
    print("Iniciando descarga del dataset desde Roboflow Universe...")
    api_key = os.environ.get("ROBOFLOW_API_KEY", "nv7QSqFsKnjj6BYssa4h") # Usando la proporcionada
    
    rf = Roboflow(api_key=api_key)
    project = rf.workspace("segmentation-9q8ob").project("car-parts-llqro")
    
    # Check roboflow dataset versions. Let's use version 1 as per research.
    version = project.version(1)
    
    # Download as YOLOv8 format (this will create a folder with data.yaml inside)
    # The SDK usually downloads it to the current working directory under the project name
    dataset = version.download("yolov8")
    
    print(f"Dataset descargado en: {dataset.location}")
    print(f"Ruta del data.yaml: {dataset.location}/data.yaml")
    
    # 2. Entrenar el modelo YOLOv8
    print("Iniciando el entrenamiento de YOLOv8...")
    
    # Partimos del modelo nano pre-entrenado
    model = YOLO('yolov8n.pt')
    
    # Configurar el entrenamiento (reducimos los epochs para que pueda probarlo localmente)
    # Puede subir los epochs a 100 si desea mayor precisión más adelante.
    data_yaml_path = os.path.join(dataset.location, "data.yaml")
    
    results = model.train(
        data=data_yaml_path,
        epochs=30,      # Empezamos con 30 para no bloquear la máquina mucho tiempo
        imgsz=640,      # Resolución de entrenamiento
        batch=8,        # Tamaño de batch conservador (para CPUs/GPUs de portátiles)
        name='yolov8_car_parts'
    )
    
    print("\n¡Entrenamiento completado!")
    print("Los pesos de tu nuevo modelo entrenado están guardados en el directorio: runs/detect/yolov8_car_parts/weights/best.pt")

if __name__ == "__main__":
    main()

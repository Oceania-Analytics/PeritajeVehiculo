import os
import argparse
from agent.perito_core import PeritoAgent

def main():
    parser = argparse.ArgumentParser(description="Agente Perito de Vehículos VLM + YOLO")
    parser.add_argument("--image", type=str, required=True, help="Ruta de la imagen a analizar")
    parser.add_argument("--model", type=str, default="gemma4:31b-cloud", help="Modelo de Ollama a utilizar (debe soportar vision y tools)")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.image):
        print(f"Error: La imagen '{args.image}' no existe.")
        return

    print("Inicializando Agente Perito...")
    agent = PeritoAgent(model_name=args.model)
    
    agent.analyze_vehicle(args.image)

if __name__ == "__main__":
    main()

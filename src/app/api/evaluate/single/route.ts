import { NextResponse } from "next/server";
import { askOllamaWithImages } from "@/lib/ollama";

export const maxDuration = 120; // Aumentar timeout por el Map-Reduce

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const globalFile = formData.get("globalImage") as File | null;
    const blockFiles = formData.getAll("blocks") as File[];

    if (!globalFile || blockFiles.length !== 4) {
      return NextResponse.json({ error: "Faltan la imagen global o los bloques (deben ser 4)" }, { status: 400 });
    }

    // Convertir a base64
    const globalBuffer = Buffer.from(await globalFile.arrayBuffer());
    const globalImage = `data:${globalFile.type};base64,${globalBuffer.toString('base64')}`;

    const blocks = await Promise.all(blockFiles.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return `data:${file.type};base64,${buffer.toString('base64')}`;
    }));

    // 1. Análisis Global (Text)
    const globalPrompt = `Eres un perito experto en vehículos. Analiza la siguiente imagen COMPLETA de un vehículo.
    Describe detalladamente el estado general y si detectas algún daño a simple vista.
    Responde solo con texto descriptivo, sé breve pero preciso.`;
    const globalReport = await askOllamaWithImages(globalPrompt, [globalImage], false);

    // 2. Análisis por Bloques (Text) asíncrono y paralelo
    const blockPrompts = blocks.map((block: string, index: number) => {
      const position = ["Superior Izquierda", "Superior Derecha", "Inferior Izquierda", "Inferior Derecha"][index];
      const prompt = `Eres un perito experto. Esta imagen es un recorte ampliado del cuadrante ${position} del vehículo.
      Busca exhaustivamente arañazos finos, pequeñas abolladuras o desperfectos.
      Responde describiendo únicamente los daños en este cuadrante, o "Sin daños" si está perfecto.`;
      return askOllamaWithImages(prompt, [block], false);
    });

    const blockReports = await Promise.all(blockPrompts);

    // 3. Deducción Final (JSON)
    const synthesisPrompt = `Eres el perito jefe. Hemos analizado un vehículo en múltiples partes.
    
    Reporte General:
    "${globalReport}"

    Reportes por Cuadrantes:
    - Superior Izquierda: "${blockReports[0]}"
    - Superior Derecha: "${blockReports[1]}"
    - Inferior Izquierda: "${blockReports[2]}"
    - Inferior Derecha: "${blockReports[3]}"

    Sintetiza todos estos hallazgos. Determina si el vehículo necesita ser peritado físicamente basándote en la combinación de todos los daños detectados en los cuadrantes y a nivel global.
    Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
    {
      "necesita_peritaje": boolean,
      "danos": "Resumen detallado de todos los daños detectados en cada cuadrante y a nivel general",
      "confiabilidad": número entero del 0 al 100 indicando tu nivel de certeza
    }`;

    // La síntesis no necesita imagen, le pasamos array vacío
    const finalResult = await askOllamaWithImages(synthesisPrompt, [], true);
    
    // Adjuntamos los reportes crudos para que el usuario pueda ver el proceso en el frontend
    finalResult._reportes_crudos = {
      global: globalReport,
      bloques: blockReports
    };

    return NextResponse.json(finalResult);
  } catch (error: unknown) {
    console.error("[API] Error en /api/evaluate/single:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { askOllamaWithImages } from "@/lib/ollama";

export const maxDuration = 60; // Extend Vercel timeout to 60s if deployed

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const beforeFile = formData.get("beforeImage") as File | null;
    const afterFile = formData.get("afterImage") as File | null;

    if (!beforeFile || !afterFile) {
      return NextResponse.json({ error: "Missing images" }, { status: 400 });
    }

    // Convertir a base64 para Ollama
    const beforeBuffer = Buffer.from(await beforeFile.arrayBuffer());
    const afterBuffer = Buffer.from(await afterFile.arrayBuffer());
    const beforeBase64 = `data:${beforeFile.type};base64,${beforeBuffer.toString('base64')}`;
    const afterBase64 = `data:${afterFile.type};base64,${afterBuffer.toString('base64')}`;

    const prompt = `Eres un perito experto en vehículos. Analiza estas dos imágenes (la primera es el "Antes", la segunda es el "Después").
    Determina si hay un cambio sustancial o daño que requiera peritaje físico.
    Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
    {
      "necesita_peritaje": boolean,
      "danos": "Descripción detallada de los daños detectados",
      "confiabilidad": número entero del 0 al 100 indicando tu nivel de certeza
    }`;

    const result = await askOllamaWithImages(prompt, [beforeBase64, afterBase64]);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API] Error en /api/evaluate/images:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

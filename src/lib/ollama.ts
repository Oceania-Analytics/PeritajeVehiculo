export async function askOllamaWithImages(prompt: string, imagesBase64: string[], expectJson: boolean = true) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "qwen";

  const cleanImages = imagesBase64.map(img => img.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, ""));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.OLLAMA_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2 minutos máximo

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        images: cleanImages.length > 0 ? cleanImages : undefined,
        stream: false,
        ...(expectJson ? { format: "json" } : {})
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama API Error: ${text}`);
    }

    const data = await response.json();
    
    if (!expectJson) {
      return data.response;
    }

    let resultJson;
    try {
      resultJson = JSON.parse(data.response);
    } catch (e) {
      resultJson = extractJson(data.response);
    }
    return resultJson;
  } catch (error) {
    console.error("Error asking Ollama:", error);
    throw error;
  }
}

function extractJson(text: string) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return {
      necesita_peritaje: true,
      danos: "No se pudo estructurar correctamente la respuesta. Respuesta raw: " + text,
      confiabilidad: 50
    };
  } catch (e) {
    throw new Error("No JSON could be extracted from model response");
  }
}

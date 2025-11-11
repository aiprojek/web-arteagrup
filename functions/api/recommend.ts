
// Impor tipe yang relevan dari @google/genai.
// Meskipun kita tidak mengimpor SDK lengkap, memiliki tipe membantu type safety.
import { GoogleGenAI, GenerateContentResponse, GroundingChunk } from '@google/genai';

// Definisikan tipe untuk environment variable kita agar TypeScript tahu tentang API_KEY.
interface Env {
  API_KEY: string;
}

// Definisikan tipe untuk data yang kita harapkan dari body request frontend.
interface RequestBody {
  prompt: string;
  // Kita tidak benar-benar menggunakan 'outlet' di sini karena prompt sudah mencakup semua konteks,
  // tetapi ini menunjukkan bagaimana Anda bisa meneruskan lebih banyak data jika diperlukan.
  outlet: 'artea' | 'janji-koffee' | 'semua';
}

// Handler utama untuk Cloudflare Worker.
// Ini akan dijalankan setiap kali ada request ke /api/recommend
// FIX: Replaced 'PagesFunction' with an inline type for the context object, as 'PagesFunction' is a Cloudflare-specific type and was not defined.
export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  try {
    // 1. Dapatkan body request dari frontend dan parse sebagai JSON.
    const body: RequestBody = await context.request.json();
    const { prompt } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Ambil API_KEY dengan aman dari environment variable Worker.
    const apiKey = context.env.API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 3. Inisialisasi GoogleGenAI SDK di dalam worker.
    const ai = new GoogleGenAI({ apiKey });

    // 4. Buat prompt lengkap, sama seperti yang ada di frontend sebelumnya.
    const fullPrompt = `
        You are a friendly and helpful barista for Artea Grup, an Indonesian beverage brand.
        A user is asking for a drink recommendation or has a question.
        Their request is: "${prompt}".

        My simple recommendation system couldn't find a direct match.
        
        Please use Google Search to:
        1. Understand their query better if it's a general question (e.g., "what is matcha?", "what's a good drink for a hot day?").
        2. Provide a helpful, summarized answer in a friendly, casual Indonesian tone.
        3. If their query mentions a type of drink, you can check if a similar drink exists on our menu below and gently suggest it as part of your answer.
        
        Keep your response concise and engaging. Start with a friendly greeting.

        Our Menu for context:
        - Artea: Teh Original, Teh Buah (Lemon, Leci), Milk Tea, Green Tea, Matcha, Kopi Series (Americano, Hazelnut), Creamy (Taro, Red Velvet), Mojito (Strawberry, etc.).
        - Janji Koffee: Kopi Hitam (Americano, Espresso), Kopi Series (Spanish Latte, Butterscotch), Non Kopi (Choco Malt, Matcha Latte).
    `;

    // 5. Panggil Gemini API.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // 6. Ekstrak data yang diperlukan dari respons Gemini.
    const resultText = response.text;
    const sources: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // 7. Kirim kembali data yang berhasil ke frontend sebagai JSON.
    return new Response(JSON.stringify({ text: resultText, sources }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error(e);
    // Kirim respons error yang jelas jika terjadi masalah di server.
    return new Response(JSON.stringify({ error: 'Failed to process request on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

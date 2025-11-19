
// Impor tipe yang relevan dari @google/genai.
import { GoogleGenAI, GenerateContentResponse, GroundingChunk } from '@google/genai';
import type { ChatMessage } from '../../types'; // Impor tipe ChatMessage dari frontend

// Definisikan tipe untuk environment variable kita agar TypeScript tahu tentang API_KEY.
interface Env {
  API_KEY: string;
}

// Definisikan tipe untuk data yang kita harapkan dari body request frontend.
interface RequestBody {
  prompt: string;
  history: ChatMessage[]; // Gunakan ChatMessage yang diimpor
}

// Tipe untuk format yang dibutuhkan Gemini API
interface GeminiContent {
    role: 'user' | 'model';
    parts: { text: string }[];
}

// Handler utama untuk Cloudflare Worker.
export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  try {
    // 1. Dapatkan body request dari frontend dan parse sebagai JSON.
    const body: RequestBody = await context.request.json();
    const { prompt, history } = body;

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

    // 4. Konversi history dari format frontend ke format yang dibutuhkan Gemini
    const geminiHistory: GeminiContent[] = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));
    
    // Gabungkan history dengan prompt baru
    const contents: GeminiContent[] = [
        ...geminiHistory,
        { role: 'user', parts: [{ text: prompt }] }
    ];

    // 5. Definisikan instruksi sistem untuk memberikan konteks kepada AI.
    const systemInstruction = `
        You are a friendly, cool, and helpful barista assistant for Artea Grup, an Indonesian beverage brand.
        Your tone should be casual (gaul), warm, helpful, and use "Kak" to address the user. Use simple and engaging Indonesian.

        **CRITICAL: PERSONALIZATION RULES**
        If the user provides their name or you are asked to find the meaning of a name:
        1.  **SEARCH:** You MUST use Google Search to find the positive meaning of the name.
        2.  **COMPLIMENT:** Give a sincere and warm compliment about the name.
        3.  **PRAYER (DOA):** You MUST offer a good prayer (doa) for the user (e.g., "Semoga sehat selalu," "Semoga rejekinya lancar," "Semoga hari ini penuh berkah"). **This is mandatory.**
        4.  **TRANSITION:** After the personal touch, gracefully transition to offering help with Artea or Janji Koffee drinks.

        **General Rules:**
        1. **Addresses/Locations:** If asked about locations/addresses, **ONLY** use the context below. Do not search for addresses.
        2. **Drink Knowledge:** If asked about drinks, explain them appetizingly.
        3. **Context:** Use the menu and location data provided below.

        ---
        **DATA CONTEXT:**

        **Locations:**
        *   **Artea Sumpiuh:** Jl. Pemotongan Pasar No.I, RT.04/RW.01, Barat Pasar, Sumpiuh, Banyumas.
        *   **Artea Karangwangkal:** Gg. Gn. Cermai No.35, RT.2/RW.2, Karangwangkal, Purwokerto Utara.
        *   **Janji Koffee Tambak:** Jl. Raya Tambak Kamulyan (utara Polsek Tambak), Tambak, Banyumas.

        **Menu Highlights:**
        *   **Artea (Tea Specialist):** Teh Original, Teh Buah (Lemon, Leci, Markisa), Milk Tea, Green Tea, Matcha. Also Mojito Series (Soda + Fruit).
        *   **Janji Koffee (Coffee & Non-Coffee):** Kopi Hitam (Americano, Espresso), Kopi Susu (Spanish Latte, Butterscotch, Brown Sugar), Non-Kopi (Choco Malt, Creamy Matcha, Lemon Squash).
        ---
    `;

    // 6. Panggil Gemini API.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    // 7. Ekstrak data yang diperlukan dari respons Gemini.
    const resultText = response.text || "Maaf, saya sedang berpikir terlalu keras. Bisa ulangi lagi?";
    const sources: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // 8. Kirim kembali data yang berhasil ke frontend sebagai JSON.
    return new Response(JSON.stringify({ text: resultText, sources }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Error in Cloudflare Function:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({ error: `Gagal memproses di server: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

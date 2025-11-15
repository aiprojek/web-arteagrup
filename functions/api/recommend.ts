// Impor tipe yang relevan dari @google/genai.
// Meskipun kita tidak mengimpor SDK lengkap, memiliki tipe membantu type safety.
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
// Ini akan dijalankan setiap kali ada request ke /api/recommend
// FIX: Replaced 'PagesFunction' with an inline type for the context object, as 'PagesFunction' is a Cloudflare-specific type and was not defined.
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
        You are a friendly and helpful barista for Artea Grup, an Indonesian beverage brand.
        Your tone should be casual, helpful, and use simple Indonesian language.

        **Primary Rule:** If the user asks about our locations or addresses ("lokasi", "alamat", "di mana", "cabang"), you **MUST ONLY** use the official addresses provided in the context below. Do not use Google Search for addresses, as it may be inaccurate. For all other questions, you can use Google Search.

        **Your Task:**
        1. Answer the user's latest prompt based on the provided conversation history and your knowledge.
        2. If the query is general (e.g., "what is matcha?"), provide a helpful, summarized answer.
        3. If their query mentions a type of drink, check if a similar drink exists on our menu and gently suggest it.
        4. Keep your responses concise, engaging, and friendly.

        ---
        **Our Official Information (Context):**

        **Locations:**
        *   **Artea Sumpiuh:** Jl. Pemotongan Pasar No.I, RT.04/RW.01, Barat Pasar, Sumpiuh, Kec. Sumpiuh, Kabupaten Banyumas, Jawa Tengah 53195
        *   **Artea Karangwangkal:** Gg. Gn. Cermai No.35, RT.2/RW.2, Karangwangkal, Kec. Purwokerto Utara, Kabupaten Banyumas, Jawa Tengah 53123
        *   **Janji Koffee Tambak:** Jl. Raya Tambak Kamulyan (utara Polsek Tambak), Kec. Tambak, Kabupaten Banyumas, Jawa Tengah 53196

        **Menu for context:**
        *   **Artea:** Teh Original, Teh Buah (Lemon, Leci), Milk Tea, Green Tea, Matcha, Kopi Series (Americano, Hazelnut, Brown Sugar, Spesial Mix, Tiramisu, Vanilla, Kappucino), Creamy (Taro, Red Velvet), Mojito (Strawberry, etc.).
        *   **Janji Koffee:** Kopi Hitam (Americano, Long Black, Espresso), Kopi Series (Spanish Latte, Butterscotch, Spesial Mix, Kappucino, Vanilla, Tiramisu, Hazelnut, Brown Sugar), Non Kopi (Choco Malt, Creamy Matcha, Creamy Green Tea, Lemon Squash, Blue Ocean).
        ---
    `;

    // 6. Panggil Gemini API.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents, // Gunakan history dan prompt baru
      config: {
        systemInstruction: systemInstruction, // Tambahkan instruksi sistem
        tools: [{ googleSearch: {} }],
      },
    });

    // 7. Ekstrak data yang diperlukan dari respons Gemini.
    const resultText = response.text;
    const sources: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // 8. Kirim kembali data yang berhasil ke frontend sebagai JSON.
    return new Response(JSON.stringify({ text: resultText, sources }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Error in Cloudflare Function:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    // Kirim pesan error yang lebih deskriptif ke frontend untuk debugging.
    return new Response(JSON.stringify({ error: `Gagal memproses di server: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
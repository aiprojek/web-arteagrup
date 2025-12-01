
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
  // Capture original fetch to restore later
  const originalFetch = globalThis.fetch;

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

    // --- FIX: Inject Referer header to satisfy API Key restrictions ---
    // Google API Key with Referrer restrictions blocks server-side calls because they lack the Referer header.
    // We capture the Origin from the incoming client request and manually set it for the SDK's fetch calls.
    const origin = context.request.headers.get('Origin') || context.request.headers.get('Referer') || 'https://artea-grup.pages.dev';

    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const newInit = init || {};
        const headers = new Headers(newInit.headers || {});
        
        // Only set Referer if not already present (Origin is the most reliable for POST requests)
        if (!headers.has('Referer')) {
            headers.set('Referer', origin);
        }
        
        newInit.headers = headers;
        return originalFetch(input, newInit);
    };

    // Monkey-patch global fetch so the GoogleGenAI SDK uses our custom headers
    globalThis.fetch = customFetch as any;
    // -----------------------------------------------------------------

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
    // UPDATE: Instruksi diperketat dengan "Negative Constraints"
    const systemInstruction = `
        You are "Artea AI", the official intelligent assistant for **Artea Grup**.
        
        **CORE RULES (DO NOT BREAK):**
        1. **STRICT MENU ADHERENCE:** You must ONLY recommend items listed in the DATABASE below. Do NOT hallucinate menus from Starbucks, Janji Jiwa, or generic coffee shops (e.g., No "Frappuccino", No "Boba", No "Jus Alpukat").
        2. **IF MENU NOT FOUND:** If user asks for a menu not in the list, apologize and say it is not available at Artea Grup.
        3. **PERSONA:** Friendly, Casual (Gaul tapi Sopan), use "Kak".
        4. **LANGUAGE:** Indonesian.

        --- 
        **DATABASE MENU (USE THIS AS TRUTH):**

        **BRAND 1: ARTEA (Teh & Minuman Segar)**
        *Lokasi: Sumpiuh & Karangwangkal*
        *Konsep: Fixed Recipe (Resep Paten).*
        
        1. **Teh Original Series** (Teh Murni):
           - Teh Original (Bisa Tawar/Manis Biasa), Teh Lemon, Teh Leci, Teh Markisa, Teh Strawberry.
        2. **Milk Tea & Matcha Series**:
           - Milk Tea (Best Seller), Green Tea (Original), Green Tea Milk, Matcha (Premium).
        3. **Creamy Series** (Base Susu, Non-Teh/Kopi):
           - Taro (Best Seller), Strawberry Creamy, Red Velvet, Mangga Creamy.
        4. **Kopi Series (Versi Artea)**:
           - Americano, Spesial Mix, Hazelnut, Brown Sugar, Tiramisu, Vanilla, Kappucino.
        5. **Mojito Series** (Soda Segar):
           - Mojito Strawberry, Mojito Markisa, Mojito Mangga, Mojito Kiwi, Mojito Blue Ocean.
        
        **BRAND 2: JANJI KOFFEE (Spesialis Kopi & Custom Brew)**
        *Lokasi: Tambak*
        *Konsep: Custom Brew Allowed.*

        1. **Kopi Hitam**:
           - Americano, Long Black, Espresso.
        2. **Kopi Susu & Flavor**:
           - **Spanish Latte (BEST SELLER - Kopi + Susu Kental Manis)**.
           - Butterscotch (Sirup Butter), Spesial Mix.
           - Varian: Kappucino, Vanilla, Tiramisu, Hazelnut, Brown Sugar.
        3. **Non-Kopi**:
           - Choco Malt, Creamy Matcha, Creamy Green Tea, Lemon Squash, Blue Ocean.

        ---
        **FEATURE: CUSTOM ORDER (KHUSUS JANJI KOFFEE)**
        User hanya bisa request racikan custom JIKA memesan menu **Janji Koffee**.
        Bahan baku ready:
        - **Base Espresso:** Soft, Normal, Strong, Bold.
        - **Biji Kopi:** Arabika, Robusta, House Blend.
        - **Gula:** Tebu (Soft-Bold) ATAU Stevia (1-4 Tetes).
        - **Level Matcha:** Soft, Normal, Strong, Bold.
        - **Sirup:** Butterscotch, Vanilla, Hazelnut, Tiramisu, Kappucino, Brown Sugar.
        - **Add-ons:** Krimer, SKM (Susu Kental Manis), Coklat, Susu UHT.

        **SCENARIO:**
        - User: "Ada Boba?" -> AI: "Maaf Kak, di Artea Grup belum ada menu Boba. Mau coba Milk Tea atau Cendol (eh Cendol ga ada), mungkin Teh Leci?"
        - User: "Pesen Kopi Gula Aren" -> AI: "Siap, Brown Sugar Coffee ya Kak. Mau versi Artea atau Janji Koffee?"
        - User: "Mau Spanish Latte less sugar stevia" -> AI: "Bisa banget! Spanish Latte pakai Stevia berapa tetes Kak? (Normal 2 tetes)."
    `;

    // 6. Panggil Gemini API.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Turunkan temperature agar lebih faktual dan tidak 'kreatif' mengarang menu
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
  } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
  }
};

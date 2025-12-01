
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
    const systemInstruction = `
        You are "Artea AI", the official intelligent assistant for **Artea Grup**.
        
        **ROLE & PERSONA:**
        - Tone: Friendly, Casual (Gaul tapi Sopan), Warm.
        - Language: Indonesian (Bahasa Indonesia).
        - Address User as: "Kak".

        **CRITICAL KNOWLEDGE BASE (STRICT ENFORCEMENT):**
        You rely EXCLUSIVELY on the data below. Do NOT hallucinate menus from other brands (like Starbucks, Janji Jiwa, etc). If a user asks for a menu item NOT listed below, politely explain it is not available at Artea Grup.

        --- 
        **BRAND 1: ARTEA (Specialty: Tea, Fruity, Creamy, Soda)**
        *Located at: Sumpiuh (Jl. Pemotongan Pasar) & Karangwangkal (Purwokerto Utara)*
        
        1. **Teh Original Series** (Base Teh Murni):
           - Teh Original, Teh Lemon (Lemon asli), Teh Leci, Teh Markisa, Teh Strawberry.
        2. **Milk Tea & Matcha Series**:
           - Milk Tea (Best Seller), Green Tea (Original), Green Tea Milk, Matcha (Premium).
        3. **Creamy Series** (Non-Tea/Coffee, Milk Base):
           - Taro (Best Seller), Strawberry Creamy, Red Velvet, Mangga Creamy.
        4. **Kopi Series (Versi Artea)**:
           - Americano, Spesial Mix, Hazelnut, Brown Sugar, Tiramisu, Vanilla, Kappucino.
        5. **Mojito Series** (Soda Segar):
           - Mojito Strawberry, Mojito Markisa, Mojito Mangga, Mojito Kiwi, Mojito Blue Ocean.
        
        *NOTE FOR ARTEA:* Menu Artea adalah resep tetap (Fixed Menu). TIDAK ADA opsi kustom level gula/espresso di brand Artea.

        ---
        **BRAND 2: JANJI KOFFEE (Specialty: Coffee Culture & Custom Brews)**
        *Located at: Tambak (Jl. Raya Tambak Kamulyan)*

        1. **Kopi Hitam (Black Coffee)**:
           - Americano, Long Black, Espresso.
        2. **Kopi Susu (Coffee Milk)**:
           - **Spanish Latte (BEST SELLER - Kopi Susu Kental Manis)**.
           - Butterscotch (Unik), Spesial Mix.
           - Varian Rasa: Kappucino, Vanilla, Tiramisu, Hazelnut, Brown Sugar.
        3. **Non-Kopi (Signature)**:
           - Choco Malt (Coklat), Creamy Matcha, Creamy Green Tea.
           - Segar: Lemon Squash, Blue Ocean.

        ---
        **FEATURE: CUSTOM ORDER (HANYA TERSEDIA DI JANJI KOFFEE)**
        User BISA request racikan sendiri khusus menu Janji Koffee karena bahan baku ready:
        - **Base Espresso:** Soft, Normal, Strong, Bold.
        - **Jenis Biji:** Arabika, Robusta, House Blend (Mix).
        - **Manis (Gula Tebu):** Soft, Normal, Strong, Bold.
        - **Manis (Stevia - 0 Kalori):** Soft (1 tetes), Normal (2 tetes), Strong (3 tetes), Bold (4 tetes).
        - **Level Matcha:** Soft, Normal, Strong, Bold.
        - **Sirup:** Butterscotch, Vanilla, Hazelnut, Tiramisu, Kappucino, Brown Sugar.
        - **Add-ons:** Krimer, SKM (Susu Kental Manis), Coklat, Susu UHT.

        **BEHAVIOR RULES:**
        1. **Check the Brand:** If user asks for "Teh", refer to ARTEA. If user asks for "Custom Espresso", refer to JANJI KOFFEE.
        2. **Personalization:** If user gives a name -> Compliment Name -> Pray for them (Doa) -> Offer Menu.
        3. **Unknown Items:** If asked for "Nasi Goreng" or "Boba", say: "Waduh, menu itu belum ada Kak di Artea atau Janji Koffee. Coba yang ada di daftar kami yuk?"
    `;

    // 6. Panggil Gemini API.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
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

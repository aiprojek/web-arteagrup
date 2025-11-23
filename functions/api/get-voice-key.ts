
interface Env {
  API_KEY: string;
}

export const onRequestGet = async (context: { env: Env }): Promise<Response> => {
  const apiKey = context.env.API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Mengembalikan API Key ke client agar bisa digunakan untuk inisialisasi SDK di browser.
  // Catatan Keamanan: Pastikan API Key ini di-restrict by HTTP Referrer di Google Cloud Console
  // agar hanya bisa digunakan oleh domain aplikasi Anda.
  return new Response(JSON.stringify({ apiKey }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

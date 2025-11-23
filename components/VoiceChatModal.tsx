
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Tool, FunctionDeclaration, Type } from '@google/genai';
import { pcmToBase64, base64ToUint8Array, pcmToAudioBuffer } from '../lib/audioUtils';
import ArteaLogoIcon from './icons/ArteaLogoIcon';

interface VoiceChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string | null;
    onNameSave: (name: string) => void;
}

const saveUserNameDeclaration: FunctionDeclaration = {
    name: 'saveUserName',
    description: 'Simpan nama pengguna ke dalam memori aplikasi ketika pengguna memperkenalkan diri.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: 'Nama panggilan pengguna.',
            },
        },
        required: ['name'],
    },
};

const VoiceChatModal: React.FC<VoiceChatModalProps> = ({ isOpen, onClose, userName, onNameSave }) => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting');
    const [volume, setVolume] = useState(0); // Untuk visualizer

    // Refs untuk manajemen Audio & Session
    const sessionRef = useRef<Promise<any> | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    useEffect(() => {
        if (!isOpen) return;

        let isCleanedUp = false;

        const startSession = async () => {
            try {
                setStatus('connecting');

                // 0. Fetch API Key dari server (Cloudflare Function) karena process.env tidak ada di browser saat deploy
                const keyResponse = await fetch('/api/get-voice-key');
                if (!keyResponse.ok) throw new Error('Gagal mengambil kredensial suara');
                const { apiKey } = await keyResponse.json();

                // 1. Inisialisasi Audio Contexts
                const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                
                inputContextRef.current = inputCtx;
                outputContextRef.current = outputCtx;

                // 2. Akses Mikrofon
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;

                // 3. Setup Gemini Client menggunakan key yang didapat dari server
                const ai = new GoogleGenAI({ apiKey });

                // 4. Connect to Live API
                // Instruksi sistem dinamis berdasarkan apakah kita sudah tahu nama user atau belum
                const contextualInstruction = userName 
                    ? `User ini bernama "${userName}". Sapa dia dengan hangat ("Halo Kak ${userName}! Senang bertemu lagi"), lalu langsung tawarkan bantuan seputar menu.`
                    : `Kamu BELUM tahu nama user. 
                       1. Sapa user dengan ramah.
                       2. Tanyakan siapa nama mereka.
                       3. PENTING: Ketika user menyebutkan nama, KAMU WAJIB memanggil tool 'saveUserName' untuk menyimpannya.
                       4. SETELAH nama tersimpan: Gunakan 'googleSearch' untuk mencari arti nama tersebut yang positif.
                       5. Berikan pujian tulus tentang arti namanya.
                       6. WAJIB: Ucapkan doa yang baik (misal: "Semoga rejekinya lancar").
                       7. Baru setelah itu tawarkan menu.`;

                const systemInstruction = `
                    Kamu adalah "Artea AI", asisten barista suara laki-laki untuk Artea Grup.
                    Gunakan bahasa Indonesia yang gaul, akrab, tapi tetap sopan.
                    
                    ${contextualInstruction}

                    DAFTAR MENU RESMI (HANYA REKOMENDASIKAN DARI SINI):
                    - Artea (Teh): Teh Original, Teh Lemon, Teh Leci, Teh Markisa, Teh Strawberry, Milk Tea, Green Tea, Green Tea Milk, Matcha.
                    - Artea (Creamy): Taro, Strawberry, Red Velvet, Mangga.
                    - Artea (Kopi): Americano, Spesial Mix, Hazelnut, Brown Sugar, Tiramisu, Vanilla, Kappucino.
                    - Artea (Mojito): Mojito Strawberry, Mojito Markisa, Mojito Mangga, Mojito Kiwi, Mojito Blue Ocean.
                    - Janji Koffee (Kopi): Americano, Long Black, Espresso, Spanish Latte, Butterscotch, Spesial Mix, Kappucino, Vanilla, Tiramisu, Hazelnut, Brown Sugar.
                    - Janji Koffee (Non-Kopi): Choco Malt, Creamy Matcha, Creamy Green Tea, Lemon Squash, Blue Ocean.

                    ATURAN TAMBAHAN:
                    1. KHUSUS **Janji Koffee**, user BOLEH pesan menu kustom (mix & match bahan). Jika diminta, jawab: "Bisa banget Kak! Di Janji Koffee boleh pesan menu kustom, langsung request aja ke barista ya."
                    2. Untuk **Artea**, TIDAK ADA menu kustom.
                    3. Jawaban harus singkat (maksimal 2-3 kalimat) agar percakapan cepat.
                `;
                
                // Konfigurasi Tools
                const tools: Tool[] = [
                    { googleSearch: {} },
                    { functionDeclarations: [saveUserNameDeclaration] }
                ];

                const sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
                        },
                        systemInstruction: systemInstruction,
                        tools: tools,
                    },
                    callbacks: {
                        onopen: () => {
                            if (isCleanedUp) return;
                            console.log('Gemini Live Connected');
                            setStatus('connected');
                            
                            // Mulai streaming audio input
                            const source = inputCtx.createMediaStreamSource(stream);
                            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                            
                            processor.onaudioprocess = (e) => {
                                if (isCleanedUp) return;
                                const inputData = e.inputBuffer.getChannelData(0);
                                
                                // Visualizer logic
                                let sum = 0;
                                for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                                const rms = Math.sqrt(sum / inputData.length);
                                setVolume(Math.min(rms * 5, 1));

                                const base64Data = pcmToBase64(inputData);
                                
                                sessionPromise.then(session => {
                                    session.sendRealtimeInput({
                                        media: {
                                            mimeType: 'audio/pcm;rate=16000',
                                            data: base64Data
                                        }
                                    });
                                });
                            };

                            source.connect(processor);
                            processor.connect(inputCtx.destination);
                            
                            sourceRef.current = source;
                            processorRef.current = processor;
                        },
                        onmessage: async (msg: LiveServerMessage) => {
                            if (isCleanedUp) return;
                            
                            // 1. Handle Function Calls (Penyimpanan Nama)
                            if (msg.toolCall) {
                                for (const fc of msg.toolCall.functionCalls) {
                                    if (fc.name === 'saveUserName') {
                                        const nameToSave = (fc.args as any).name;
                                        console.log('Saving name via Voice:', nameToSave);
                                        
                                        // Simpan ke local storage & update parent state
                                        localStorage.setItem('artea-user-name', nameToSave);
                                        if (onNameSave) onNameSave(nameToSave);

                                        // Kirim respon balik ke model bahwa nama sukses disimpan
                                        sessionPromise.then(session => {
                                            session.sendToolResponse({
                                                functionResponses: [{
                                                    id: fc.id,
                                                    name: fc.name,
                                                    response: { result: `Nama ${nameToSave} berhasil disimpan. Sekarang cari artinya, puji, dan doakan.` }
                                                }]
                                            });
                                        });
                                    }
                                }
                            }

                            // 2. Handle Audio Output
                            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                            if (base64Audio && outputCtx) {
                                const audioData = base64ToUint8Array(base64Audio);
                                const buffer = await pcmToAudioBuffer(audioData, outputCtx, 24000);
                                
                                const bufferSource = outputCtx.createBufferSource();
                                bufferSource.buffer = buffer;
                                bufferSource.connect(outputCtx.destination);
                                
                                const currentTime = outputCtx.currentTime;
                                const startTime = Math.max(currentTime, nextStartTimeRef.current);
                                bufferSource.start(startTime);
                                nextStartTimeRef.current = startTime + buffer.duration;

                                sourcesRef.current.add(bufferSource);
                                bufferSource.onended = () => {
                                    sourcesRef.current.delete(bufferSource);
                                };
                            }

                            // 3. Handle Interruption
                            if (msg.serverContent?.interrupted) {
                                console.log('Interrupted!');
                                sourcesRef.current.forEach(src => {
                                    try { src.stop(); } catch(e){}
                                });
                                sourcesRef.current.clear();
                                nextStartTimeRef.current = 0;
                            }
                        },
                        onclose: () => {
                            console.log('Gemini Live Closed');
                            if (!isCleanedUp) setStatus('closed');
                        },
                        onerror: (err) => {
                            console.error('Gemini Live Error:', err);
                            if (!isCleanedUp) setStatus('error');
                        }
                    }
                });

                sessionRef.current = sessionPromise;

            } catch (err) {
                console.error("Failed to start voice session", err);
                setStatus('error');
            }
        };

        startSession();

        return () => {
            isCleanedUp = true;
            if (processorRef.current) {
                processorRef.current.disconnect();
                processorRef.current = null;
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
                sourceRef.current = null;
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
            if (inputContextRef.current) {
                inputContextRef.current.close();
                inputContextRef.current = null;
            }
            if (outputContextRef.current) {
                outputContextRef.current.close();
                outputContextRef.current = null;
            }
            sourcesRef.current.forEach(src => {
                try { src.stop(); } catch(e){}
            });
            sourcesRef.current.clear();
            // Session closed implicitly via socket drop
        };
    }, [isOpen, userName, onNameSave]); // Dependencies updated

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-stone-900 text-white flex flex-col items-center justify-center animate-fade-in">
            {/* Background ambient effect */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554147090-e1221a04a025?w=1920&q=80&fit=max')] bg-cover bg-center opacity-20 blur-xl"></div>
            
            <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8">
                <div className="mb-8 text-center">
                    <div className="w-32 h-32 rounded-full border-4 border-stone-700 bg-stone-800 flex items-center justify-center mx-auto shadow-2xl relative">
                         <ArteaLogoIcon className="w-20 h-20 text-white opacity-80" />
                         
                         {/* Status Indicator / Visualizer Ring */}
                         {status === 'connected' && (
                            <>
                                <div className="absolute inset-0 rounded-full border-2 border-[var(--accent-color)] opacity-50 animate-ping" style={{ animationDuration: '2s' }}></div>
                                <div 
                                    className="absolute inset-0 rounded-full border-4 border-[var(--accent-color)] transition-all duration-100"
                                    style={{ 
                                        transform: `scale(${1 + volume * 0.3})`,
                                        opacity: 0.5 + volume 
                                    }}
                                ></div>
                            </>
                         )}
                    </div>
                    <h2 className="mt-6 text-2xl font-bold tracking-wide">
                        {status === 'connecting' && 'Menghubungkan...'}
                        {status === 'connected' && 'Artea AI (Suara)'}
                        {status === 'error' && 'Gagal Terhubung'}
                        {status === 'closed' && 'Panggilan Berakhir'}
                    </h2>
                    <p className="text-stone-400 mt-2 text-sm">
                        {status === 'connected' ? (userName ? `Halo, ${userName}!` : 'Silakan perkenalkan diri...') : 'Mohon tunggu sebentar'}
                    </p>
                </div>

                <div className="mt-12 flex items-center justify-center gap-8">
                    <button className="w-14 h-14 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center transition-all">
                        <i className="bi bi-mic-mute-fill text-xl"></i>
                    </button>

                    <button 
                        onClick={onClose}
                        className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 flex items-center justify-center transform transition-transform hover:scale-110"
                    >
                        <i className="bi bi-telephone-x-fill text-3xl"></i>
                    </button>

                     <button className="w-14 h-14 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center transition-all">
                        <i className="bi bi-volume-up-fill text-xl"></i>
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default VoiceChatModal;

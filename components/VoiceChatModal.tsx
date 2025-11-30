
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
    // Status: initial (belum mulai), connecting, connected, error, closed
    const [status, setStatus] = useState<'initial' | 'connecting' | 'connected' | 'error' | 'closed'>('initial');
    const [volume, setVolume] = useState(0); 
    const [errorMessage, setErrorMessage] = useState('');

    // Refs untuk manajemen Audio & Session
    const sessionRef = useRef<Promise<any> | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // Reset status ketika modal dibuka
    useEffect(() => {
        if (isOpen) {
            setStatus('initial');
            setErrorMessage('');
        } else {
            cleanupSession();
        }
    }, [isOpen]);

    const cleanupSession = () => {
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
        setVolume(0);
    };

    // Fungsi START yang dipanggil saat tombol diklik (User Gesture)
    const handleStartSession = async () => {
        try {
            setStatus('connecting');
            setErrorMessage('');

            // 1. Ambil API Key dari Server Cloudflare
            const keyResponse = await fetch('/api/get-voice-key');
            if (!keyResponse.ok) {
                throw new Error('Gagal mengambil kunci akses server.');
            }
            const { apiKey } = await keyResponse.json();

            // 2. Inisialisasi Audio Contexts (Wajib didalam user gesture untuk Mobile)
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // PENTING: Resume audio context agar tidak diblokir browser ponsel
            await inputCtx.resume();
            await outputCtx.resume();

            inputContextRef.current = inputCtx;
            outputContextRef.current = outputCtx;

            // 3. Akses Mikrofon
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // 4. Setup Gemini Client
            const ai = new GoogleGenAI({ apiKey: apiKey });

            const contextualInstruction = userName 
                ? `User ini bernama "${userName}". Sapa dia dengan hangat ("Halo Kak ${userName}! Senang bertemu lagi"), lalu langsung tawarkan bantuan seputar menu.`
                : `Kamu BELUM tahu nama user. 
                   1. Sapa user dengan ramah.
                   2. Tanyakan siapa nama mereka.
                   3. PENTING: Ketika user menyebutkan nama, KAMU WAJIB memanggil tool 'saveUserName' untuk menyimpannya.
                   4. SETELAH nama tersimpan: Berikan pujian tulus tentang arti namanya (gunakan pengetahuan umum).
                   5. WAJIB: Ucapkan doa yang baik (misal: "Semoga rejekinya lancar").
                   6. Baru setelah itu tawarkan menu.`;

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

                ATURAN KHUSUS MENU KUSTOM (JANJI KOFFEE):
                Di Janji Koffee, pengunjung BOLEH pesan menu kustom. Tawarkan opsi ini:
                - **Espresso:** Arabika, Robusta, House Blend. (Level: Soft, Normal, Strong, Bold).
                - **Gula Stevia (Sehat):** Soft (1 tetes), Normal (2 tetes), Strong (3 tetes), Bold (4 tetes).
                - **Gula Tebu:** Soft, Normal, Strong, Bold.
                - **Level Matcha:** Soft, Normal, Strong, Bold.
                - **Sirup:** Butterscotch, Vanilla, Hazelnut, Tiramisu, Kappucino, Brown Sugar.
                - **Tambahan:** Krimer, SKM, Coklat, Susu UHT.

                JANGAN tawarkan menu kustom untuk Artea (hanya Janji Koffee).
                Jawaban harus singkat (maksimal 2-3 kalimat) agar percakapan cepat.
            `;
            
            const tools: Tool[] = [
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
                    onopen: async () => {
                        console.log('Gemini Live Connected');
                        setStatus('connected');
                        
                        // Mulai streaming audio input
                        const source = inputCtx.createMediaStreamSource(stream);
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        
                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Visualizer logic
                            let sum = 0;
                            for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                            const rms = Math.sqrt(sum / inputData.length);
                            setVolume(Math.min(rms * 5, 1));

                            // Downsampling Logic: Convert System Rate -> 16k
                            const targetRate = 16000;
                            const currentRate = inputCtx.sampleRate;
                            let finalData = inputData;

                            if (currentRate !== targetRate) {
                                const ratio = currentRate / targetRate;
                                const newLength = Math.floor(inputData.length / ratio);
                                finalData = new Float32Array(newLength);
                                for (let i = 0; i < newLength; i++) {
                                    const start = Math.floor(i * ratio);
                                    const end = Math.floor((i + 1) * ratio);
                                    let sum = 0;
                                    let count = 0;
                                    for(let j = start; j < end && j < inputData.length; j++) {
                                        sum += inputData[j];
                                        count++;
                                    }
                                    finalData[i] = count > 0 ? sum / count : inputData[start];
                                }
                            }

                            const base64Data = pcmToBase64(finalData);
                            
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
                        // 1. Handle Function Calls
                        if (msg.toolCall) {
                            for (const fc of msg.toolCall.functionCalls) {
                                if (fc.name === 'saveUserName') {
                                    const nameToSave = (fc.args as any).name;
                                    
                                    localStorage.setItem('artea-user-name', nameToSave);
                                    if (onNameSave) onNameSave(nameToSave);

                                    sessionPromise.then(session => {
                                        session.sendToolResponse({
                                            functionResponses: [{
                                                id: fc.id,
                                                name: fc.name,
                                                response: { result: `Nama ${nameToSave} disimpan.` }
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
                            if (nextStartTimeRef.current < currentTime) {
                                nextStartTimeRef.current = currentTime;
                            }
                            const startTime = nextStartTimeRef.current === currentTime 
                                ? currentTime + 0.05 
                                : nextStartTimeRef.current;
                            
                            bufferSource.start(startTime);
                            nextStartTimeRef.current = startTime + buffer.duration;

                            sourcesRef.current.add(bufferSource);
                            bufferSource.onended = () => {
                                sourcesRef.current.delete(bufferSource);
                            };
                        }

                        // 3. Handle Interruption
                        if (msg.serverContent?.interrupted) {
                            sourcesRef.current.forEach(src => {
                                try { src.stop(); } catch(e){}
                            });
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onclose: (e) => {
                        console.log('Session closed', e);
                        setStatus('closed');
                    },
                    onerror: (err) => {
                        console.error('Gemini Live Error:', err);
                        setStatus('error');
                        setErrorMessage(err instanceof Error ? err.message : 'Koneksi terputus.');
                    }
                }
            });

            sessionRef.current = sessionPromise;

        } catch (err) {
            console.error("Failed to start voice session", err);
            setStatus('error');
            setErrorMessage(err instanceof Error ? err.message : 'Gagal mengakses mikrofon atau server.');
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-stone-900 text-white flex flex-col items-center justify-center animate-fade-in">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554147090-e1221a04a025?w=1920&q=80&fit=max')] bg-cover bg-center opacity-20 blur-xl"></div>
            
            <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8">
                <div className="mb-8 text-center">
                    <div className="w-32 h-32 rounded-full border-4 border-stone-700 bg-stone-800 flex items-center justify-center mx-auto shadow-2xl relative overflow-visible">
                         <ArteaLogoIcon className="w-20 h-20 text-white opacity-80" />
                         
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
                        {status === 'initial' && 'Mulai Percakapan'}
                        {status === 'connecting' && 'Menghubungkan...'}
                        {status === 'connected' && 'Artea AI (Suara)'}
                        {status === 'error' && 'Gagal Terhubung'}
                        {status === 'closed' && 'Selesai'}
                    </h2>
                    
                    {/* Status Messages */}
                    <div className="text-stone-400 mt-2 text-sm min-h-[40px] px-4">
                        {status === 'initial' && 'Klik tombol hijau di bawah untuk mulai berbicara.'}
                        {status === 'connecting' && 'Mohon tunggu sebentar, sedang menyiapkan koneksi...'}
                        {status === 'connected' && (userName ? `Halo, ${userName}! Silakan bicara...` : 'Silakan katakan "Halo" untuk memulai...')}
                        {status === 'error' && (
                            <span className="text-red-400">
                                {errorMessage || 'Pastikan izin mikrofon aktif & koneksi internet lancar.'}
                            </span>
                        )}
                        {status === 'closed' && 'Terima kasih sudah mengobrol!'}
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6">
                    {/* Back / Close Button */}
                     <button 
                        onClick={onClose}
                        className="w-14 h-14 rounded-full bg-stone-700 hover:bg-stone-600 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                        aria-label="Tutup"
                    >
                        <i className="bi bi-x-lg text-2xl"></i>
                    </button>

                    {/* Main Action Button */}
                    {status === 'initial' || status === 'error' || status === 'closed' ? (
                        <button 
                            onClick={handleStartSession}
                            className="w-20 h-20 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/30 flex items-center justify-center transform transition-transform hover:scale-110 animate-pulse-slow"
                            aria-label="Mulai"
                        >
                            <i className="bi bi-mic-fill text-3xl"></i>
                        </button>
                    ) : (
                        <button 
                            onClick={onClose}
                            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 flex items-center justify-center transform transition-transform hover:scale-110"
                            aria-label="Akhiri Panggilan"
                        >
                            <i className="bi bi-telephone-x-fill text-3xl"></i>
                        </button>
                    )}
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
                @keyframes pulse-slow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
                    50% { box-shadow: 0 0 0 15px rgba(22, 163, 74, 0); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 2s infinite;
                }
            `}</style>
        </div>
    );
};

export default VoiceChatModal;

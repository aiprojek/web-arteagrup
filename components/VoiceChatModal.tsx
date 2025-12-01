
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
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);

    // Refs untuk manajemen Audio & Session
    const sessionRef = useRef<Promise<any> | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const timerRef = useRef<any>(null);

    // Reset status ketika modal dibuka
    useEffect(() => {
        if (isOpen) {
            setStatus('initial');
            setErrorMessage('');
            setCallDuration(0);
        } else {
            cleanupSession();
        }
    }, [isOpen]);

    // Timer logic
    useEffect(() => {
        if (status === 'connected') {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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
        if (timerRef.current) clearInterval(timerRef.current);
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
                   4. SETELAH nama tersimpan: Berikan pujian tulus tentang arti namanya.
                   5. WAJIB: Ucapkan doa yang baik (misal: "Semoga rejekinya lancar").
                   6. Baru setelah itu tawarkan menu.`;

            const systemInstruction = `
                Kamu adalah "Artea AI", asisten barista suara laki-laki untuk Artea Grup.
                Tone: Gaul, Akrab, Sopan.

                ${contextualInstruction}

                PENGETAHUAN MENU (STRICT - Jangan halusinasi menu lain):
                
                BRAND 1: ARTEA (Teh & Minuman Segar)
                - Teh Series: Teh Original, Teh Lemon, Teh Leci, Teh Markisa, Teh Strawberry.
                - Milk Tea & Matcha: Milk Tea, Green Tea, Green Tea Milk, Matcha.
                - Creamy: Taro, Strawberry, Red Velvet, Mangga.
                - Kopi: Americano, Spesial Mix, Hazelnut, Brown Sugar, Tiramisu, Vanilla, Kappucino.
                - Mojito (Soda): Mojito Strawberry/Markisa/Mangga/Kiwi/Blue Ocean.
                *NOTE: Menu Artea tidak bisa custom.*

                BRAND 2: JANJI KOFFEE (Kopi & Custom)
                - Kopi Hitam: Americano, Long Black, Espresso.
                - Kopi Susu: Spanish Latte (Best Seller), Butterscotch, Spesial Mix, Kappucino, Vanilla, Tiramisu, Hazelnut, Brown Sugar.
                - Non-Kopi: Choco Malt, Creamy Matcha, Creamy Green Tea, Lemon Squash, Blue Ocean.

                FITUR CUSTOM (HANYA JANJI KOFFEE):
                Tawarkan ini jika user ingin racikan khusus Janji Koffee:
                - Espresso: Arabika/Robusta (Soft s/d Bold).
                - Gula: Tebu / Stevia (1-4 Tetes).
                - Sirup: Butterscotch, Vanilla, dll.
                - Add-ons: Krimer, SKM, Coklat, Susu UHT.

                Jawab singkat, padat, dan jelas (seperti percakapan telepon).
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
                            if (isMuted) return; // Logic Mute Sederhana

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
        <div className="fixed inset-0 z-[60] bg-stone-900 text-white flex flex-col items-center justify-between py-12 px-6 animate-fade-in font-sans">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554147090-e1221a04a025?w=1920&q=80&fit=max')] bg-cover bg-center opacity-30 blur-2xl"></div>
            <div className="absolute inset-0 bg-black/60"></div>
            
            {/* Header / Top Info */}
            <div className="relative z-10 flex flex-col items-center w-full mt-4">
                <button 
                    onClick={onClose} 
                    className="absolute left-0 top-0 p-2 text-stone-400 hover:text-white"
                    aria-label="Minimize"
                >
                    <i className="bi bi-chevron-down text-2xl"></i>
                </button>
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight">Artea AI</h2>
                    <p className="text-sm font-medium text-stone-300 mt-1">
                        {status === 'initial' && 'Siap Memanggil'}
                        {status === 'connecting' && 'Menghubungkan...'}
                        {status === 'connected' && formatTime(callDuration)}
                        {status === 'error' && 'Gagal'}
                        {status === 'closed' && 'Panggilan Berakhir'}
                    </p>
                </div>
            </div>

            {/* Middle / Avatar */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-grow">
                 <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-4 border-white/10 bg-stone-800 flex items-center justify-center shadow-2xl relative overflow-visible">
                         <ArteaLogoIcon className="w-24 h-24 md:w-32 md:h-32 text-white opacity-90 z-20" />
                         
                         {status === 'connected' && (
                            <>
                                {/* Breathing / Pulse Effect */}
                                <div className="absolute inset-0 rounded-full border-2 border-[var(--accent-color)] opacity-40 animate-ping-slow"></div>
                                <div 
                                    className="absolute inset-0 rounded-full bg-[var(--accent-color)] blur-xl transition-all duration-100 ease-out z-10"
                                    style={{ 
                                        opacity: Math.max(0.1, volume),
                                        transform: `scale(${1 + volume * 0.5})` 
                                    }}
                                ></div>
                            </>
                         )}
                         
                         {status === 'connecting' && (
                              <div className="absolute inset-0 rounded-full border-t-4 border-[var(--accent-color)] animate-spin"></div>
                         )}
                    </div>
                     {status === 'error' && (
                        <div className="mt-8 px-4 py-2 bg-red-500/20 text-red-200 rounded-lg text-sm text-center max-w-xs backdrop-blur-sm">
                            {errorMessage || 'Terjadi kesalahan koneksi.'}
                        </div>
                    )}
            </div>

            {/* Bottom / Controls */}
            <div className="relative z-10 w-full max-w-md mb-8">
                
                {/* Secondary Controls (Mute/Speaker) - Only visible when connected */}
                {status === 'connected' && (
                    <div className="flex justify-around items-center mb-10 px-8">
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className={`flex flex-col items-center space-y-2 transition-colors ${isMuted ? 'text-white' : 'text-stone-400 hover:text-white'}`}
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${isMuted ? 'bg-white text-stone-900' : 'bg-white/10'}`}>
                                <i className={`bi ${isMuted ? 'bi-mic-mute-fill' : 'bi-mic-fill'}`}></i>
                            </div>
                            <span className="text-xs">Mute</span>
                        </button>
                        
                        <button 
                             onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                             className={`flex flex-col items-center space-y-2 transition-colors ${isSpeakerOn ? 'text-white' : 'text-stone-400 hover:text-white'}`}
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${isSpeakerOn ? 'bg-white text-stone-900' : 'bg-white/10'}`}>
                                <i className={`bi ${isSpeakerOn ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'}`}></i>
                            </div>
                            <span className="text-xs">Speaker</span>
                        </button>
                    </div>
                )}

                {/* Primary Action Button (Call / Hangup) */}
                <div className="flex items-center justify-center">
                    {status === 'initial' || status === 'error' || status === 'closed' ? (
                        <button 
                            onClick={handleStartSession}
                            className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-400 text-white shadow-xl shadow-green-500/30 flex items-center justify-center transform transition-all hover:scale-105 active:scale-95"
                            aria-label="Panggil"
                        >
                            <i className="bi bi-telephone-fill text-3xl"></i>
                        </button>
                    ) : (
                        <button 
                            onClick={onClose}
                            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 text-white shadow-xl shadow-red-500/30 flex items-center justify-center transform transition-all hover:scale-105 active:scale-95"
                            aria-label="Akhiri Panggilan"
                        >
                            <i className="bi bi-telephone-x-fill text-3xl"></i>
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s ease-out forwards;
                }
                @keyframes ping-slow {
                    75%, 100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }
                .animate-ping-slow {
                    animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>
        </div>
    );
};

export default VoiceChatModal;

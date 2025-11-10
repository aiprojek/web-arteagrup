
import React, { useEffect } from 'react';
import ArteaLogoIcon from './icons/ArteaLogoIcon';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const url = window.location.href;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}&qzone=1&margin=1`;

    return (
        <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="relative w-full max-w-xs bg-stone-800 text-stone-200 rounded-2xl shadow-2xl p-6 flex flex-col items-center transform transition-all duration-300 ease-in-out opacity-0 animate-fade-slide-in"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-stone-400 hover:text-white bg-stone-700/50 hover:bg-stone-700/80 transition-all duration-300 w-8 h-8 rounded-full flex items-center justify-center z-10"
                    aria-label="Tutup modal"
                >
                    <i className="bi bi-x-lg text-lg"></i>
                </button>
                
                <div className="flex items-center space-x-2 mb-4">
                    <ArteaLogoIcon className="w-8 h-8 text-white"/>
                    <h3 className="text-xl font-bold text-white">Bagikan Tautan</h3>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-inner relative">
                    <img src={qrCodeUrl} alt="QR Code for Artea Grup Page" width="256" height="256" className="rounded-md" />
                </div>
                
                <p className="text-xs text-stone-400 mt-4 text-center">
                    Pindai kode ini untuk membuka halaman di perangkat lain.
                </p>
                
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-in-out forwards;
                }
                @keyframes fade-slide-in {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fade-slide-in {
                    animation: fade-slide-in 0.3s ease-in-out forwards;
                }
            `}</style>
        </div>
    );
};

export default QRCodeModal;

import React from 'react';

interface LayoutControlPanelProps {
    isOpen: boolean;
    onSetPreset: (preset: 'standard' | 'compact') => void;
    onReset: () => void;
    onSave: () => void;
}

const LayoutControlPanel: React.FC<LayoutControlPanelProps> = ({ isOpen, onSetPreset, onReset, onSave }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50">
            <div className="bg-stone-900/80 backdrop-blur-md rounded-xl shadow-2xl p-2 flex items-center justify-around space-x-1 text-sm text-white border border-white/10">
                <div className="group relative">
                    <button onClick={() => onSetPreset('standard')} className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Set Standard Layout">
                        <i className="bi bi-distribute-vertical"></i>
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-stone-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Standar</div>
                </div>
                 <div className="group relative">
                    <button onClick={() => onSetPreset('compact')} className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Set Compact Layout">
                        <i className="bi bi-grid-fill"></i>
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-stone-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Kompak</div>
                </div>
                 <div className="group relative">
                    <button onClick={onReset} className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Reset Layout">
                        <i className="bi bi-arrow-counterclockwise"></i>
                    </button>
                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-stone-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Reset</div>
                </div>
                <div className="flex-grow">
                    <button onClick={onSave} className="w-full bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg" aria-label="Save and Close Layout Editor">
                        <i className="bi bi-check-lg mr-1"></i>
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LayoutControlPanel;
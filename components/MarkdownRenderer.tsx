
import React from 'react';

interface MarkdownRendererProps {
    text: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
    // Fungsi untuk memproses teks baris per baris agar format daftar (list) terlihat rapi
    const processText = (rawText: string) => {
        if (!rawText) return '';

        // 1. Sanitasi dasar (mencegah injeksi script sederhana)
        const safeText = rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // 2. Split menjadi baris-baris
        return safeText.split('\n').map((line) => {
            let processedLine = line;

            // 3. Deteksi Bullet Points (* atau - di awal baris)
            if (processedLine.match(/^(\*|-)\s/)) {
                processedLine = processedLine.replace(/^(\*|-)\s+(.*)/, '<div class="flex items-start py-1"><span class="mr-2 text-[var(--accent-color)] flex-shrink-0">•</span><span>$2</span></div>');
            } else if (processedLine.trim() === '') {
                 // Baris kosong
                 return '<div class="h-2"></div>';
            } else {
                // Baris teks biasa, bungkus div agar layout konsisten
                processedLine = `<div>${processedLine}</div>`;
            }

            // 4. Format Inline (Bold & Italic)
            // Bold: **text**
            processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--accent-color)]">$1</strong>');
            // Italic: *text* or _text_
            processedLine = processedLine.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

            return processedLine;
        }).join('');
    }

    return (
        <div 
            className="text-stone-300 text-sm leading-relaxed space-y-0.5" 
            dangerouslySetInnerHTML={{ __html: processText(text) }} 
        />
    );
};

export default MarkdownRenderer;

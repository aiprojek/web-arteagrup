import React from 'react';

interface MarkdownRendererProps {
    text: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
    const parseMarkdown = (markdownText: string) => {
        // Bold: **text** or __text__
        let html = markdownText.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong class="text-sky-300">$1$2</strong>');
        // Italic: *text* or _text_
        html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
        // Newlines to <br>
        html = html.replace(/\n/g, '<br />');
        return html;
    };

    const renderedHtml = parseMarkdown(text);

    return (
        <div 
            className="text-stone-300" 
            dangerouslySetInnerHTML={{ __html: renderedHtml }} 
        />
    );
};

export default MarkdownRenderer;
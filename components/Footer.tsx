import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="mt-8 mb-4 text-center">
            <div className="mt-6 text-xs text-stone-400">
                © {new Date().getFullYear()} Artea Grup. Web by{' '}
                <a 
                    href="https://aiprojek01.my.id" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-[var(--accent-color)] transition-colors"
                >
                    AI Projek
                </a>.
            </div>
        </footer>
    );
};

export default Footer;
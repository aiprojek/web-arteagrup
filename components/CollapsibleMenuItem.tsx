import React, { useState } from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface CollapsibleMenuItemProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    variants: string[];
}

const CollapsibleMenuItem: React.FC<CollapsibleMenuItemProps> = ({ icon, title, description, variants }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-stone-700 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left p-4 hover:bg-stone-700/50 transition-colors duration-200"
                aria-expanded={isOpen}
            >
                <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 flex items-center justify-center">{icon}</div>
                    <div>
                        <h4 className="font-semibold text-white">{title}</h4>
                        <p className="text-sm text-stone-400 mt-1">{description}</p>
                    </div>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-stone-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}
            >
                <div className="px-4 pb-4 pt-0">
                    <ul className="list-disc list-inside space-y-1 pl-12 text-stone-300">
                        {variants.map((variant, index) => (
                            <li key={index}>{variant}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CollapsibleMenuItem;
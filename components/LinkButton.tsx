import React from 'react';
import { LinkItem } from '../types';

interface LinkButtonProps {
    link: LinkItem;
}

const LinkButton: React.FC<LinkButtonProps> = ({ link }) => {
    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Link to ${link.title}`}
            className="group flex items-center justify-center w-full h-[52px] bg-stone-100/80 hover:bg-stone-100 text-stone-800 font-semibold py-3 px-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-105 text-sm"
        >
            {link.icon && <i className={`${link.icon} mr-3 text-xl transition-transform duration-300 group-hover:-rotate-12`} aria-hidden="true"></i>}
            <span className="whitespace-nowrap">{link.title}</span>
        </a>
    );
};

export default LinkButton;
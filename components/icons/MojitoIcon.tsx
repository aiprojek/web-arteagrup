import React from 'react';

const MojitoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l3-3 3 3M3 9h6m12 0-3-3-3 3m6 0h-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 2.25v.75a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75v-.75" />
    </svg>
);

export default MojitoIcon;
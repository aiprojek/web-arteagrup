import React, { useState, useEffect } from 'react';

// Define the type for a single menu item
interface MenuItem {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    variants: string[];
}

// Define the props for the MenuTabs component
interface MenuTabsProps {
    menuData: MenuItem[];
}

const MenuTabs: React.FC<MenuTabsProps> = ({ menuData }) => {
    // State to track the active tab, defaulting to the first item's ID
    const [activeTabId, setActiveTabId] = useState(menuData[0]?.id || '');
    const [contentKey, setContentKey] = useState(0);

    // Find the currently active menu item based on the state
    const activeMenu = menuData.find(item => item.id === activeTabId);

    // Effect to reset animation on tab change by updating the key
    useEffect(() => {
        setContentKey(prevKey => prevKey + 1);
    }, [activeTabId]);

    return (
        <div className="w-full">
            {/* Tab navigation container */}
            <div className="relative mb-6">
                <div 
                    className="flex space-x-2 overflow-x-auto py-3 -mx-6 px-6 scrollbar-hide"
                    role="tablist"
                    aria-label="Menu Categories"
                >
                    {menuData.map((item) => (
                        <button
                            key={item.id}
                            id={`tab-${item.id}`}
                            role="tab"
                            aria-selected={activeTabId === item.id}
                            aria-controls={`panel-${item.id}`}
                            onClick={() => setActiveTabId(item.id)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-800 focus:ring-[var(--accent-color)]
                                ${activeTabId === item.id 
                                    ? 'bg-[var(--accent-color)] text-stone-900 shadow-lg scale-105' 
                                    : 'bg-stone-700/50 hover:bg-stone-700 text-stone-300'
                                }`}
                        >
                            {item.title}
                        </button>
                    ))}
                </div>
                 {/* Add a fade effect on the right edge for scroll indication */}
                 <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-stone-900 to-transparent pointer-events-none -mr-6 md:hidden"></div>
            </div>

            {/* Content area for the active tab */}
            {activeMenu && (
                <div
                    key={contentKey}
                    id={`panel-${activeMenu.id}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${activeMenu.id}`}
                    className="bg-stone-900/50 rounded-lg p-6 animate-fade-in-content"
                >
                    <div className="flex items-start space-x-4 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-stone-700/50 rounded-lg">{activeMenu.icon}</div>
                        <div>
                            <h4 className="text-xl font-bold text-white">{activeMenu.title}</h4>
                            <p className="text-sm text-stone-400 mt-1">{activeMenu.description}</p>
                        </div>
                    </div>
                    
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-stone-300">
                        {activeMenu.variants.map((variant, index) => (
                            <li key={index} className="flex items-center">
                               <i className="bi bi-circle-fill text-[var(--accent-color)] mr-3 text-[6px]"></i>
                               <span>{variant}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
             <style>{`
                .animate-fade-in-content {
                    animation: fade-in-content 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
                @keyframes fade-in-content {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default MenuTabs;
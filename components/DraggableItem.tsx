import React, { useRef, useCallback, useEffect } from 'react';
import { LayoutItem } from '../types';

interface DraggableItemProps extends LayoutItem {
    isEditing: boolean;
    onUpdate: (id: string, newLayout: Partial<LayoutItem>) => void;
    children: React.ReactNode;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ id, x, y, width, height, minWidth = 50, minHeight = 40, isEditing, onUpdate, children }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const dragInfo = useRef({ isDragging: false, isResizing: false, startX: 0, startY: 0, startW: 0, startH: 0, startLeft: 0, startTop: 0 });

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragInfo.current.isDragging && !dragInfo.current.isResizing) return;
        e.preventDefault();

        const dx = e.clientX - dragInfo.current.startX;
        const dy = e.clientY - dragInfo.current.startY;

        const parentRect = itemRef.current?.parentElement?.getBoundingClientRect();
        if (!parentRect) return;

        if (dragInfo.current.isDragging) {
            let newX = ((dragInfo.current.startLeft + dx) / parentRect.width) * 100;
            let newY = dragInfo.current.startTop + dy;
            
            newX = Math.max(0, Math.min(newX, 100 - (itemRef.current?.offsetWidth ?? 0) / parentRect.width * 100));
            newY = Math.max(0, Math.min(newY, parentRect.height - (itemRef.current?.offsetHeight ?? 0)));

            if (itemRef.current) {
                itemRef.current.style.left = `${newX}%`;
                itemRef.current.style.top = `${newY}px`;
            }
        }

        if (dragInfo.current.isResizing) {
            let newW = ((dragInfo.current.startW + dx) / parentRect.width) * 100;
            let newH = dragInfo.current.startH + dy;

            newW = Math.max((minWidth / parentRect.width) * 100, Math.min(newW, 100 - ((itemRef.current?.offsetLeft ?? 0) / parentRect.width * 100)));
            newH = Math.max(minHeight, newH);

            if (itemRef.current) {
                itemRef.current.style.width = `${newW}%`;
                itemRef.current.style.height = `${newH}px`;
            }
        }
    }, [minWidth, minHeight]);

    const handleMouseUp = useCallback(() => {
        if (itemRef.current && (dragInfo.current.isDragging || dragInfo.current.isResizing)) {
             const parentRect = itemRef.current.parentElement?.getBoundingClientRect();
             if(parentRect){
                const finalX = (itemRef.current.offsetLeft / parentRect.width) * 100;
                const finalY = itemRef.current.offsetTop;
                const finalW = (itemRef.current.offsetWidth / parentRect.width) * 100;
                const finalH = itemRef.current.offsetHeight;
                onUpdate(id, { x: finalX, y: finalY, width: finalW, height: finalH });
             }
        }
        dragInfo.current = { ...dragInfo.current, isDragging: false, isResizing: false };
    }, [id, onUpdate]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);
    
    const handleDragStart = (e: React.MouseEvent) => {
        if (!isEditing || !itemRef.current) return;
        e.preventDefault();
        dragInfo.current = {
            isDragging: true, isResizing: false,
            startX: e.clientX, startY: e.clientY,
            startLeft: itemRef.current.offsetLeft, startTop: itemRef.current.offsetTop,
            startW: 0, startH: 0
        };
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        if (!isEditing || !itemRef.current) return;
        e.stopPropagation();
        e.preventDefault();
        dragInfo.current = {
            isDragging: false, isResizing: true,
            startX: e.clientX, startY: e.clientY,
            startW: itemRef.current.offsetWidth, startH: itemRef.current.offsetHeight,
            startLeft: 0, startTop: 0
        };
    };

    return (
        <div
            ref={itemRef}
            className={`absolute transition-shadow duration-300 ${isEditing ? 'shadow-lg ring-2 ring-white/30 ring-dashed rounded-lg cursor-move' : ''}`}
            style={{
                left: `${x}%`,
                top: `${y}px`,
                width: `${width}%`,
                height: `${height}px`,
                touchAction: isEditing ? 'none' : 'auto',
            }}
            onMouseDown={handleDragStart}
        >
            <div className="w-full h-full">{children}</div>
            {isEditing && (
                <>
                    <div 
                        className="absolute -bottom-2 -right-2 w-5 h-5 bg-[var(--accent-color)] rounded-full border-2 border-stone-800 cursor-se-resize"
                        onMouseDown={handleResizeStart}
                        aria-label="Resize item"
                    />
                </>
            )}
        </div>
    );
};

export default DraggableItem;
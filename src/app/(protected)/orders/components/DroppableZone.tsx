import { useDroppable } from '@dnd-kit/core';
import React from 'react';

interface DroppableZoneProps {
  id: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}

export function DroppableZone({ id, children, isEmpty = false }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 transition-all duration-200 relative min-h-[400px] w-full
        ${isOver 
          ? 'bg-blue-50/80 border-2 border-blue-400 border-dashed shadow-lg' 
          : isEmpty 
            ? 'bg-gray-50/70 hover:border-2 hover:border-dashed border-gray-300 hover:bg-gray-100/70 hover:border-gray-400' 
            : 'hover:bg-gray-50/30 hover:border-2 hover:border-dashed hover:border-gray-300'
        }
      `}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 bg-blue-100/30 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none z-10 flex items-center justify-center">
          <div className="text-blue-600 font-semibold text-lg">Drop here</div>
        </div>
      )}
    </div>
  );
} 
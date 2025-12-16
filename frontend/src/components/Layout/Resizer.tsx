// リサイズハンドルコンポーネント

import React, { useCallback, useEffect, useState } from 'react';

interface ResizerProps {
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
}

export const Resizer: React.FC<ResizerProps> = ({ onResize, onResizeEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = startX - e.clientX;
      onResize(delta);
      setStartX(e.clientX);
    },
    [isDragging, startX, onResize]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onResizeEnd?.();
    }
  }, [isDragging, onResizeEnd]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`resizer ${isDragging ? 'resizing' : ''}`}
      onMouseDown={handleMouseDown}
    />
  );
};


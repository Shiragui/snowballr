import React, { useState, useRef, useEffect } from 'react';

export default function ResizablePanel({ 
  children, 
  defaultSize = 50, 
  minSize = 20, 
  maxSize = 80,
  direction = 'horizontal',
  onResize 
}) {
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const containerRef = useRef(null);
  const handleRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      let newSize;

      if (direction === 'horizontal') {
        const x = e.clientX - containerRect.left;
        newSize = (x / containerRect.width) * 100;
      } else {
        const y = e.clientY - containerRect.top;
        newSize = (y / containerRect.height) * 100;
      }

      // Clamp to min/max
      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      
      setSize(newSize);
      if (onResize) onResize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, direction, minSize, maxSize, onResize]);

  return (
    <div 
      ref={containerRef}
      className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} relative`}
      style={{ width: '100%', height: '100%' }}
    >
      <div 
        style={{ 
          [direction === 'horizontal' ? 'width' : 'height']: `${size}%`,
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: direction === 'horizontal' ? 'column' : 'row',
          [direction === 'horizontal' ? 'minWidth' : 'minHeight']: 0
        }}
        className={direction === 'horizontal' ? 'h-full' : 'w-full'}
      >
        {children[0]}
      </div>
      
      {/* Resizer handle - only visible on hover over the handle itself */}
      <div
        ref={handleRef}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => !isDragging && setIsHoveringHandle(false)}
        className={`${
          direction === 'horizontal' 
            ? 'w-1 cursor-col-resize' 
            : 'h-1 cursor-row-resize'
        } transition-all duration-200 relative flex items-center justify-center ${
          isHoveringHandle || isDragging ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          flexShrink: 0,
          [direction === 'horizontal' ? 'minWidth' : 'minHeight']: '4px',
          [direction === 'horizontal' ? 'maxWidth' : 'maxHeight']: '4px'
        }}
      >
        <div 
          className={`${
            direction === 'horizontal' ? 'w-8 h-12' : 'h-8 w-12'
          } rounded-full bg-primary-400/0 hover:bg-primary-400/30 transition-all duration-150 flex items-center justify-center ${
            isDragging ? 'bg-primary-400/40' : ''
          }`}
        >
          <div className={`${
            direction === 'horizontal' ? 'w-0.5 h-6' : 'h-0.5 w-6'
          } bg-primary-300/60 rounded-full`} />
        </div>
      </div>
      
      <div 
        style={{ 
          [direction === 'horizontal' ? 'width' : 'height']: `${100 - size}%`,
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: direction === 'horizontal' ? 'column' : 'row',
          [direction === 'horizontal' ? 'minWidth' : 'minHeight']: 0
        }}
        className={direction === 'horizontal' ? 'h-full' : 'w-full'}
      >
        {children[1]}
      </div>
    </div>
  );
}

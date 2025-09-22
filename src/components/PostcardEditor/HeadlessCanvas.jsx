import { useEffect, useRef, useCallback } from 'react';
import { useHeadlessEngine } from './HeadlessEngineProvider';

const HeadlessCanvas = ({ isVisible, currentPageId = 0 }) => {
  const canvasRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const { engine, isLoaded } = useHeadlessEngine();

  // Function to adjust canvas zoom with proper padding
  const adjustCanvasZoom = useCallback(async () => {
    if (!engine || !canvasRef.current) return;

    try {
      const pages = engine.scene.getPages();
      if (pages.length === 0) return;

      // Get current page based on currentPageId
      const pageToShow = pages[currentPageId] || pages[0];

      // Hide all pages except the current one
      pages.forEach((pageId, index) => {
        engine.block.setVisible(pageId, index === currentPageId);
      });

      // Get container dimensions
      const containerRect = canvasRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      if (containerWidth === 0 || containerHeight === 0) {
        console.warn('Container has no dimensions yet');
        return;
      }

      console.log('Container dimensions:', containerWidth, 'x', containerHeight);

      // Get the page dimensions to calculate proper fitting
      const pageWidth = engine.block.getWidth(pageToShow); // in scene units (inches)
      const pageHeight = engine.block.getHeight(pageToShow); // in scene units (inches)
      
      console.log('Page dimensions:', pageWidth, 'x', pageHeight, 'inches');
      
      // Calculate padding as percentage of container size (similar to Advanced Editor)
      const paddingPercent = 0.1; // 10% padding
      const paddingX = containerWidth * paddingPercent;
      const paddingY = containerHeight * paddingPercent;
      
      // Use zoomToBlock with calculated padding
      await engine.scene.zoomToBlock(pageToShow, paddingY, paddingX, paddingY, paddingX);
      
      // Fine-tune the zoom level if needed
      const zoomLevel = engine.scene.getZoomLevel();
      console.log('Current zoom level:', zoomLevel);
      
      // Calculate the optimal zoom to fit the content
      const contentWidth = pageWidth * 300; // Convert inches to pixels at 300 DPI
      const contentHeight = pageHeight * 300;
      const availableWidth = containerWidth - (2 * paddingX);
      const availableHeight = containerHeight - (2 * paddingY);
      
      const scaleX = availableWidth / contentWidth;
      const scaleY = availableHeight / contentHeight;
      const optimalScale = Math.min(scaleX, scaleY) * zoomLevel;
      
      console.log('Optimal scale:', optimalScale);
      
      // Apply the optimal zoom level
      if (optimalScale < zoomLevel) {
        engine.scene.setZoomLevel(optimalScale);
      }
    } catch (error) {
      console.error('Failed to zoom to page:', error);
    }
  }, [engine, currentPageId]);

  // Attach canvas to DOM
  useEffect(() => {
    const container = canvasRef.current;
    const canvas = engine?.element;

    if (!isLoaded || !canvas || !container) {
      return;
    }

    // Set canvas element styles to fill container
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.position = 'relative';

    // Append the engine's canvas element to our container
    container.appendChild(canvas);

    // Initial zoom adjustment with a slight delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      adjustCanvasZoom();
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      if (container && canvas && container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, [isLoaded, engine, adjustCanvasZoom]);

  // Set up ResizeObserver for canvas resizing
  useEffect(() => {
    if (!isLoaded || !canvasRef.current) return;

    // Clean up existing observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    // Create new observer
    resizeObserverRef.current = new ResizeObserver(() => {
      adjustCanvasZoom();
    });

    // Observe the container
    resizeObserverRef.current.observe(canvasRef.current);

    // Also handle window resize
    const handleResize = () => {
      adjustCanvasZoom();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoaded, adjustCanvasZoom]);

  // Adjust zoom when page changes
  useEffect(() => {
    if (isLoaded) {
      adjustCanvasZoom();
    }
  }, [currentPageId, isLoaded, adjustCanvasZoom]);

  return (
    <div
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        visibility: isVisible ? 'visible' : 'hidden',
        position: 'relative',
        overflow: 'hidden',
        background: '#f3f4f6',
        borderRadius: '8px'
      }}
    />
  );
};

export default HeadlessCanvas;
import React, { useEffect, useState } from 'react';

const DebugView = ({ cesdk, containerRef }) => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const updateDebugInfo = () => {
      const info = {};
      
      // Container info
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const computed = window.getComputedStyle(containerRef.current);
        info.container = {
          width: rect.width,
          height: rect.height,
          visible: rect.width > 0 && rect.height > 0,
          display: computed.display,
          position: computed.position,
          overflow: computed.overflow
        };
      }
      
      // Canvas info
      const canvas = containerRef?.current?.querySelector('canvas');
      if (canvas) {
        info.canvas = {
          found: true,
          width: canvas.width,
          height: canvas.height,
          style: {
            width: canvas.style.width,
            height: canvas.style.height,
            display: canvas.style.display,
            visibility: canvas.style.visibility
          },
          parent: canvas.parentElement?.className
        };
      } else {
        info.canvas = { found: false };
      }
      
      // CE.SDK info
      if (cesdk) {
        try {
          const pages = cesdk.engine.scene.getPages();
          info.cesdk = {
            initialized: true,
            pages: pages.length,
            camera: cesdk.engine.scene.getZoomLevel()
          };
        } catch (e) {
          info.cesdk = { initialized: true, error: e.message };
        }
      } else {
        info.cesdk = { initialized: false };
      }
      
      setDebugInfo(info);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    
    return () => clearInterval(interval);
  }, [cesdk, containerRef]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      left: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      zIndex: 10000,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Debug Info</h4>
      <pre style={{ margin: 0 }}>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
};

export default DebugView;
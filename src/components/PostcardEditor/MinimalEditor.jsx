import React, { useEffect, useRef } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';
// CE.SDK styles are loaded automatically

const MinimalEditor = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let cesdk;
    
    const initCESDK = async () => {
      try {
        // Create the editor with absolute minimal config
        cesdk = await CreativeEditorSDK.create(containerRef.current, {
          license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX',
          baseURL: '/cesdk-assets'
        });
        
        console.log('CESDK created');
        
        // Add default sources
        await cesdk.addDefaultAssetSources();
        console.log('Asset sources added');
        
        // Create a blank design scene
        await cesdk.engine.scene.createBlank();
        console.log('Blank scene created');
        
        // Create a page manually
        const page = cesdk.engine.block.create('page');
        cesdk.engine.block.setWidth(page, 1000);
        cesdk.engine.block.setHeight(page, 1000);
        cesdk.engine.scene.setPages([page]);
        
        // Add some content
        const rect = cesdk.engine.block.create('graphic');
        cesdk.engine.block.setWidth(rect, 400);
        cesdk.engine.block.setHeight(rect, 200);
        cesdk.engine.block.setPositionX(rect, 300);
        cesdk.engine.block.setPositionY(rect, 400);
        
        const fill = cesdk.engine.block.createFill('color');
        cesdk.engine.block.setColor(fill, 'fill/color/value', { r: 0, g: 0.5, b: 1, a: 1 });
        cesdk.engine.block.setFill(rect, fill);
        cesdk.engine.block.appendChild(page, rect);
        
        // Zoom to fit
        cesdk.engine.scene.zoomToBlock(page, 0.9);
        
        console.log('Scene setup complete');
        
        // Debug canvas
        setTimeout(() => {
          const allCanvas = document.querySelectorAll('canvas');
          console.log('All canvas elements in page:', allCanvas.length);
          allCanvas.forEach((c, i) => {
            console.log(`Canvas ${i}:`, c.width, 'x', c.height, 'parent:', c.parentElement?.className);
          });
        }, 1000);
        
      } catch (error) {
        console.error('CESDK Error:', error);
      }
    };
    
    initCESDK();
    
    return () => {
      if (cesdk) {
        cesdk.dispose();
      }
    };
  }, []);

  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 style={{ margin: '10px' }}>Minimal Editor Test</h2>
      <div 
        ref={containerRef} 
        style={{ 
          flex: 1,
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '500px',
          background: '#f0f0f0'
        }} 
      />
    </div>
  );
};

export default MinimalEditor;
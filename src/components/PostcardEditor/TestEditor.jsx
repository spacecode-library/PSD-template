import React, { useEffect, useRef } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';

const TestEditor = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let instance;
    
    const initEditor = async () => {
      try {
        // Very basic initialization
        instance = await CreativeEditorSDK.create(containerRef.current, {
          license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX'
        });
        
        console.log('Test editor created');
        
        // IMPORTANT: Add default asset sources BEFORE creating scene
        await instance.addDefaultAssetSources();
        
        // Now create a simple scene
        await instance.createDesignScene();
        
        const page = instance.engine.scene.getPages()[0];
        instance.engine.block.setWidth(page, 800);
        instance.engine.block.setHeight(page, 600);
        
        // Add a simple text
        const text = instance.engine.block.create('//ly.img.ubq/text');
        instance.engine.block.setString(text, 'text/text', 'Canvas Test');
        instance.engine.block.setFloat(text, 'text/fontSize', 40);
        instance.engine.block.setPositionX(text, 100);
        instance.engine.block.setPositionY(text, 100);
        instance.engine.block.setWidth(text, 400);
        instance.engine.block.appendChild(page, text);
        
        // Zoom to fit
        await instance.engine.scene.zoomToBlock(page, 0.9);
        
        // Check for canvas
        setTimeout(() => {
          const canvas = containerRef.current?.querySelector('canvas');
          console.log('Test canvas found:', !!canvas);
          if (canvas) {
            console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
          }
        }, 500);
        
      } catch (error) {
        console.error('Test editor error:', error);
      }
    };
    
    initEditor();
    
    return () => {
      if (instance) {
        instance.dispose();
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <h2 style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
        Canvas Test
      </h2>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default TestEditor;
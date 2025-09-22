import React, { useEffect, useRef } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';

const BasicEditor = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let cesdk = null;
    
    async function init() {
      try {
        console.log('BasicEditor: Initializing...');
        console.log('Container:', containerRef.current);
        
        cesdk = await CreativeEditorSDK.create(containerRef.current, {
          license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX'
        });
        
        console.log('BasicEditor: CE.SDK created');
        
        // Add sources first
        await cesdk.addDefaultAssetSources();
        console.log('BasicEditor: Asset sources added');
        
        // Create scene
        await cesdk.createDesignScene();
        console.log('BasicEditor: Scene created');
        
        // Check what happened
        setTimeout(() => {
          const container = containerRef.current;
          console.log('BasicEditor: Container children:', container.children.length);
          console.log('BasicEditor: Container HTML:', container.innerHTML.substring(0, 500));
          
          // Check for shadow DOM
          const rootShadow = container.querySelector('#root-shadow');
          console.log('BasicEditor: Shadow root element:', rootShadow);
          if (rootShadow?.shadowRoot) {
            console.log('BasicEditor: Has shadow root!');
            const shadowCanvas = rootShadow.shadowRoot.querySelector('canvas');
            console.log('BasicEditor: Canvas in shadow DOM:', !!shadowCanvas);
          }
          
          const canvas = container.querySelector('canvas');
          console.log('BasicEditor: Canvas found:', !!canvas);
          
          if (!canvas) {
            // Check entire document
            const anyCanvas = document.querySelector('canvas');
            console.log('BasicEditor: Any canvas in document:', !!anyCanvas);
            if (anyCanvas) {
              console.log('Canvas parent:', anyCanvas.parentElement);
            }
          }
        }, 1000);
        
      } catch (error) {
        console.error('BasicEditor: Error:', error);
      }
    }
    
    init();
    
    return () => {
      if (cesdk) {
        cesdk.dispose();
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <h1>Basic Editor Test</h1>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 100px)',
          background: '#ddd',
          position: 'relative'
        }} 
      />
    </div>
  );
};

export default BasicEditor;
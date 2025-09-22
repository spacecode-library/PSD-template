import React, { useEffect, useRef } from 'react';
import CreativeEngine from '@cesdk/engine';

const HeadlessTest = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const config = {
      license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX',
      userId: 'guides-user',
      baseURL: '/cesdk-assets'
    };

    let mounted = true;

    CreativeEngine.init(config).then(async (engine) => {
      if (!mounted || engineRef.current) return;
      
      engineRef.current = engine;

      // Append engine canvas to DOM
      if (canvasRef.current && engine.element) {
        canvasRef.current.appendChild(engine.element);
      }

      // Create scene
      await engine.scene.create();
      
      // Get the page
      const [page] = engine.block.findByType('page');
      
      // Set page size to postcard dimensions
      engine.block.setFloat(page, 'width', 5.3);
      engine.block.setFloat(page, 'height', 7.5);
      
      // Add a simple text block
      const textBlock = engine.block.create('text');
      engine.block.setString(textBlock, 'text/text', 'Hello Postcard!');
      engine.block.setFloat(textBlock, 'width', 4);
      engine.block.setFloat(textBlock, 'height', 1);
      engine.block.appendChild(page, textBlock);
      
      // Zoom to fit
      engine.scene.zoomToBlock(page);
    }).catch(err => {
      console.error('Failed to initialize engine:', err);
    });

    return () => {
      mounted = false;
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div ref={canvasRef} style={{ width: '100%', height: '100%', background: '#f0f0f0' }} />
    </div>
  );
};

export default HeadlessTest;
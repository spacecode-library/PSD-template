import React, { useRef } from 'react';
import CreativeEngine from '@cesdk/engine';
import { createBusinessServicesScene, createProfessionalAnnouncementScene } from './createPostcardScene';

const SceneGenerator = () => {
  const canvasRef = useRef(null);

  const generateBusinessServicesTemplate = async () => {
    const engine = await CreativeEngine.init({
      license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX'
    });

    try {
      await createBusinessServicesScene(engine);
      
      // Export scene as string
      const sceneString = await engine.scene.saveToString();
      
      // Download scene file
      const blob = new Blob([sceneString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'business-services.scene';
      a.click();
      
      // Export preview image
      const pages = engine.scene.getPages();
      const imageBlob = await engine.block.export(pages[0], 'image/png', {
        dpi: 144,
        jpegQuality: 0.9
      });
      
      const imgUrl = URL.createObjectURL(imageBlob);
      const img = document.createElement('a');
      img.href = imgUrl;
      img.download = 'business-services-preview.png';
      img.click();
      
    } finally {
      engine.dispose();
    }
  };

  const generateProfessionalTemplate = async () => {
    const engine = await CreativeEngine.init({
      license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX'
    });

    try {
      await createProfessionalAnnouncementScene(engine);
      
      // Export scene as string
      const sceneString = await engine.scene.saveToString();
      
      // Download scene file
      const blob = new Blob([sceneString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'professional-announcement.scene';
      a.click();
      
      // Export preview image
      const pages = engine.scene.getPages();
      const imageBlob = await engine.block.export(pages[0], 'image/png', {
        dpi: 144,
        jpegQuality: 0.9
      });
      
      const imgUrl = URL.createObjectURL(imageBlob);
      const img = document.createElement('a');
      img.href = imgUrl;
      img.download = 'professional-announcement-preview.png';
      img.click();
      
    } finally {
      engine.dispose();
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Postcard Template Generator</h1>
      <p>Click the buttons below to generate scene files and preview images</p>
      
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px' }}>
        <button 
          onClick={generateBusinessServicesTemplate}
          style={{
            padding: '16px 32px',
            fontSize: '16px',
            background: '#17A2B8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Generate Business Services Template
        </button>
        
        <button 
          onClick={generateProfessionalTemplate}
          style={{
            padding: '16px 32px',
            fontSize: '16px',
            background: '#2C3E50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Generate Professional Announcement Template
        </button>
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default SceneGenerator;
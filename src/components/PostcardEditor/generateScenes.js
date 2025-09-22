// This file generates the scene files for our templates
// Run this with a CE.SDK instance to create the .scene files

import CreativeEngine from '@cesdk/engine';
import { createBusinessServicesScene, createProfessionalAnnouncementScene } from './createPostcardScene';

export const generateTemplateScenes = async () => {
  // Initialize the engine
  const engine = await CreativeEngine.init({
    license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX'
  });

  try {
    // Generate Business Services template
    console.log('Generating Business Services template...');
    await createBusinessServicesScene(engine);
    
    // Save as scene file
    const businessServicesScene = await engine.scene.saveToString();
    
    // Create a blob and download link
    const blob1 = new Blob([businessServicesScene], { type: 'application/json' });
    const url1 = URL.createObjectURL(blob1);
    const a1 = document.createElement('a');
    a1.href = url1;
    a1.download = 'business-services.scene';
    a1.click();
    URL.revokeObjectURL(url1);
    
    // Generate Professional Announcement template
    console.log('Generating Professional Announcement template...');
    await createProfessionalAnnouncementScene(engine);
    
    // Save as scene file
    const professionalAnnouncementScene = await engine.scene.saveToString();
    
    // Create a blob and download link
    const blob2 = new Blob([professionalAnnouncementScene], { type: 'application/json' });
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement('a');
    a2.href = url2;
    a2.download = 'professional-announcement.scene';
    a2.click();
    URL.revokeObjectURL(url2);
    
    console.log('Templates generated successfully!');
    
  } catch (error) {
    console.error('Error generating templates:', error);
  } finally {
    engine.dispose();
  }
};

// Export function to generate preview images
export const generatePreviewImages = async (engine) => {
  const pages = engine.scene.getPages();
  if (pages.length === 0) return null;
  
  const page = pages[0];
  
  // Export as PNG for preview
  const blob = await engine.block.export(page, 'image/png', {
    dpi: 144,
    jpegQuality: 0.9
  });
  
  return blob;
};
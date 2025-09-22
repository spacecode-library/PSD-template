import CreativeEngine from '@cesdk/engine';

class PSDThumbnailGenerator {
  static async generateThumbnail(psdUrl, width = 300, height = 424) {
    let engine = null;
    
    try {
      // Initialize a headless engine for thumbnail generation
      const config = {
        license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX',
        userId: 'thumbnail-generator',
        baseURL: '/cesdk-assets'
      };
      
      // Create a temporary container
      const container = document.createElement('div');
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      
      engine = await CreativeEngine.init(config);
      
      // Attach to container for rendering
      if (engine.element) {
        container.appendChild(engine.element);
      }
      
      // Create scene
      await engine.scene.create();
      
      // Try to load PSD (this will fail for now, so we'll create a placeholder)
      const page = engine.block.findByType('page')[0];
      if (page) {
        // For now, create a colored placeholder based on template
        // In production, you would use the PSD importer
        const blob = await engine.block.export(page, 'image/png', {
          targetWidth: width,
          targetHeight: height
        });
        
        const url = URL.createObjectURL(blob);
        
        // Clean up
        document.body.removeChild(container);
        engine.dispose();
        
        return url;
      }
      
      throw new Error('Failed to create thumbnail');
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      
      // Clean up on error
      if (engine) {
        engine.dispose();
      }
      
      // Return null to trigger fallback preview
      return null;
    }
  }
  
  static async generateFromTemplate(template, width = 300, height = 424) {
    // For templates without PSD, generate a preview based on colors
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = template.primaryColor || '#20B2AA';
    ctx.fillRect(0, 0, width, height);
    
    // Add some design elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.2, width * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Add template name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(template.name, width / 2, height / 2);
    
    // Add features
    ctx.font = '14px Arial';
    ctx.globalAlpha = 0.8;
    template.features.slice(0, 3).forEach((feature, i) => {
      ctx.fillText(feature, width / 2, height / 2 + 40 + (i * 20));
    });
    
    return canvas.toDataURL('image/png');
  }
}
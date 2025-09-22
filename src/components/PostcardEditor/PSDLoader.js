import CreativeEngine from '@cesdk/engine';
import { PSDParser, addGoogleFontsAssetLibrary, createWebEncodeBufferToPNG } from '@imgly/psd-importer';

export class PSDLoader {
  static async loadPSDToScene(engine, psdPath, onProgress) {
    try {
      // Notify progress
      onProgress?.({ stage: 'fetching', message: 'Loading PSD file...' });
      
      // Fetch the PSD file
      const psdBuffer = await this.fetchPSDBuffer(psdPath);
      
      if (!psdBuffer) {
        throw new Error('Failed to load PSD buffer');
      }
      
      onProgress?.({ stage: 'processing', message: 'Processing PSD...' });
      
      // Process the PSD
      return await this.processPSDBuffer(engine, psdBuffer, onProgress);
      
    } catch (error) {
      console.error('Error loading PSD:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async loadPSDFromLocal(engine, file, onProgress) {
    try {
      onProgress?.({ stage: 'fetching', message: 'Reading file...' });
      
      const psdBuffer = await file.arrayBuffer();
      
      onProgress?.({ stage: 'processing', message: 'Processing PSD...' });
      
      return await this.processPSDBuffer(engine, psdBuffer, onProgress);
      
    } catch (error) {
      console.error('Error loading PSD:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async fetchPSDBuffer(psdPath) {
    // Check if it's a data URL
    if (psdPath.startsWith('data:')) {
      const base64Data = psdPath.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }
    
    // Regular HTTP fetch
    const response = await fetch(psdPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch PSD: ${response.statusText}`);
    }
    const psdBlob = await response.blob();
    return await psdBlob.arrayBuffer();
  }
  
  static async processPSDBuffer(engine, psdBuffer, onProgress) {
    // Add early validation checks
    if (!engine || !engine.scene || !engine.block) {
      throw new Error('Engine is not properly initialized or has been disposed');
    }
    
    console.log('PSD loaded, size:', psdBuffer.byteLength);
    
    // Clear any existing scene content safely
    try {
      let scene = engine.scene.get();
      if (!scene) {
        console.log('No scene exists, creating one');
        scene = engine.scene.create();
        
        // Validate scene creation
        if (!scene || !engine.block.isValid(scene)) {
          throw new Error('Failed to create valid scene');
        }
      } else {
        // Check if engine is still valid before clearing pages
        if (!engine.block.isValid(scene)) {
          console.warn('Scene is no longer valid, creating new one');
          scene = engine.scene.create();
        } else {
          // Clear existing pages safely
          try {
            const existingPages = engine.scene.getPages();
            console.log('Existing pages:', existingPages.length);
            existingPages.forEach(page => {
              try {
                if (engine.block.isValid(page)) {
                  console.log('Destroying page:', page);
                  engine.block.destroy(page);
                }
              } catch (pageError) {
                console.warn(`Failed to destroy page ${page}:`, pageError);
              }
            });
          } catch (pagesError) {
            console.warn('Error getting pages:', pagesError);
          }
        }
      }
    } catch (err) {
      console.warn('Could not clear existing pages:', err);
      // Try to create a fresh scene
      try {
        const scene = engine.scene.create();
        if (!scene) {
          throw new Error('Failed to create scene after error');
        }
      } catch (createError) {
        throw new Error(`Engine appears to be disposed: ${createError.message}`);
      }
    }
    
    // Parse PSD file
    onProgress?.({ stage: 'parsing', message: 'Parsing PSD layers...' });
    console.log('Parsing PSD file...');
    
    await addGoogleFontsAssetLibrary(engine);
    
    let parser = null;
    try {
      // Check engine validity before parsing
      if (!engine || !engine.scene || !engine.block) {
        throw new Error('Engine became invalid during PSD processing');
      }

      parser = await PSDParser.fromFile(
        engine,
        psdBuffer,
        createWebEncodeBufferToPNG()
      );
      
      // Check if parser was created successfully
      if (!parser) {
        throw new Error('Failed to create PSD parser');
      }

      const result = await parser.parse();
      
      // Validate engine is still available after parsing
      if (!engine || !engine.scene || !engine.block) {
        throw new Error('Engine was disposed during PSD parsing');
      }
      
      console.log('PSD parsed successfully');
      
      // Get the imported page with error handling
      let pages;
      try {
        pages = engine.scene.getPages();
      } catch (pagesError) {
        throw new Error(`Failed to get pages after parsing: ${pagesError.message}`);
      }
      
      console.log('Pages after PSD import:', pages.length);
      
      if (pages.length > 0) {
        const page = pages[0];
        
        // Validate page is still valid
        if (!engine.block.isValid(page)) {
          throw new Error('Imported page is not valid');
        }
        
        console.log('First page ID:', page);
        
        try {
          // Ensure proper page dimensions
          const pageWidth = engine.block.getWidth(page);
          const pageHeight = engine.block.getHeight(page);
          console.log('Page dimensions:', pageWidth, 'x', pageHeight);
          
          // Make sure page is visible
          engine.block.setVisible(page, true);
          
          // Get all blocks in the page
          const children = engine.block.getChildren(page);
          console.log('Page has', children.length, 'children');
          
          // Make all children visible with validation and enable editing capabilities
          children.forEach(child => {
            try {
              if (engine.block.isValid(child)) {
                engine.block.setVisible(child, true);
                
                // Check if it's an image that can be replaced
                const type = engine.block.getType(child);
                if (type === '//ly.img.ubq/graphic') {
                  // Tag images for replacement functionality
                  engine.block.setMetadata(child, 'replaceableImage', 'true');
                  // Enable fill changes for image replacement
                  engine.block.setScopeEnabled(child, 'fill/change', true);
                  console.log(`✅ Enabled image editing for PSD graphic: ${engine.block.getName(child) || child}`);
                } else if (type === '//ly.img.ubq/text') {
                  // Enable text editing for all text blocks
                  engine.block.setScopeEnabled(child, 'text/edit', true);
                  const textContent = engine.block.getString(child, 'text/text');
                  console.log(`✅ Enabled text editing for PSD text: "${engine.block.getName(child) || child}" - Content: "${textContent}"`);
                  
                  // Ensure text is selectable
                  engine.block.setScopeEnabled(child, 'editor/select', true);
                  // But disable moving/resizing
                  engine.block.setScopeEnabled(child, 'layer/move', false);
                  engine.block.setScopeEnabled(child, 'layer/resize', false);
                  engine.block.setScopeEnabled(child, 'layer/rotate', false);
                }
              }
            } catch (childError) {
              console.warn(`Error processing child block ${child}:`, childError);
            }
          });
          
          // Zoom to fit with error handling
          try {
            await engine.scene.zoomToBlock(page, 0.8);
          } catch (zoomError) {
            console.warn('Failed to zoom to page:', zoomError);
          }
          
          onProgress?.({ stage: 'complete', message: 'PSD loaded successfully!' });
        } catch (processingError) {
          throw new Error(`Error processing imported page: ${processingError.message}`);
        }
      } else {
        console.error('No pages found after PSD import!');
        throw new Error('No pages found after PSD import');
      }
      
      return {
        success: true,
        logger: result.logger,
        messages: result.logger.getMessages()
      };
      
    } catch (parsingError) {
      // Better error handling with context
      const errorMessage = parsingError.message || 'Unknown parsing error';
      console.error('PSD parsing failed:', errorMessage);
      throw new Error(`PSD parsing failed: ${errorMessage}`);
    } finally {
      // Clean up parser if needed
      try {
        if (parser) {
          parser = null;
        }
      } catch (cleanupError) {
        console.warn('Error cleaning up parser:', cleanupError);
      }
    }
  }
}
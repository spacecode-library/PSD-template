import React, { useRef, useEffect, useState } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';

const SimplifiedEditorTest = () => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    let cesdk;
    
    const initEditor = async () => {
      try {
        setStatus('Creating editor...');
        
        cesdk = await CreativeEditorSDK.create(containerRef.current, {
          license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX',
          role: 'Creator',
          theme: 'light'
        });

        setStatus('Adding asset sources...');
        
        // Add basic asset sources
        await cesdk.addDefaultAssetSources();
        await cesdk.addDemoAssetSources({ sceneMode: 'Design' });
        
        setStatus('Creating scene...');
        
        // Create a simple scene
        await cesdk.createDesignScene();
        
        // Get the page
        const page = cesdk.engine.scene.getPages()[0];
        cesdk.engine.block.setWidth(page, 5.3);
        cesdk.engine.block.setHeight(page, 7.5);
        
        // Add a replaceable image
        const imageBlock = cesdk.engine.block.create('//ly.img.ubq/image');
        cesdk.engine.block.setWidth(imageBlock, 4);
        cesdk.engine.block.setHeight(imageBlock, 3);
        cesdk.engine.block.setPositionX(imageBlock, 0.65);
        cesdk.engine.block.setPositionY(imageBlock, 2);
        
        // Set a placeholder image
        cesdk.engine.block.setString(imageBlock, 'image/imageFileURI', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop');
        
        // Make image replaceable
        cesdk.engine.block.setBoolean(imageBlock, 'image/showsPlaceholderOverlay', true);
        cesdk.engine.block.setBoolean(imageBlock, 'placeholderControls/showReplace', true);
        
        cesdk.engine.block.appendChild(page, imageBlock);
        
        // Add custom image source with 5 images
        const customImageSource = {
          id: 'postcard-images',
          findAssets: async () => {
            return {
              assets: [
                {
                  id: 'office-1',
                  type: 'ly.img.image',
                  label: 'Modern Office',
                  meta: {
                    uri: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop',
                    thumbUri: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=200&h=150&fit=crop',
                    mimeType: 'image/jpeg'
                  }
                },
                {
                  id: 'team-1',
                  type: 'ly.img.image',
                  label: 'Team Meeting',
                  meta: {
                    uri: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
                    thumbUri: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=150&fit=crop',
                    mimeType: 'image/jpeg'
                  }
                },
                {
                  id: 'laundry-1',
                  type: 'ly.img.image',
                  label: 'Laundry Service',
                  meta: {
                    uri: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop',
                    thumbUri: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop',
                    mimeType: 'image/jpeg'
                  }
                },
                {
                  id: 'cleaning-1',
                  type: 'ly.img.image',
                  label: 'Cleaning Service',
                  meta: {
                    uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
                    thumbUri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop',
                    mimeType: 'image/jpeg'
                  }
                },
                {
                  id: 'professional-1',
                  type: 'ly.img.image',
                  label: 'Professional Service',
                  meta: {
                    uri: 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=800&h=600&fit=crop',
                    thumbUri: 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=200&h=150&fit=crop',
                    mimeType: 'image/jpeg'
                  }
                }
              ],
              total: 5,
              page: 0,
              perPage: 5
            };
          },
          applyAsset: async (asset) => {
            return {
              url: asset.meta.uri
            };
          }
        };
        
        // Add the custom source
        cesdk.engine.asset.addSource(customImageSource);
        
        setStatus('Editor loaded successfully!');
        
      } catch (error) {
        console.error('Editor error:', error);
        setStatus('Error: ' + error.message);
      }
    };

    initEditor();

    return () => {
      if (cesdk) {
        cesdk.dispose();
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '10px',
        borderRadius: '5px',
        zIndex: 1000
      }}>
        Status: {status}
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default SimplifiedEditorTest;
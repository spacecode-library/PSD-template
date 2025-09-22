import React, { useEffect, useRef, useState } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import './ImglyPostcardEditor.css';

const ImglyPostcardEditor = ({ 
  templateData, 
  onExport, 
  onSave,
  businessData = {}
}) => {
  const cesdk_container = useRef(null);
  const [cesdk, setCesdk] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initEditor = async () => {
      try {
        // TODO: Replace with your actual license key
        const config = {
          license: 'YOUR_LICENSE_KEY_HERE',
          userId: 'postcard-user',
          baseURL: '/cesdk-assets',
          ui: {
            elements: {
              panels: {
                settings: true,
              },
              navigation: {
                action: {
                  export: true,
                  save: true,
                },
              },
            },
          },
        };

        // Initialize the editor
        const instance = await CreativeEditorSDK.create(cesdk_container.current, config);
        
        // Configure for postcard dimensions (5.3" x 7.5" at 300 DPI)
        await instance.createDesignScene({
          designUnit: 'Inch',
          dimensions: {
            width: 5.3,
            height: 7.5,
          },
          pages: [
            {
              title: 'Front',
              width: 5.3,
              height: 7.5,
            },
            {
              title: 'Back',
              width: 5.3,
              height: 7.5,
            }
          ],
          bleedMargin: 0.125, // 1/8 inch bleed for printing
        });

        // Set up export callback
        instance.engine.editor.onExport = async () => {
          const blob = await instance.engine.block.export(
            instance.engine.scene.getPages()[0], 
            {
              mimeType: 'application/pdf',
              targetDPI: 300,
              includeBleed: true,
            }
          );
          if (onExport) {
            onExport(blob);
          }
        };

        setCesdk(instance);
        setIsLoading(false);

        // Load template if provided
        if (templateData) {
          await loadTemplate(instance, templateData, businessData);
        }
      } catch (error) {
        console.error('Error initializing Creative Editor SDK:', error);
        setIsLoading(false);
      }
    };

    if (cesdk_container.current) {
      initEditor();
    }

    return () => {
      if (cesdk) {
        cesdk.dispose();
      }
    };
  }, []);

  const loadTemplate = async (editorInstance, template, data) => {
    try {
      const engine = editorInstance.engine;
      const scene = engine.scene;
      
      // Get the pages
      const pages = scene.getPages();
      if (pages.length < 2) return;

      const frontPage = pages[0];
      const backPage = pages[1];

      // Add background to front page
      const backgroundBlock = engine.block.create('graphic');
      engine.block.setWidth(backgroundBlock, 5.3);
      engine.block.setHeight(backgroundBlock, 7.5);
      engine.block.setFill(backgroundBlock, engine.block.createFill('color'));
      engine.block.setColor(backgroundBlock, 'fill/color/value', { r: 0.95, g: 0.95, b: 0.95 });
      engine.block.appendChild(frontPage, backgroundBlock);

      // Add business name text
      if (data.businessName) {
        const titleBlock = engine.block.create('text');
        engine.block.setString(titleBlock, 'text/text', data.businessName);
        engine.block.setFloat(titleBlock, 'text/fontSize', 36);
        engine.block.setEnum(titleBlock, 'text/horizontalAlignment', 'Center');
        engine.block.setPositionX(titleBlock, 2.65); // Center horizontally
        engine.block.setPositionY(titleBlock, 1);
        engine.block.appendChild(frontPage, titleBlock);
      }

      // Add headline
      if (data.headline) {
        const headlineBlock = engine.block.create('text');
        engine.block.setString(headlineBlock, 'text/text', data.headline);
        engine.block.setFloat(headlineBlock, 'text/fontSize', 24);
        engine.block.setEnum(headlineBlock, 'text/horizontalAlignment', 'Center');
        engine.block.setPositionX(headlineBlock, 2.65);
        engine.block.setPositionY(headlineBlock, 2);
        engine.block.appendChild(frontPage, headlineBlock);
      }

      // Add offer text
      if (data.offerText) {
        const offerBlock = engine.block.create('text');
        engine.block.setString(offerBlock, 'text/text', data.offerText);
        engine.block.setFloat(offerBlock, 'text/fontSize', 20);
        engine.block.setEnum(offerBlock, 'text/horizontalAlignment', 'Center');
        engine.block.setPositionX(offerBlock, 2.65);
        engine.block.setPositionY(offerBlock, 3);
        engine.block.appendChild(frontPage, offerBlock);
      }

      // Set up back page with address area
      const addressAreaBlock = engine.block.create('graphic');
      engine.block.setWidth(addressAreaBlock, 2.5);
      engine.block.setHeight(addressAreaBlock, 3);
      engine.block.setPositionX(addressAreaBlock, 2.5);
      engine.block.setPositionY(addressAreaBlock, 2);
      engine.block.setFill(addressAreaBlock, engine.block.createFill('color'));
      engine.block.setColor(addressAreaBlock, 'fill/color/value', { r: 1, g: 1, b: 1 });
      engine.block.appendChild(backPage, addressAreaBlock);

      // Add placeholder text for address
      const addressLabel = engine.block.create('text');
      engine.block.setString(addressLabel, 'text/text', '[Recipient Address Area]');
      engine.block.setFloat(addressLabel, 'text/fontSize', 12);
      engine.block.setPositionX(addressLabel, 2.7);
      engine.block.setPositionY(addressLabel, 3);
      engine.block.appendChild(backPage, addressLabel);

    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const saveDesign = async () => {
    if (cesdk && onSave) {
      try {
        const scene = await cesdk.engine.scene.saveToString();
        onSave(scene);
      } catch (error) {
        console.error('Error saving design:', error);
      }
    }
  };

  return (
    <div className="imgly-editor-container">
      {isLoading && (
        <div className="editor-loading">
          <div className="loading-spinner"></div>
          <p>Loading editor...</p>
        </div>
      )}
      <div 
        ref={cesdk_container} 
        className="cesdk-container"
        style={{ width: '100%', height: '600px' }}
      />
      {cesdk && (
        <div className="editor-actions">
          <button onClick={saveDesign} className="save-button">
            Save Design
          </button>
          <button onClick={() => cesdk.engine.editor.onExport()} className="export-button">
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ImglyPostcardEditor;
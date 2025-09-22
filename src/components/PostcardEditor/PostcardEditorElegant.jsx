import React, { useState, useEffect, useRef } from 'react';
import CreativeEngine from '@cesdk/engine';
import TemplateSelector from './TemplateSelector.elegant';
import SimpleEditorToolbar from './SimpleEditorToolbar.enhanced';
import AdvancedEditorToolbar from './AdvancedEditorToolbar';
import { PSDLoader } from './PSDLoader';
import { PSD_SERVER_URL } from './constants';
import './PostcardEditor.elegant.css';

const config = {
  license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX',
  userId: 'guides-user',
  baseURL: '/cesdk-assets'
};

// Postcard dimensions
const POSTCARD_WIDTH_INCHES = 5.3;
const POSTCARD_HEIGHT_INCHES = 7.5;

const PostcardEditorElegant = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [engine, setEngine] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const selectionUnsubscribeRef = useRef(null);

  // Initialize engine when template is selected
  useEffect(() => {
    if (!selectedTemplate) return;

    let mounted = true;
    setIsLoading(true);
    setError(null);

    const initializeEngine = async () => {
      try {
        setLoadingMessage('Initializing editor...');
        
        // Initialize engine
        const instance = await CreativeEngine.init(config);
        
        if (!mounted) {
          instance.dispose();
          return;
        }

        engineRef.current = instance;
        setEngine(instance);

        // Append canvas to DOM
        if (canvasRef.current && instance.element) {
          canvasRef.current.appendChild(instance.element);
        }

        // Add asset sources
        setLoadingMessage('Loading assets...');
        await instance.addDefaultAssetSources();
        
        // Create scene
        const sceneId = await instance.scene.create();

        // Load template
        if (selectedTemplate.psdFile) {
          const psdUrl = `${PSD_SERVER_URL}/psd/${selectedTemplate.psdFile}`;
          const result = await PSDLoader.loadPSDToScene(instance, psdUrl, (progress) => {
            setLoadingMessage(progress.message || 'Loading template...');
          });
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to load PSD');
          }
        } else {
          setLoadingMessage('Creating template...');
          await createTemplateContent(instance, selectedTemplate);
        }

        // Get page and zoom to fit
        const [page] = instance.block.findByType('page');
        if (page) {
          if (!selectedTemplate.psdFile) {
            instance.block.setFloat(page, 'width', POSTCARD_WIDTH_INCHES);
            instance.block.setFloat(page, 'height', POSTCARD_HEIGHT_INCHES);
          }
          instance.scene.zoomToBlock(page, 0.9);
        }

        // Set up selection tracking
        selectionUnsubscribeRef.current = instance.block.onSelectionChanged(() => {
          const selected = instance.block.findAllSelected();
          setSelectedBlocks(selected);
        });

        setIsLoading(false);
        setLoadingMessage('');
      } catch (error) {
        console.error('Failed to initialize engine:', error);
        setError(error.message || 'Failed to initialize editor');
        setIsLoading(false);
        
        // Clean up on error
        if (engineRef.current) {
          engineRef.current.dispose();
          engineRef.current = null;
          setEngine(null);
        }
      }
    };

    initializeEngine();

    // Cleanup function
    return () => {
      mounted = false;
      
      if (selectionUnsubscribeRef.current) {
        selectionUnsubscribeRef.current();
        selectionUnsubscribeRef.current = null;
      }
      
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
        setEngine(null);
      }
      
      if (canvasRef.current) {
        canvasRef.current.innerHTML = '';
      }
    };
  }, [selectedTemplate]);

  const createTemplateContent = async (engine, template) => {
    const [page] = engine.block.findByType('page');
    if (!page) return;

    // Add background color
    if (template.primaryColor) {
      engine.block.setFillEnabled(page, true);
      const fill = engine.block.getFill(page);
      engine.block.setColor(fill, 'fill/color/value', {
        r: parseInt(template.primaryColor.slice(1, 3), 16) / 255,
        g: parseInt(template.primaryColor.slice(3, 5), 16) / 255,
        b: parseInt(template.primaryColor.slice(5, 7), 16) / 255,
        a: 1
      });
    }

    // Add main heading
    const headingBlock = engine.block.create('text');
    engine.block.setString(headingBlock, 'text/text', 'Your Business Name');
    engine.block.setFloat(headingBlock, 'width', 4);
    engine.block.setFloat(headingBlock, 'height', 1);
    engine.block.setPositionX(headingBlock, 0.65);
    engine.block.setPositionY(headingBlock, 0.8);
    engine.block.appendChild(page, headingBlock);

    // Style the heading
    engine.block.setTextColor(headingBlock, {
      r: 1, g: 1, b: 1, a: 1
    });
    engine.block.setFloat(headingBlock, 'text/fontSize', 48);
    engine.block.setString(headingBlock, 'text/fontFileUri', 'https://cdn.img.ly/assets/v3/ly.img.typeface/fonts/Archivo/ArchivoBold.ttf');
    engine.block.setString(headingBlock, 'text/horizontalAlignment', 'Center');
    
    // Add subheading
    const subheadingBlock = engine.block.create('text');
    engine.block.setString(subheadingBlock, 'text/text', 'Professional Services');
    engine.block.setFloat(subheadingBlock, 'width', 4);
    engine.block.setFloat(subheadingBlock, 'height', 0.5);
    engine.block.setPositionX(subheadingBlock, 0.65);
    engine.block.setPositionY(subheadingBlock, 1.8);
    engine.block.appendChild(page, subheadingBlock);

    engine.block.setTextColor(subheadingBlock, {
      r: 1, g: 1, b: 1, a: 0.9
    });
    engine.block.setFloat(subheadingBlock, 'text/fontSize', 24);
    engine.block.setString(subheadingBlock, 'text/horizontalAlignment', 'Center');

    // Add sample image if template has image features
    if (template.features.includes('Image Areas') || template.features.includes('Photo Area')) {
      const imageBlock = engine.block.create('graphic');
      const shape = engine.block.createShape('rect');
      engine.block.setShape(imageBlock, shape);
      engine.block.setFloat(imageBlock, 'width', 2.5);
      engine.block.setFloat(imageBlock, 'height', 2);
      engine.block.setPositionX(imageBlock, 1.4);
      engine.block.setPositionY(imageBlock, 3.5);
      
      engine.block.setFillEnabled(imageBlock, true);
      const imageFill = engine.block.createFill('image');
      engine.block.setSourceSet(imageFill, 'fill/image/sourceSet', [
        {
          uri: 'https://img.ly/static/ubq_samples/sample_1_1024x683.jpg',
          width: 1024,
          height: 683
        }
      ]);
      engine.block.setFill(imageBlock, imageFill);
      engine.block.setMetadata(imageBlock, 'replaceableImage', 'true');
      engine.block.appendChild(page, imageBlock);
    }

    // Add contact section
    const contactText = engine.block.create('text');
    engine.block.setString(contactText, 'text/text', '(555) 123-4567\nwww.yourbusiness.com');
    engine.block.setFloat(contactText, 'width', 3);
    engine.block.setFloat(contactText, 'height', 0.8);
    engine.block.setPositionX(contactText, 1.15);
    engine.block.setPositionY(contactText, 6);
    engine.block.appendChild(page, contactText);
    
    engine.block.setTextColor(contactText, {
      r: 1, g: 1, b: 1, a: 1
    });
    engine.block.setFloat(contactText, 'text/fontSize', 18);
    engine.block.setString(contactText, 'text/horizontalAlignment', 'Center');

    // Lock non-editable elements
    const allBlocks = engine.block.getChildren(page);
    allBlocks.forEach(blockId => {
      const type = engine.block.getType(blockId);
      const isReplaceable = engine.block.getMetadata(blockId, 'replaceableImage');
      if (type !== 'text' && !isReplaceable) {
        engine.block.setBool(blockId, 'transformLocked', true);
      }
    });
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleExport = async () => {
    if (!engine) return;
    
    setIsLoading(true);
    setLoadingMessage('Exporting PDF...');
    
    try {
      const mimeType = 'application/pdf';
      const blob = await engine.block.export(engine.scene.get(), mimeType);
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `postcard-${selectedTemplate?.name || 'design'}-${Date.now()}.pdf`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export PDF. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setError(null);
  };

  const handleRetry = () => {
    const template = selectedTemplate;
    setSelectedTemplate(null);
    setError(null);
    setTimeout(() => {
      setSelectedTemplate(template);
    }, 100);
  };

  const toggleMode = () => {
    setIsSimpleMode(!isSimpleMode);
  };

  if (!selectedTemplate) {
    return <TemplateSelector onSelect={handleTemplateSelect} />;
  }

  return (
    <div className="postcard-editor-elegant">
      <div className="editor-header-elegant">
        <button className="back-btn" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
          </svg>
          Back
        </button>
        
        <div className="editor-title-section">
          <h1>Postcard Editor</h1>
          <span className="template-name">{selectedTemplate.name}</span>
        </div>

        <div className="header-actions">
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${isSimpleMode ? 'active' : ''}`}
              onClick={() => setIsSimpleMode(true)}
            >
              Simple
            </button>
            <button 
              className={`mode-btn ${!isSimpleMode ? 'active' : ''}`}
              onClick={() => setIsSimpleMode(false)}
            >
              Advanced
            </button>
          </div>
          
          <button 
            className="export-btn primary"
            onClick={handleExport}
            disabled={isLoading || error}
          >
            Export PDF
          </button>
        </div>
      </div>
      
      <div className="editor-content">
        <div className="canvas-area">
          <div className="canvas-wrapper">
            <div 
              ref={canvasRef} 
              className="cesdk-container"
            />
            
            {isLoading && (
              <div className="loading-overlay elegant">
                <div className="spinner"></div>
                <p>{loadingMessage || 'Loading...'}</p>
              </div>
            )}
            
            {error && (
              <div className="error-overlay elegant">
                <div className="error-box">
                  <div className="error-icon">⚠️</div>
                  <h3>Something went wrong</h3>
                  <p>{error}</p>
                  <div className="error-actions">
                    <button className="btn-secondary" onClick={handleBack}>
                      Choose Another Template
                    </button>
                    <button className="btn-primary" onClick={handleRetry}>
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {engine && !error && (
          <div className="toolbar-area">
            {isSimpleMode ? (
              <SimpleEditorToolbar
                cesdk={engine}
                selectedBlocks={selectedBlocks}
              />
            ) : (
              <AdvancedEditorToolbar
                cesdk={engine}
                selectedBlocks={selectedBlocks}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostcardEditorElegant;
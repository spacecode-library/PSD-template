import React, { useState, useEffect, useRef } from 'react';
import CreativeEngine from '@cesdk/engine';
import TemplateSelector from './TemplateSelector';
import EnhancedEditorToolbar from './EnhancedEditorToolbar';
import { PSDLoader } from './PSDLoader';
import { PSD_SERVER_URL } from './constants';
import './PostcardEditor.enhanced.css';

const config = {
  license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX',
  userId: 'guides-user',
  baseURL: '/cesdk-assets'
};

// Postcard dimensions in inches
const POSTCARD_WIDTH_INCHES = 5.3;
const POSTCARD_HEIGHT_INCHES = 7.5;

const PostcardEngineEditorPro = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [engine, setEngine] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [activeTab, setActiveTab] = useState('edit');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTool, setActiveTool] = useState('select');
  
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
        console.log('Initializing CreativeEngine...');
        
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
          console.log('Canvas appended to DOM');
        }

        // Add asset sources
        setLoadingMessage('Loading assets...');
        await instance.addDefaultAssetSources();
        
        // Only add demo assets in development
        if (import.meta.env.DEV) {
          await instance.addDemoAssetSources({ sceneMode: 'Design' });
        }

        // Create scene
        await instance.scene.create();
        console.log('Scene created');

        // Load template
        if (selectedTemplate.psdFile) {
          console.log('Loading PSD:', selectedTemplate.psdFile);
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

        // Get page and set dimensions if not from PSD
        const [page] = instance.block.findByType('page');
        if (page && !selectedTemplate.psdFile) {
          // Only set postcard dimensions for non-PSD templates
          instance.block.setFloat(page, 'width', POSTCARD_WIDTH_INCHES);
          instance.block.setFloat(page, 'height', POSTCARD_HEIGHT_INCHES);
        }
        
        // Zoom to fit
        if (page) {
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
      
      // Unsubscribe from selection changes
      if (selectionUnsubscribeRef.current) {
        selectionUnsubscribeRef.current();
        selectionUnsubscribeRef.current = null;
      }
      
      // Dispose engine
      if (engineRef.current) {
        console.log('Disposing engine');
        engineRef.current.dispose();
        engineRef.current = null;
        setEngine(null);
      }
      
      // Clear canvas
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
    engine.block.setString(headingBlock, 'text/text', 'YOUR BUSINESS NAME');
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
    engine.block.setString(subheadingBlock, 'text/text', 'Professional Services You Can Trust');
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

    // Add sample image placeholder if template has image features
    if (template.features.includes('Image Areas') || template.features.includes('Photo Area')) {
      const imageBlock = engine.block.create('graphic');
      const shape = engine.block.createShape('rect');
      engine.block.setShape(imageBlock, shape);
      engine.block.setFloat(imageBlock, 'width', 2.5);
      engine.block.setFloat(imageBlock, 'height', 2);
      engine.block.setPositionX(imageBlock, 1.4);
      engine.block.setPositionY(imageBlock, 3.5);
      
      // Add a placeholder fill
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
      
      // Mark as replaceable
      engine.block.setMetadata(imageBlock, 'replaceableImage', 'true');
      engine.block.appendChild(page, imageBlock);
    }

    // Add contact info section
    const contactBg = engine.block.create('graphic');
    const contactShape = engine.block.createShape('rect');
    engine.block.setShape(contactBg, contactShape);
    engine.block.setFloat(contactBg, 'width', 4.5);
    engine.block.setFloat(contactBg, 'height', 1.2);
    engine.block.setPositionX(contactBg, 0.4);
    engine.block.setPositionY(contactBg, 5.8);
    engine.block.setFillEnabled(contactBg, true);
    const contactFill = engine.block.getFill(contactBg);
    engine.block.setColor(contactFill, 'fill/color/value', {
      r: 0, g: 0, b: 0, a: 0.8
    });
    engine.block.appendChild(page, contactBg);
    
    // Add contact text
    const phoneText = engine.block.create('text');
    engine.block.setString(phoneText, 'text/text', '📞 (555) 123-4567');
    engine.block.setFloat(phoneText, 'width', 2);
    engine.block.setFloat(phoneText, 'height', 0.4);
    engine.block.setPositionX(phoneText, 0.65);
    engine.block.setPositionY(phoneText, 6);
    engine.block.appendChild(page, phoneText);
    
    engine.block.setTextColor(phoneText, {
      r: 1, g: 1, b: 1, a: 1
    });
    engine.block.setFloat(phoneText, 'text/fontSize', 20);
    
    // Add website text
    const websiteText = engine.block.create('text');
    engine.block.setString(websiteText, 'text/text', '🌐 www.yourbusiness.com');
    engine.block.setFloat(websiteText, 'width', 2);
    engine.block.setFloat(websiteText, 'height', 0.4);
    engine.block.setPositionX(websiteText, 2.65);
    engine.block.setPositionY(websiteText, 6);
    engine.block.appendChild(page, websiteText);
    
    engine.block.setTextColor(websiteText, {
      r: 1, g: 1, b: 1, a: 1
    });
    engine.block.setFloat(websiteText, 'text/fontSize', 20);

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
    // Small delay to ensure cleanup
    setTimeout(() => {
      setSelectedTemplate(template);
    }, 100);
  };

  const handleZoomIn = () => {
    if (engine && zoomLevel < 200) {
      const newZoom = Math.min(zoomLevel + 10, 200);
      setZoomLevel(newZoom);
      engine.scene.setZoomLevel(newZoom / 100);
    }
  };

  const handleZoomOut = () => {
    if (engine && zoomLevel > 50) {
      const newZoom = Math.max(zoomLevel - 10, 50);
      setZoomLevel(newZoom);
      engine.scene.setZoomLevel(newZoom / 100);
    }
  };

  const handleZoomReset = () => {
    if (engine) {
      setZoomLevel(100);
      const [page] = engine.block.findByType('page');
      if (page) {
        engine.scene.zoomToBlock(page, 0.9);
      }
    }
  };

  if (!selectedTemplate) {
    return <TemplateSelector onSelect={handleTemplateSelect} />;
  }

  return (
    <div className="postcard-editor-container">
      <div className="editor-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Templates
        </button>
        <h2 className="editor-title">Postcard Editor - {selectedTemplate.name}</h2>
        <button 
          className="export-button" 
          onClick={handleExport}
          disabled={isLoading || error}
        >
          Export PDF
        </button>
      </div>
      
      <div className="editor-workspace">
        {/* Left Tools Sidebar */}
        <div className="editor-tools-sidebar">
          <button 
            className={`tool-button ${activeTool === 'select' ? 'active' : ''}`}
            onClick={() => setActiveTool('select')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
              <path d="M13 13l6 6"/>
            </svg>
            <span className="tool-tooltip">Select Tool</span>
          </button>
          
          <button 
            className={`tool-button ${activeTool === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTool('text')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 7 4 4 20 4 20 7"/>
              <line x1="9" y1="20" x2="15" y2="20"/>
              <line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
            <span className="tool-tooltip">Add Text</span>
          </button>
          
          <button 
            className={`tool-button ${activeTool === 'shapes' ? 'active' : ''}`}
            onClick={() => setActiveTool('shapes')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            </svg>
            <span className="tool-tooltip">Add Shape</span>
          </button>
          
          <button 
            className={`tool-button ${activeTool === 'icons' ? 'active' : ''}`}
            onClick={() => setActiveTool('icons')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="tool-tooltip">Add Icons</span>
          </button>
        </div>

        {/* Main Canvas Area */}
        <div className="editor-main-area">
          <div className="canvas-container">
            <div 
              ref={canvasRef} 
              className="cesdk-wrapper"
              style={{ 
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            
            {/* Zoom Controls */}
            <div className="zoom-controls">
              <button className="zoom-btn" onClick={handleZoomOut}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <div className="zoom-value">{zoomLevel}%</div>
              <button className="zoom-btn" onClick={handleZoomIn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <button className="zoom-btn" onClick={handleZoomReset}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m6 6v-4.8m0 4.8h-4.8"/>
                  <path d="M3 3l6 6m-6-6v4.8m0-4.8h4.8"/>
                </svg>
              </button>
            </div>
            
            {isLoading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>{loadingMessage || 'Loading...'}</p>
              </div>
            )}
            
            {error && (
              <div className="error-overlay">
                <div className="error-content">
                  <h3>Oops! Something went wrong</h3>
                  <p>{error}</p>
                  <div className="error-actions">
                    <button className="retry-button" onClick={handleRetry}>
                      Try Again
                    </button>
                    <button className="back-button" onClick={handleBack}>
                      Choose Another Template
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Properties Panel */}
        {engine && !error && (
          <div className="editor-toolbar">
            <div className="toolbar-header">
              <h3>Properties & Tools</h3>
            </div>
            
            <div className="toolbar-tabs">
              <button 
                className={`toolbar-tab ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveTab('edit')}
              >
                Edit
              </button>
              <button 
                className={`toolbar-tab ${activeTab === 'style' ? 'active' : ''}`}
                onClick={() => setActiveTab('style')}
              >
                Style
              </button>
              <button 
                className={`toolbar-tab ${activeTab === 'assets' ? 'active' : ''}`}
                onClick={() => setActiveTab('assets')}
              >
                Assets
              </button>
            </div>
            
            <div className="toolbar-content">
              {activeTab === 'edit' && (
                <EnhancedEditorToolbar
                  cesdk={engine}
                  selectedBlocks={selectedBlocks}
                />
              )}
              
              {activeTab === 'style' && (
                <div className="properties-panel">
                  <h4>Template Info</h4>
                  <div className="property-row">
                    <span className="property-label">Name:</span>
                    <span className="property-value">{selectedTemplate.name}</span>
                  </div>
                  <div className="property-row">
                    <span className="property-label">Type:</span>
                    <span className="property-value">Postcard</span>
                  </div>
                  <div className="property-row">
                    <span className="property-label">Size:</span>
                    <span className="property-value">5.3" x 7.5"</span>
                  </div>
                </div>
              )}
              
              {activeTab === 'assets' && (
                <div className="control-group">
                  <p className="control-label">Asset management coming soon...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostcardEngineEditorPro;
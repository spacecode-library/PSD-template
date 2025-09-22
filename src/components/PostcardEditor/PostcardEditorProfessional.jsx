import React, { useState, useEffect, useRef, useCallback } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import TemplateSelector from './TemplateSelector.enhanced';
import FormBasedEditor from './FormBasedEditor';
import { configureAssetSources, getAssetLibraryConfig } from './assetSources';
import { PSDLoader } from './PSDLoader';
import './PostcardEditor.professional.css';

// Configuration based on IMG.LY best practices
const getConfig = (mode, license) => {
  const baseConfig = {
    license,
    userId: 'guides-user',
    baseURL: '/cesdk-assets',
    theme: 'light',
  };

  if (mode === 'simple') {
    return {
      ...baseConfig,
      role: 'Adopter',
      ui: {
        elements: {
          view: 'default',
          navigation: {
            show: true,
            position: 'top',
            action: {
              close: false,
              back: true,
              load: false,
              save: false,
              export: {
                show: true,
                format: ['application/pdf', 'image/png']
              },
              download: true
            }
          },
          panels: {
            inspector: { show: false },
            assetLibrary: { show: false },
            settings: { show: false }
          },
          dock: { show: false },
          libraries: false,
          blocks: false
        },
        scale: 'large' // Better for simple mode
      },
      callbacks: {
        onExport: 'download',
        onUpload: 'local'
      }
    };
  }

  // Advanced mode
  return {
    ...baseConfig,
    role: 'Creator',
    ui: {
      elements: {
        view: 'advanced',
        navigation: {
          show: true,
          position: 'top',
          action: {
            close: false,
            back: true,
            load: true,
            save: true,
            export: {
              show: true,
              format: ['application/pdf', 'image/png', 'image/jpeg']
            },
            download: true
          }
        },
        panels: {
          inspector: {
            show: true,
            position: 'right',
            floating: false
          },
          assetLibrary: {
            show: true,
            position: 'left'
          },
          settings: { show: true }
        },
        dock: {
          iconSize: 'normal',
          hideLabels: false
        }
      },
      scale: ({ containerWidth, isTouch }) => {
        return containerWidth < 600 || isTouch ? 'large' : 'normal';
      }
    },
    callbacks: {
      onExport: 'download',
      onUpload: 'local'
    }
  };
};

// Postcard dimensions (5.3" x 7.5" at 300 DPI)
const POSTCARD_WIDTH_PX = 1590;
const POSTCARD_HEIGHT_PX = 2250;
const DPI = 300;

const PostcardEditorProfessional = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [cesdk, setCesdk] = useState(null);
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [editableElements, setEditableElements] = useState([]);
  const [currentPageId, setCurrentPageId] = useState(0); // 0 = front, 1 = back
  
  const containerRef = useRef(null);
  const cesdkRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Function to handle canvas resize and zoom adjustment
  const adjustCanvasZoom = useCallback(async () => {
    if (!cesdk || !cesdk.engine || !containerRef.current) {
      return;
    }
    
    const engine = cesdk.engine;
    const pages = engine.scene.getPages();
    if (pages.length === 0) return;
    
    // Get current page based on currentPageId
    const pageToShow = pages[currentPageId] || pages[0];
    
    // Hide all pages except the current one
    pages.forEach((pageId, index) => {
      engine.block.setVisible(pageId, index === currentPageId);
    });
    
    // Calculate optimal padding based on container size
    let containerWidth = 800; // Default fallback
    let containerHeight = 600; // Default fallback
    
    try {
      const containerRect = containerRef.current.getBoundingClientRect();
      containerWidth = containerRect.width || containerWidth;
      containerHeight = containerRect.height || containerHeight;
    } catch (error) {
      console.warn('Could not get container dimensions, using defaults');
    }
    
    // Dynamic padding calculation
    let padding = Math.min(containerWidth, containerHeight) * 0.1; // 10% of smaller dimension
    padding = Math.max(20, Math.min(padding, 60)); // Clamp between 20 and 60
    
    // In simple mode, we need more padding on the top for the preview header
    const topPadding = isSimpleMode ? padding + 20 : padding;
    
    try {
      // Zoom to the current page with dynamic padding
      await engine.scene.zoomToBlock(pageToShow, padding, topPadding, padding, padding);
    } catch (error) {
      console.error('Failed to zoom to page:', error);
    }
  }, [cesdk, currentPageId, isSimpleMode]);

  // Initialize CreativeEditorSDK when template is selected
  useEffect(() => {
    if (!selectedTemplate || !containerRef.current) return;

    let mounted = true;
    setIsLoading(true);
    setError(null);

    const initializeEditor = async () => {
      try {
        setLoadingMessage('Initializing editor...');
        
        const license = 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX';
        const config = getConfig(isSimpleMode ? 'simple' : 'advanced', license);
        
        // Initialize CreativeEditorSDK
        const instance = await CreativeEditorSDK.create(containerRef.current, config);
        
        if (!mounted) {
          instance.dispose();
          return;
        }

        cesdkRef.current = instance;
        setCesdk(instance);

        // Configure the engine
        const engine = instance.engine;
        
        // Disable default interactions for simple mode
        if (isSimpleMode) {
          engine.editor.setSettingBool('mouse/enableScroll', false);
          engine.editor.setSettingBool('mouse/enableZoom', false);
          engine.editor.setSettingBool('page/title/show', false);
          engine.editor.setGlobalScope('editor/select', 'Deny');
        }

        // Configure asset sources
        setLoadingMessage('Loading assets...');
        await configureAssetSources(instance);
        
        // Asset library configuration is handled through the UI config
        // not through runtime API calls in this version
        
        // Load template
        setLoadingMessage('Loading template...');
        if (selectedTemplate.psdFile) {
          // For PSD files, we'll need to handle them differently
          await loadPSDTemplate(instance, selectedTemplate);
        } else {
          await createTemplateContent(instance, selectedTemplate);
        }

        // Detect editable elements for simple mode
        if (isSimpleMode) {
          const elements = await detectEditableElements(engine);
          setEditableElements(elements);
        }

        setIsLoading(false);
        setLoadingMessage('');
        
        // Initial zoom adjustment
        setTimeout(() => {
          adjustCanvasZoom();
        }, 100);
      } catch (error) {
        console.error('Failed to initialize editor:', error);
        setError(error.message || 'Failed to initialize editor');
        setIsLoading(false);
        
        // Clean up on error
        if (cesdkRef.current) {
          cesdkRef.current.dispose();
          cesdkRef.current = null;
          setCesdk(null);
        }
      }
    };

    initializeEditor();

    // Cleanup function
    return () => {
      mounted = false;
      
      if (cesdkRef.current) {
        cesdkRef.current.dispose();
        cesdkRef.current = null;
        setCesdk(null);
      }
    };
  }, [selectedTemplate, isSimpleMode]);

  // Set up ResizeObserver for canvas resizing
  useEffect(() => {
    if (!cesdk || !containerRef.current) return;

    // Clean up existing observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    // Create new observer
    resizeObserverRef.current = new ResizeObserver(() => {
      adjustCanvasZoom();
    });

    // Observe the container
    resizeObserverRef.current.observe(containerRef.current);

    // Also handle window resize
    const handleResize = () => {
      adjustCanvasZoom();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [cesdk, adjustCanvasZoom]);

  // Adjust zoom when page changes
  useEffect(() => {
    if (cesdk) {
      adjustCanvasZoom();
    }
  }, [currentPageId, adjustCanvasZoom]);

  const loadPSDTemplate = async (instance, template) => {
    const engine = instance.engine;
    
    // Create a new scene first - this is critical!
    await engine.scene.create();
    
    try {
      // Construct PSD file path
      const psdPath = `/PSD-files/${template.psdFile}`;
      
      setLoadingMessage('Loading PSD file...');
      
      // Load the PSD using our PSDLoader utility
      const result = await PSDLoader.loadPSDToScene(
        engine,
        psdPath,
        (progress) => {
          if (progress.message) {
            setLoadingMessage(progress.message);
          }
        }
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load PSD');
      }
      
      // Get the imported page
      const pages = engine.scene.getPages();
      if (pages.length > 0) {
        const page = pages[0];
        
        // Ensure postcard dimensions (5.3" x 7.5" at 300 DPI)
        engine.block.setWidth(page, POSTCARD_WIDTH_PX / DPI);
        engine.block.setHeight(page, POSTCARD_HEIGHT_PX / DPI);
        
        // Lock elements in simple mode
        if (isSimpleMode) {
          const blocks = engine.block.getChildren(page);
          blocks.forEach(blockId => {
            engine.block.setBool(blockId, 'transformLocked', true);
          });
        }
        
        // Check if PSD has multiple pages (front/back)
        if (pages.length > 1) {
          // Set up second page for back of postcard
          const backPage = pages[1];
          engine.block.setWidth(backPage, POSTCARD_WIDTH_PX / DPI);
          engine.block.setHeight(backPage, POSTCARD_HEIGHT_PX / DPI);
          
          if (isSimpleMode) {
            const backBlocks = engine.block.getChildren(backPage);
            backBlocks.forEach(blockId => {
              engine.block.setBool(blockId, 'transformLocked', true);
            });
          }
        } else {
          // If only one page, create a second page for the back
          const backPage = engine.block.create('page');
          engine.block.setWidth(backPage, POSTCARD_WIDTH_PX / DPI);
          engine.block.setHeight(backPage, POSTCARD_HEIGHT_PX / DPI);
          engine.block.appendChild(engine.scene.get(), backPage);
          
          // Add placeholder text for back
          const backText = engine.block.create('text');
          engine.block.setString(backText, 'text/text', 'Back of postcard');
          engine.block.setFloat(backText, 'width', 4);
          engine.block.setFloat(backText, 'height', 0.5);
          engine.block.setPositionX(backText, 0.65);
          engine.block.setPositionY(backText, 3.75);
          engine.block.appendChild(backPage, backText);
        }
        
        // Initial zoom will be handled by adjustCanvasZoom
      }
      
    } catch (error) {
      console.error('Failed to load PSD template:', error);
      // Fall back to creating a simple template if PSD loading fails
      await createTemplateContent(instance, template);
    }
  };

  const createTemplateContent = async (instance, template) => {
    const engine = instance.engine;
    
    // Create a new scene - this is critical!
    await engine.scene.create();
    
    // Get the scene block ID
    const scene = engine.scene.get();
    
    // Create page with postcard dimensions
    const page = engine.block.create('page');
    engine.block.setWidth(page, POSTCARD_WIDTH_PX / DPI);
    engine.block.setHeight(page, POSTCARD_HEIGHT_PX / DPI);
    engine.block.appendChild(scene, page);

    // Set background color
    if (template.primaryColor) {
      engine.block.setFillSolidColor(page, 
        parseInt(template.primaryColor.slice(1, 3), 16) / 255,
        parseInt(template.primaryColor.slice(3, 5), 16) / 255,
        parseInt(template.primaryColor.slice(5, 7), 16) / 255
      );
    }

    // Add main heading
    const heading = engine.block.create('text');
    engine.block.setString(heading, 'text/text', 'Your Business Name');
    engine.block.setFloat(heading, 'width', 4);
    engine.block.setFloat(heading, 'height', 0.8);
    engine.block.setPositionX(heading, 0.65);
    engine.block.setPositionY(heading, 0.8);
    engine.block.setFloat(heading, 'text/fontSize', 48);
    engine.block.setEnum(heading, 'text/horizontalAlignment', 'Center');
    // Store reference for editable elements
    engine.block.setName(heading, 'heading');
    engine.block.appendChild(page, heading);

    // Add subheading
    const subheading = engine.block.create('text');
    engine.block.setString(subheading, 'text/text', 'Professional Services');
    engine.block.setFloat(subheading, 'width', 4);
    engine.block.setFloat(subheading, 'height', 0.5);
    engine.block.setPositionX(subheading, 0.65);
    engine.block.setPositionY(subheading, 1.8);
    engine.block.setFloat(subheading, 'text/fontSize', 24);
    engine.block.setEnum(subheading, 'text/horizontalAlignment', 'Center');
    // Store reference for editable elements
    engine.block.setName(subheading, 'subheading');
    engine.block.appendChild(page, subheading);

    // Add image placeholder
    if (template.features && template.features.includes('Image Areas')) {
      const imageBlock = engine.block.create('graphic');
      const rect = engine.block.createShape('rect');
      engine.block.setShape(imageBlock, rect);
      engine.block.setFloat(imageBlock, 'width', 3);
      engine.block.setFloat(imageBlock, 'height', 2);
      engine.block.setPositionX(imageBlock, 1.15);
      engine.block.setPositionY(imageBlock, 3.5);
      engine.block.setFillSolidColor(imageBlock, 0.9, 0.9, 0.9);
      // Store reference for editable elements
      engine.block.setName(imageBlock, 'mainImage');
      engine.block.appendChild(page, imageBlock);
    }

    // Add contact info
    const contact = engine.block.create('text');
    engine.block.setString(contact, 'text/text', '(555) 123-4567\nwww.yourbusiness.com');
    engine.block.setFloat(contact, 'width', 3);
    engine.block.setFloat(contact, 'height', 0.8);
    engine.block.setPositionX(contact, 1.15);
    engine.block.setPositionY(contact, 6);
    engine.block.setFloat(contact, 'text/fontSize', 18);
    engine.block.setEnum(contact, 'text/horizontalAlignment', 'Center');
    // Store reference for editable elements
    engine.block.setName(contact, 'contact');
    engine.block.appendChild(page, contact);

    // Lock elements in simple mode
    if (isSimpleMode) {
      const blocks = engine.block.getChildren(page);
      blocks.forEach(blockId => {
        engine.block.setBool(blockId, 'transformLocked', true);
      });
    }

    // Initial zoom will be handled by adjustCanvasZoom
  };

  const detectEditableElements = async (engine) => {
    const elements = [];
    const page = engine.block.findByType('page')[0];
    if (!page) return elements;

    const children = engine.block.getChildren(page);
    
    for (const blockId of children) {
      const type = engine.block.getType(blockId);
      const name = engine.block.getName(blockId);
      
      // Check if this is one of our editable elements by name
      if (name && ['heading', 'subheading', 'contact', 'mainImage'].includes(name)) {
        if (type === 'text') {
          elements.push({
            id: blockId,
            type: 'text',
            role: name,
            value: engine.block.getString(blockId, 'text/text'),
            fontSize: engine.block.getFloat(blockId, 'text/fontSize')
          });
        } else if (type === 'graphic' && name === 'mainImage') {
          elements.push({
            id: blockId,
            type: 'image',
            role: name
          });
        }
      }
    }
    
    return elements;
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleModeToggle = () => {
    setIsSimpleMode(!isSimpleMode);
    // Re-initialize editor with new mode
    if (cesdkRef.current) {
      cesdkRef.current.dispose();
      cesdkRef.current = null;
      setCesdk(null);
    }
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setError(null);
  };

  if (!selectedTemplate) {
    return <TemplateSelector onSelect={handleTemplateSelect} />;
  }

  return (
    <div className="postcard-editor-professional">
      <div className="editor-header-professional">
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
              disabled={!cesdk}
            >
              Simple
            </button>
            <button 
              className={`mode-btn ${!isSimpleMode ? 'active' : ''}`}
              onClick={() => setIsSimpleMode(false)}
              disabled={!cesdk}
            >
              Advanced
            </button>
          </div>
        </div>
      </div>
      
      <div className="editor-content-professional">
        {isSimpleMode && cesdk && editableElements.length > 0 && (
          <div className="simple-mode-layout">
            <FormBasedEditor
              cesdk={cesdk}
              elements={editableElements}
              template={selectedTemplate}
            />
            <div className="canvas-preview-wrapper">
              <div className="canvas-preview-header">
                <div className="preview-header-content">
                  <div>
                    <h3>Live Preview</h3>
                    <span className="preview-hint">Your changes appear here instantly</span>
                  </div>
                  <div className="page-navigation">
                    <button
                      className={`page-nav-btn ${currentPageId === 0 ? 'active' : ''}`}
                      onClick={() => setCurrentPageId(0)}
                      disabled={!cesdk}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                        <line x1="8" y1="8" x2="16" y2="8"/>
                        <line x1="8" y1="16" x2="16" y2="16"/>
                      </svg>
                      Front
                    </button>
                    <button
                      className={`page-nav-btn ${currentPageId === 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPageId(1)}
                      disabled={!cesdk || cesdk.engine.scene.getPages().length < 2}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="12" cy="10" r="3"/>
                        <path d="M12 13v8"/>
                      </svg>
                      Back
                    </button>
                  </div>
                </div>
              </div>
              <div 
                ref={containerRef}
                className="cesdk-container-professional simple-mode-preview"
              />
            </div>
          </div>
        )}
        
        {!isSimpleMode && (
          <div 
            ref={containerRef}
            className="cesdk-container-professional advanced-mode"
          />
        )}
        
        {isLoading && (
          <div className="loading-overlay professional">
            <div className="spinner"></div>
            <p>{loadingMessage || 'Loading...'}</p>
          </div>
        )}
        
        {error && (
          <div className="error-overlay professional">
            <div className="error-box">
              <div className="error-icon">⚠️</div>
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <div className="error-actions">
                <button className="btn-secondary" onClick={handleBack}>
                  Choose Another Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostcardEditorProfessional;
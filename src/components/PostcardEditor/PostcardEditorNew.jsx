import React, { useState, useRef } from 'react';
import TemplateSelector from './TemplateSelector.enhanced';
import { SimpleEditorProvider } from './SimpleEditorProvider';
import { AdvancedEditorProvider } from './AdvancedEditorProvider';
import { PSDLoader } from './PSDLoader';
import './PostcardEditor.professional.css';

// Postcard dimensions (industry standard)
const POSTCARD_WIDTH_PX = 1500; // 5" at 300 DPI
const POSTCARD_HEIGHT_PX = 2100; // 7" at 300 DPI  
const DPI = 300;

const PostcardEditorNew = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [error, setError] = useState(null);
  
  const simpleContainerRef = useRef(null);
  const advancedContainerRef = useRef(null);

  // Configuration for Simple Editor
  const simpleConfig = {
    role: 'Creator',
    theme: 'light'
  };

  // Configuration for Advanced Editor
  const advancedConfig = {
    role: 'Creator',
    theme: 'light',
    ui: {
      elements: {
        dock: {
          show: true
        },
        navigation: {
          action: {
            export: {
              show: true,
              format: ['image/png', 'application/pdf']
            }
          }
        }
      }
    }
  };

  // Configure simple editor
  const configureSimpleEditor = async (instance) => {
    try {
      if (selectedTemplate) {
        await loadTemplateToEditor(instance, selectedTemplate);
      }
    } catch (error) {
      console.error('Failed to configure simple editor:', error);
      setError(error.message);
    }
  };

  // Configure advanced editor
  const configureAdvancedEditor = async (instance) => {
    try {
      if (selectedTemplate) {
        await loadTemplateToEditor(instance, selectedTemplate);
      }
    } catch (error) {
      console.error('Failed to configure advanced editor:', error);
      setError(error.message);
    }
  };


  // Load template into editor (both simple and advanced)
  const loadTemplateToEditor = async (instance, template) => {
    if (template.psdFile) {
      // Load PSD template
      const psdPath = `/PSD-files/${template.psdFile}`;
      const result = await PSDLoader.loadPSDToScene(instance.engine, psdPath);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load PSD');
      }
    } else {
      // Create template from scratch
      await createTemplateInEditor(instance, template);
    }
  };


  // Create template from scratch in editor
  const createTemplateInEditor = async (instance, template) => {
    let scene = instance.engine.scene.get();
    if (!scene) {
      scene = instance.engine.scene.create();
    }
    
    // Create page
    const page = instance.engine.block.create('page');
    instance.engine.block.setWidth(page, POSTCARD_WIDTH_PX / DPI);
    instance.engine.block.setHeight(page, POSTCARD_HEIGHT_PX / DPI);
    instance.engine.block.appendChild(scene, page);

    // Set background color
    if (template.primaryColor && template.primaryColor !== '#undefined') {
      try {
        const hex = template.primaryColor.replace('#', '');
        if (hex.length === 6) {
          const r = parseInt(hex.substr(0, 2), 16) / 255;
          const g = parseInt(hex.substr(2, 2), 16) / 255;
          const b = parseInt(hex.substr(4, 2), 16) / 255;
          
          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            instance.engine.block.setFillSolidColor(page, { r, g, b, a: 1 });
          }
        }
      } catch (error) {
        console.warn('Failed to set background color:', error);
      }
    }

    // Add sample text
    const titleText = instance.engine.block.create('text');
    instance.engine.block.setString(titleText, 'text/text', template.name || 'Your Business Name');
    instance.engine.block.setPositionX(titleText, 0.5);
    instance.engine.block.setPositionY(titleText, 1);
    instance.engine.block.setWidth(titleText, 4);
    instance.engine.block.setHeight(titleText, 0.8);
    instance.engine.block.appendChild(page, titleText);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setError(null);
  };

  const handleModeToggle = () => {
    setIsSimpleMode(!isSimpleMode);
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
        </div>
      </div>
      
      <div className="editor-content-professional">
        {isSimpleMode ? (
          <div 
            ref={simpleContainerRef}
            className="cesdk-container-professional simple-mode"
            style={{ width: '100%', height: '100%' }}
          >
            <SimpleEditorProvider
              config={simpleConfig}
              configure={configureSimpleEditor}
              containerRef={simpleContainerRef}
              LoadingComponent={<div className="loading-overlay professional"><div className="spinner"></div><p>Loading Simple Editor...</p></div>}
            />
          </div>
        ) : (
          <div 
            ref={advancedContainerRef}
            className="cesdk-container-professional advanced-mode"
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedEditorProvider
              config={advancedConfig}
              configure={configureAdvancedEditor}
              containerRef={advancedContainerRef}
              LoadingComponent={<div className="loading-overlay professional"><div className="spinner"></div><p>Loading Advanced Editor...</p></div>}
            />
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

export default PostcardEditorNew;
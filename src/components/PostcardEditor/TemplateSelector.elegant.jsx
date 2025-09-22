import React, { useState, useEffect } from 'react';
import templates from './templates.json';
import { generateTemplatePreview } from './generatePreview';
import './TemplateSelector.elegant.css';

const TemplateSelector = ({ onSelect }) => {
  const [imageErrors, setImageErrors] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState({});
  const [previews, setPreviews] = useState({});
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  
  useEffect(() => {
    // Generate previews for PSD templates
    templates.forEach(template => {
      if (template.psdFile && !previews[template.id]) {
        generatePSDPreview(template);
      }
    });
  }, []);
  
  const generatePSDPreview = async (template) => {
    setLoadingPreviews(prev => ({ ...prev, [template.id]: true }));
    
    try {
      // For now, use color-based preview generation
      // In production, you'd generate actual thumbnails from PSD files
      const preview = generateTemplatePreview(template);
      setPreviews(prev => ({ ...prev, [template.id]: preview }));
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setImageErrors(prev => ({ ...prev, [template.id]: true }));
    } finally {
      setLoadingPreviews(prev => ({ ...prev, [template.id]: false }));
    }
  };
  
  const handleImageError = (templateId) => {
    setImageErrors(prev => ({ ...prev, [templateId]: true }));
  };
  
  const getPreviewImage = (template) => {
    // Use generated preview if available
    if (previews[template.id]) {
      return previews[template.id];
    }
    
    // If we have an error or no preview path, generate one
    if (imageErrors[template.id] || !template.preview || template.preview.startsWith('/templates/')) {
      return generateTemplatePreview(template);
    }
    
    return template.preview;
  };
  
  return (
    <div className="template-selector-elegant">
      <div className="template-header-elegant">
        <div className="header-content">
          <h1>Choose Your Postcard Template</h1>
          <p>Select a professional template to customize for your business</p>
        </div>
        
        <div className="template-stats">
          <div className="stat-item">
            <span className="stat-number">{templates.length}</span>
            <span className="stat-label">Templates</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">5</span>
            <span className="stat-label">PSD Designs</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Customizable</span>
          </div>
        </div>
      </div>
      
      <div className="template-grid-container-elegant">
        <div className="template-grid-elegant">
          {templates.map((template) => (
            <div 
              key={template.id}
              className={`template-card-elegant ${hoveredTemplate === template.id ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              onClick={() => onSelect(template)}
            >
              <div className="template-preview-elegant">
                {loadingPreviews[template.id] ? (
                  <div className="preview-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading preview...</p>
                  </div>
                ) : (
                  <>
                    <img 
                      src={getPreviewImage(template)} 
                      alt={template.name}
                      loading="lazy"
                      onError={() => handleImageError(template.id)}
                    />
                    <div className="template-overlay-elegant">
                      <div className="overlay-content">
                        <h3>{template.name}</h3>
                        <p>{template.description}</p>
                        <button className="select-button-elegant">
                          Customize This Template
                        </button>
                      </div>
                    </div>
                    {template.psdFile && (
                      <div className="psd-badge">
                        PSD
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="template-info-elegant">
                <h3>{template.name}</h3>
                <div className="template-features-elegant">
                  {template.features.slice(0, 3).map((feature, index) => (
                    <span key={index} className="feature-tag-elegant">
                      {feature}
                    </span>
                  ))}
                  {template.features.length > 3 && (
                    <span className="feature-tag-elegant more">
                      +{template.features.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
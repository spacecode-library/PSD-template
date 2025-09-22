import React, { useState } from 'react';
import templates from './templates.json';
import { generateTemplatePreview } from './generatePreview';
import { categorizeTemplates, formatFileSize } from '../../utils/templateValidation';

const TemplateSelector = ({ onSelect }) => {
  const [imageErrors, setImageErrors] = useState({});
  const [showUnavailable, setShowUnavailable] = useState(false);
  
  const handleImageError = (templateId) => {
    setImageErrors(prev => ({ ...prev, [templateId]: true }));
  };
  
  const getPreviewImage = (template) => {
    // If we have an error or no preview path, generate one
    if (imageErrors[template.id] || !template.preview || template.preview.startsWith('/templates/')) {
      return generateTemplatePreview(template);
    }
    return template.preview;
  };

  // Categorize templates using validation utility
  const { available: availableTemplates, unavailable: unavailableTemplates } = categorizeTemplates(templates);
  
  return (
    <div className="template-selector">
      <div className="template-header">
        <h1>Professional Postcard Template</h1>
        <p>Ready-to-customize template with 8 editable elements - perfect for any business</p>
        <div className="info-banner">
          <p><strong>✓ Template Ready:</strong> Fully functional PSD template with editing capabilities. Customize text, colors, images, and export to PDF.</p>
        </div>
      </div>
      
      <div className="template-grid-container single-template">
        {/* Single Template Display */}
        <div className="template-grid single">
          {availableTemplates.map((template) => (
            <div 
              key={template.id}
              className="template-card featured available"
              onClick={() => onSelect(template)}
            >
              <div className="template-preview">
                <img 
                  src={getPreviewImage(template)} 
                  alt={template.name}
                  loading="lazy"
                  onError={() => handleImageError(template.id)}
                />
                <div className="template-overlay">
                  <button className="select-button primary">
                    Start Customizing
                  </button>
                </div>
                <div className="template-badge featured-badge">
                  PSD Template ({formatFileSize(template.psdFileSize || 0)})
                </div>
              </div>
              
              <div className="template-info">
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <div className="template-features">
                  {template.features.map((feature, index) => (
                    <span key={index} className="feature-tag">
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="editable-elements-info">
                  <h4>Editable Elements ({template.editableElements.length}):</h4>
                  <div className="elements-list">
                    {template.editableElements.map((element, index) => (
                      <span key={index} className="element-tag">
                        {element.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    ))}
                  </div>
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
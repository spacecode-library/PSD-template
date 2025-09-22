import React, { useState } from 'react';
import templates from './templates.json';
import { generateTemplatePreview } from './generatePreview';

const TemplateSelector = ({ onSelect }) => {
  const [imageErrors, setImageErrors] = useState({});
  
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
  
  return (
    <div className="template-selector">
      <div className="template-header">
        <h1>Choose Your Postcard Template</h1>
        <p>Select a professional template to customize for your business</p>
        <div className="info-banner">
          <p><strong>✓ Templates Ready:</strong> All templates are fully functional with editing capabilities. You can customize text, colors, images, and export to PDF.</p>
        </div>
      </div>
      
      <div className="template-grid-container">
        <div className="template-grid">
          {templates.map((template) => (
            <div 
              key={template.id}
              className="template-card"
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
                  <button className="select-button">
                    Select Template
                  </button>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
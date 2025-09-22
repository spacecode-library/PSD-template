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
        <h1>Choose Your Postcard Template</h1>
        <p>Select a professional template to customize for your business</p>
        <div className="info-banner">
          <p><strong>✓ Available Templates:</strong> {availableTemplates.length} fully functional templates with editing capabilities. You can customize text, colors, images, and export to PDF.</p>
        </div>
        
        {unavailableTemplates.length > 0 && (
          <div className="availability-info">
            <p>
              <strong>Note:</strong> {unavailableTemplates.length} templates are temporarily unavailable due to large file sizes. 
              <button 
                onClick={() => setShowUnavailable(!showUnavailable)}
                className="link-button"
              >
                {showUnavailable ? 'Hide' : 'Show'} unavailable templates
              </button>
            </p>
          </div>
        )}
      </div>
      
      <div className="template-grid-container">
        {/* Available Templates */}
        <div className="template-grid">
          {availableTemplates.map((template) => (
            <div 
              key={template.id}
              className="template-card available"
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
                {template.psdFile && (
                  <div className="template-badge psd-badge">
                    PSD ({formatFileSize(template.psdFileSize || 0)})
                  </div>
                )}
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

        {/* Unavailable Templates (when shown) */}
        {showUnavailable && unavailableTemplates.length > 0 && (
          <div className="unavailable-section">
            <h3>Temporarily Unavailable Templates</h3>
            <div className="template-grid">
              {unavailableTemplates.map((template) => (
                <div 
                  key={template.id}
                  className="template-card unavailable"
                >
                  <div className="template-preview">
                    <img 
                      src={getPreviewImage(template)} 
                      alt={template.name}
                      loading="lazy"
                      onError={() => handleImageError(template.id)}
                    />
                    <div className="template-overlay disabled">
                      <button className="select-button" disabled>
                        Unavailable
                      </button>
                    </div>
                    <div className="template-badge unavailable-badge">
                      {formatFileSize(template.psdFileSize)} - Too Large
                    </div>
                  </div>
                  
                  <div className="template-info">
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                    <div className="unavailable-reason">
                      <small>{template.unavailableReason}</small>
                    </div>
                    <div className="template-features">
                      {template.features.map((feature, index) => (
                        <span key={index} className="feature-tag disabled">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;
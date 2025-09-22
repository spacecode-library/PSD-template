import React, { useState, useEffect } from 'react';
import enhancedTemplates from './enhancedTemplates.json';
import { generateTemplatePreview } from './generatePreview';
import './TemplateSelector.enhanced.css';

const TemplateSelector = ({ onSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState({});
  const [previews, setPreviews] = useState({});
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  
  // Get unique categories
  const categories = ['all', ...new Set(enhancedTemplates.map(t => t.category))];
  
  useEffect(() => {
    // Generate previews for all templates
    enhancedTemplates.forEach(template => {
      generatePreview(template);
    });
  }, []);
  
  const generatePreview = async (template) => {
    setLoadingPreviews(prev => ({ ...prev, [template.id]: true }));
    
    try {
      let preview;
      
      if (template.psdFile) {
        // For PSD files, try to generate thumbnail
        // For now, use fallback preview
        preview = null;
      }
      
      if (!preview) {
        // Generate canvas-based preview
        const canvas = document.createElement('canvas');
        canvas.width = 340;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = template.primaryColor || '#20B2AA';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Decorative element
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(canvas.width * 0.7, canvas.height * 0.2, 150, 0, Math.PI * 2);
        ctx.fill();
        
        // Add template name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(template.name, canvas.width / 2, canvas.height / 2 - 40);
        
        // Add category
        ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.globalAlpha = 0.8;
        ctx.fillText(template.category.toUpperCase(), canvas.width / 2, canvas.height / 2);
        
        // Add features
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.globalAlpha = 0.6;
        template.features.slice(0, 2).forEach((feature, i) => {
          ctx.fillText(feature, canvas.width / 2, canvas.height / 2 + 40 + (i * 20));
        });
        
        preview = canvas.toDataURL('image/png');
      }
      
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
    if (previews[template.id]) {
      return previews[template.id];
    }
    
    if (imageErrors[template.id] || !template.preview) {
      return generateTemplatePreview(template);
    }
    
    return template.preview;
  };
  
  // Filter templates based on category and search
  const filteredTemplates = enhancedTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });
  
  return (
    <div className="template-selector-enhanced">
      <div className="template-header-enhanced">
        <div className="header-content">
          <h1>Choose Your Postcard Template</h1>
          <p>Professional templates designed for maximum impact</p>
        </div>
        
        <div className="template-controls">
          <div className="search-bar">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="category-filter">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="template-stats">
          <div className="stat-item">
            <span className="stat-number">{filteredTemplates.length}</span>
            <span className="stat-label">Templates</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{filteredTemplates.filter(t => t.psdFile).length}</span>
            <span className="stat-label">PSD Designs</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Customizable</span>
          </div>
        </div>
      </div>
      
      <div className="template-grid-container-enhanced">
        <div className="template-grid-enhanced">
          {filteredTemplates.map((template) => (
            <div 
              key={template.id}
              className={`template-card-enhanced ${hoveredTemplate === template.id ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              onClick={() => onSelect(template)}
            >
              <div className="template-preview-enhanced">
                {loadingPreviews[template.id] ? (
                  <div className="preview-loading">
                    <div className="loading-spinner"></div>
                    <p>Generating preview...</p>
                  </div>
                ) : (
                  <>
                    <img 
                      src={getPreviewImage(template)} 
                      alt={template.name}
                      loading="lazy"
                      onError={() => handleImageError(template.id)}
                    />
                    <div className="template-overlay-enhanced">
                      <div className="overlay-content">
                        <h3>{template.name}</h3>
                        <p>{template.description}</p>
                        
                        <div className="template-details">
                          <div className="detail-item">
                            <span className="detail-label">Category:</span>
                            <span>{template.category}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Size:</span>
                            <span>{template.dimensions.width}" × {template.dimensions.height}"</span>
                          </div>
                        </div>
                        
                        <button className="select-button-enhanced">
                          Customize This Template
                        </button>
                      </div>
                    </div>
                    
                    {template.psdFile && (
                      <div className="psd-badge">
                        PSD
                      </div>
                    )}
                    
                    <div className="template-category-badge">
                      {template.category}
                    </div>
                  </>
                )}
              </div>
              
              <div className="template-info-enhanced">
                <h3>{template.name}</h3>
                <div className="template-meta">
                  <div className="color-palette">
                    {Object.entries(template.colors).slice(0, 4).map(([key, color]) => (
                      <span
                        key={key}
                        className="color-dot"
                        style={{ backgroundColor: color }}
                        title={key}
                      />
                    ))}
                  </div>
                  <span className="element-count">
                    {template.editableElements.length} editable elements
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredTemplates.length === 0 && (
          <div className="no-templates">
            <p>No templates found matching your criteria.</p>
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;
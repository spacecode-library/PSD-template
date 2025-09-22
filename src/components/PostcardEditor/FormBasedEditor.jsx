import React, { useState, useRef } from 'react';
import './FormBasedEditor.css';

const PRESET_COLORS = [
  '#20B2AA', '#1A9D96', '#111827', '#DC2626', '#F59E0B',
  '#10B981', '#3B82F6', '#9333EA', '#6B7280', '#FFFFFF'
];

const SAMPLE_IMAGES = [
  { name: 'Office', url: 'https://img.ly/static/ubq_samples/imgly_logo.jpg' },
  { name: 'Team', url: 'https://img.ly/static/ubq_samples/sample_1_1024x683.jpg' },
  { name: 'Product', url: 'https://img.ly/static/ubq_samples/sample_2_1024x683.jpg' },
  { name: 'Service', url: 'https://img.ly/static/ubq_samples/sample_3_1024x768.jpg' },
  { name: 'Location', url: 'https://img.ly/static/ubq_samples/sample_4_1024x682.jpg' }
];

const FormBasedEditor = ({ cesdk, elements, template }) => {
  const [formData, setFormData] = useState({});
  const fileInputRef = useRef(null);
  const [selectedImageBlock, setSelectedImageBlock] = useState(null);

  // Initialize form data from elements
  React.useEffect(() => {
    const initialData = {};
    elements.forEach(element => {
      if (element.type === 'text') {
        initialData[element.id] = element.value;
      }
    });
    setFormData(initialData);
  }, [elements]);

  const handleTextChange = (elementId, value) => {
    setFormData(prev => ({ ...prev, [elementId]: value }));
    
    // Update the text in the editor
    if (cesdk && cesdk.engine) {
      try {
        cesdk.engine.block.setString(elementId, 'text/text', value);
      } catch (error) {
        console.error('Failed to update text:', error);
      }
    }
  };

  const handleColorChange = (elementId, color) => {
    if (!cesdk || !cesdk.engine) return;
    
    try {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      cesdk.engine.block.setTextColor(elementId, { r, g, b, a: 1 });
    } catch (error) {
      console.error('Failed to update color:', error);
    }
  };

  const handleImageReplace = (elementId, imageUrl) => {
    if (!cesdk || !cesdk.engine) return;
    
    try {
      // First, clear existing fill
      cesdk.engine.block.destroy(cesdk.engine.block.getFill(elementId));
      
      // Create new image fill
      const imageFill = cesdk.engine.block.createFill('image');
      cesdk.engine.block.setString(imageFill, 'fill/image/imageFileURI', imageUrl);
      cesdk.engine.block.setFill(elementId, imageFill);
    } catch (error) {
      console.error('Failed to replace image:', error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file || !selectedImageBlock) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      handleImageReplace(selectedImageBlock, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleExport = async (format = 'application/pdf') => {
    if (!cesdk || !cesdk.engine) return;
    
    try {
      const blob = await cesdk.engine.block.export(
        cesdk.engine.scene.get(),
        format
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'application/pdf' ? 'pdf' : 'png';
      a.download = `postcard-${template.name}-${Date.now()}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getLabelForRole = (role) => {
    const labels = {
      heading: 'Business Name',
      subheading: 'Tagline',
      contact: 'Contact Information',
      mainImage: 'Main Image',
      text: 'Text Content'
    };
    return labels[role] || 'Content';
  };

  return (
    <div className="form-based-editor">
      <div className="form-header">
        <h2>Customize Your Postcard</h2>
        <p>Edit the content below to personalize your design</p>
      </div>
      
      <div className="form-sections">
        {/* Text Elements */}
        <div className="form-section">
          <h3>Text Content</h3>
          {elements.filter(el => el.type === 'text').map(element => (
            <div key={element.id} className="form-field">
              <label>{getLabelForRole(element.role)}</label>
              {element.role === 'contact' ? (
                <textarea
                  value={formData[element.id] || ''}
                  onChange={(e) => handleTextChange(element.id, e.target.value)}
                  rows={3}
                  placeholder="Enter contact information..."
                />
              ) : (
                <input
                  type="text"
                  value={formData[element.id] || ''}
                  onChange={(e) => handleTextChange(element.id, e.target.value)}
                  placeholder={`Enter ${getLabelForRole(element.role).toLowerCase()}...`}
                />
              )}
              
              <div className="color-selector">
                <span className="color-label">Text Color:</span>
                <div className="color-swatches">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      className="color-swatch"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(element.id, color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Image Elements */}
        {elements.filter(el => el.type === 'image').length > 0 && (
          <div className="form-section">
            <h3>Images</h3>
            {elements.filter(el => el.type === 'image').map(element => (
              <div key={element.id} className="form-field">
                <label>{getLabelForRole(element.role)}</label>
                
                <div className="image-options">
                  <div className="stock-images">
                    <p className="option-label">Choose from stock images:</p>
                    <div className="image-grid">
                      {SAMPLE_IMAGES.map(img => (
                        <button
                          key={img.name}
                          className="stock-image"
                          onClick={() => handleImageReplace(element.id, img.url)}
                        >
                          <img src={img.url} alt={img.name} />
                          <span>{img.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="upload-option">
                    <p className="option-label">Or upload your own:</p>
                    <button
                      className="upload-btn"
                      onClick={() => {
                        setSelectedImageBlock(element.id);
                        fileInputRef.current?.click();
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload Image
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Theme Colors */}
        {template.colors && (
          <div className="form-section">
            <h3>Theme Colors</h3>
            <div className="theme-colors">
              {Object.entries(template.colors).map(([key, color]) => (
                <div key={key} className="theme-color-item">
                  <div 
                    className="theme-color-preview"
                    style={{ backgroundColor: color }}
                  />
                  <span className="theme-color-label">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Actions */}
        <div className="form-section">
          <h3>Export Your Design</h3>
          <div className="export-actions">
            <button 
              className="export-btn primary"
              onClick={() => handleExport('application/pdf')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              Export as PDF
            </button>
            
            <button 
              className="export-btn secondary"
              onClick={() => handleExport('image/png')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Export as PNG
            </button>
          </div>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FormBasedEditor;
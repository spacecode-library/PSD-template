import React, { useState, useEffect } from 'react';
import { BLOCK_TYPES, SAMPLE_IMAGES } from './constants';

// Popular Google Fonts for postcards
const FONT_OPTIONS = [
  { name: 'Archivo', url: 'https://cdn.img.ly/assets/v3/ly.img.typeface/fonts/Archivo/ArchivoBold.ttf', label: 'Archivo Bold' },
  { name: 'Roboto', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.ttf', label: 'Roboto Bold' },
  { name: 'Open Sans', url: 'https://fonts.gstatic.com/s/opensans/v35/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.ttf', label: 'Open Sans' },
  { name: 'Playfair Display', url: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtXK-F2qC0s.ttf', label: 'Playfair Display' },
  { name: 'Montserrat', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXp-p7K4KLjztg.ttf', label: 'Montserrat' },
  { name: 'Lato', url: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjxAwXjeu.ttf', label: 'Lato' }
];

// Common SVG icons for postcards
const SVG_ICONS = [
  { id: 'phone', name: 'Phone', path: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z' },
  { id: 'email', name: 'Email', path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
  { id: 'location', name: 'Location', path: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z' },
  { id: 'star', name: 'Star', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'heart', name: 'Heart', path: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z' },
  { id: 'check', name: 'Check', path: 'M20 6L9 17l-5-5' }
];

const EnhancedEditorToolbar = ({ cesdk, selectedBlocks }) => {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blockType, setBlockType] = useState(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [currentOpacity, setCurrentOpacity] = useState(1);
  const [currentFont, setCurrentFont] = useState('');
  const [textStyles, setTextStyles] = useState({ bold: false, italic: false, underline: false });
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isReplaceableImage, setIsReplaceableImage] = useState(false);

  useEffect(() => {
    if (!cesdk) return;

    if (selectedBlocks && selectedBlocks.length > 0) {
      const block = selectedBlocks[0];
      setSelectedBlock(block);
      
      const type = cesdk.block.getType(block);
      setBlockType(type);
      
      // Check if it's a replaceable image
      const replaceableMetadata = cesdk.block.getMetadata(block, 'replaceableImage');
      setIsReplaceableImage(replaceableMetadata === 'true' && type === BLOCK_TYPES.GRAPHIC);
      
      // Get opacity
      try {
        const opacity = cesdk.block.getOpacity(block);
        setCurrentOpacity(opacity);
      } catch (e) {
        // Block might not support opacity
      }
      
      // Get current properties
      if (type === BLOCK_TYPES.TEXT) {
        try {
          const colors = cesdk.block.getTextColors(block);
          if (colors && colors.length > 0) {
            setCurrentColor(rgbaToHex(colors[0]));
          }
          
          const fontSize = cesdk.block.getFloat(block, 'text/fontSize');
          setCurrentFontSize(fontSize);
          
          // Get font
          const fontUri = cesdk.block.getString(block, 'text/fontFileUri');
          setCurrentFont(fontUri || '');
          
          // Get text styles
          const fontWeight = cesdk.block.getString(block, 'text/fontWeight');
          const fontStyle = cesdk.block.getString(block, 'text/fontStyle');
          const textDecoration = cesdk.block.getString(block, 'text/decoration');
          
          setTextStyles({
            bold: fontWeight === 'bold',
            italic: fontStyle === 'italic',
            underline: textDecoration === 'underline'
          });
        } catch (e) {
          console.error('Error getting text properties:', e);
        }
      } else if (type === BLOCK_TYPES.GRAPHIC) {
        try {
          const fill = cesdk.block.getFill(block);
          if (fill) {
            const fillType = cesdk.block.getType(fill);
            if (fillType === BLOCK_TYPES.FILL_COLOR) {
              const color = cesdk.block.getColor(fill, 'fill/color/value');
              setCurrentColor(rgbaToHex(color));
            }
          }
        } catch (e) {
          // Graphic might not have a color fill
        }
      }
    } else {
      setSelectedBlock(null);
      setBlockType(null);
      setIsReplaceableImage(false);
    }
    
    setShowImagePicker(false);
    setShowIconPicker(false);
  }, [cesdk, selectedBlocks]);

  const rgbaToHex = (rgba) => {
    const toHex = (value) => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
  };

  const hexToRgba = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
      a: 1
    } : null;
  };

  const handleColorChange = (color) => {
    if (!selectedBlock || !cesdk) return;
    
    const rgba = hexToRgba(color);
    if (!rgba) return;

    try {
      if (blockType === BLOCK_TYPES.TEXT) {
        cesdk.block.setTextColor(selectedBlock, rgba);
        setCurrentColor(color);
      } else if (blockType === BLOCK_TYPES.GRAPHIC) {
        const fill = cesdk.block.getFill(selectedBlock);
        if (fill) {
          const fillType = cesdk.block.getType(fill);
          if (fillType === BLOCK_TYPES.FILL_COLOR) {
            cesdk.block.setColor(fill, 'fill/color/value', rgba);
            setCurrentColor(color);
          }
        }
      }
    } catch (e) {
      console.error('Error setting color:', e);
    }
  };

  const handleFontSizeChange = (size) => {
    if (!selectedBlock || !cesdk || blockType !== BLOCK_TYPES.TEXT) return;
    
    try {
      cesdk.block.setFloat(selectedBlock, 'text/fontSize', parseFloat(size));
      setCurrentFontSize(size);
    } catch (e) {
      console.error('Error setting font size:', e);
    }
  };
  
  const handleOpacityChange = (opacity) => {
    if (!selectedBlock || !cesdk) return;
    
    try {
      cesdk.block.setOpacity(selectedBlock, parseFloat(opacity));
      setCurrentOpacity(opacity);
    } catch (e) {
      console.error('Error setting opacity:', e);
    }
  };
  
  const handleFontChange = (fontUrl) => {
    if (!selectedBlock || !cesdk || blockType !== BLOCK_TYPES.TEXT) return;
    
    try {
      cesdk.block.setString(selectedBlock, 'text/fontFileUri', fontUrl);
      setCurrentFont(fontUrl);
    } catch (e) {
      console.error('Error setting font:', e);
    }
  };
  
  const handleTextStyleToggle = (style) => {
    if (!selectedBlock || !cesdk || blockType !== BLOCK_TYPES.TEXT) return;
    
    try {
      const newStyles = { ...textStyles, [style]: !textStyles[style] };
      
      if (style === 'bold') {
        cesdk.block.setString(selectedBlock, 'text/fontWeight', newStyles.bold ? 'bold' : 'normal');
      } else if (style === 'italic') {
        cesdk.block.setString(selectedBlock, 'text/fontStyle', newStyles.italic ? 'italic' : 'normal');
      } else if (style === 'underline') {
        cesdk.block.setString(selectedBlock, 'text/decoration', newStyles.underline ? 'underline' : 'none');
      }
      
      setTextStyles(newStyles);
    } catch (e) {
      console.error('Error setting text style:', e);
    }
  };

  const handleTextAlignmentChange = (alignment) => {
    if (!selectedBlock || !cesdk || blockType !== BLOCK_TYPES.TEXT) return;
    
    try {
      cesdk.block.setEnum(selectedBlock, 'text/horizontalAlignment', alignment);
    } catch (e) {
      console.error('Error setting text alignment:', e);
    }
  };
  
  const handleImageReplace = (image) => {
    if (!selectedBlock || !cesdk || !isReplaceableImage) return;
    
    try {
      let fill = cesdk.block.getFill(selectedBlock);
      if (!fill || cesdk.block.getType(fill) !== '//ly.img.ubq/fill/image') {
        fill = cesdk.block.createFill('image');
        cesdk.block.setFill(selectedBlock, fill);
      }
      
      cesdk.block.setSourceSet(fill, 'fill/image/sourceSet', [{
        uri: image.uri,
        width: image.width,
        height: image.height
      }]);
      
      setShowImagePicker(false);
    } catch (e) {
      console.error('Error replacing image:', e);
    }
  };
  
  const handleAddIcon = (icon) => {
    if (!cesdk) return;
    
    try {
      // Get the current page
      const [page] = cesdk.block.findByType('page');
      if (!page) return;
      
      // Create a new graphic block for the icon
      const iconBlock = cesdk.block.create('graphic');
      const shape = cesdk.block.createShape('rect');
      cesdk.block.setShape(iconBlock, shape);
      
      // Set size
      cesdk.block.setFloat(iconBlock, 'width', 0.5);
      cesdk.block.setFloat(iconBlock, 'height', 0.5);
      
      // Position in center
      cesdk.block.setPositionX(iconBlock, 2.5);
      cesdk.block.setPositionY(iconBlock, 3.5);
      
      // Create SVG content
      const svgContent = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="${icon.path}" fill="#333333"/>
      </svg>`;
      
      // Set as image fill (SVG)
      cesdk.block.setFillEnabled(iconBlock, true);
      const fill = cesdk.block.createFill('image');
      cesdk.block.setString(fill, 'fill/image/sourceSet/0/uri', `data:image/svg+xml;base64,${btoa(svgContent)}`);
      cesdk.block.setFill(iconBlock, fill);
      
      // Add to page
      cesdk.block.appendChild(page, iconBlock);
      
      // Select the new icon
      cesdk.block.select(iconBlock);
      
      setShowIconPicker(false);
    } catch (e) {
      console.error('Error adding icon:', e);
    }
  };

  const predefinedColors = [
    '#000000', '#FFFFFF', '#17A2B8', '#FFC107', '#FF6B6B',
    '#2C3E50', '#E74C3C', '#3498DB', '#27AE60', '#9B59B6'
  ];

  if (!selectedBlock) {
    return (
      <div className="editor-toolbar">
        <div className="toolbar-section">
          <h3 className="toolbar-title">Tools</h3>
          
          {/* Add Icon Button */}
          <div className="toolbar-group">
            <label className="toolbar-label">Add Elements</label>
            <button 
              className="add-icon-button"
              onClick={() => setShowIconPicker(!showIconPicker)}
            >
              Add Icon
            </button>
            
            {showIconPicker && (
              <div className="icon-picker-grid">
                {SVG_ICONS.map(icon => (
                  <div 
                    key={icon.id}
                    className="icon-picker-item"
                    onClick={() => handleAddIcon(icon)}
                    title={icon.name}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d={icon.path} />
                    </svg>
                    <span>{icon.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="toolbar-message">
            Select an element to edit its properties
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-toolbar">
      <div className="toolbar-section">
        <h3 className="toolbar-title">Edit Properties</h3>
        
        {/* Opacity Control - Available for all elements */}
        <div className="toolbar-group">
          <label className="toolbar-label">Opacity</label>
          <div className="opacity-controls">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={currentOpacity}
              onChange={(e) => handleOpacityChange(e.target.value)}
              className="opacity-slider"
            />
            <span className="opacity-value">{Math.round(currentOpacity * 100)}%</span>
          </div>
        </div>
        
        {/* Image Replacement for replaceable images */}
        {isReplaceableImage && (
          <div className="toolbar-group">
            <label className="toolbar-label">Replace Image</label>
            <button 
              className="image-replace-button"
              onClick={() => setShowImagePicker(!showImagePicker)}
            >
              {showImagePicker ? 'Cancel' : 'Choose Image'}
            </button>
            
            {showImagePicker && (
              <div className="image-picker-grid">
                {SAMPLE_IMAGES.map(image => (
                  <div 
                    key={image.id}
                    className="image-picker-item"
                    onClick={() => handleImageReplace(image)}
                  >
                    <img src={image.uri} alt={image.name} />
                    <span>{image.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Color Picker */}
        {(blockType === BLOCK_TYPES.TEXT || (blockType === BLOCK_TYPES.GRAPHIC && !isReplaceableImage)) && (
          <div className="toolbar-group">
            <label className="toolbar-label">Color</label>
            <div className="color-options">
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="color-picker-input"
                />
                <span className="color-value">{currentColor}</span>
              </div>
              <div className="color-presets">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    className={`color-preset ${currentColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Text-specific controls */}
        {blockType === BLOCK_TYPES.TEXT && (
          <>
            {/* Font Selection */}
            <div className="toolbar-group">
              <label className="toolbar-label">Font</label>
              <select 
                className="font-selector"
                value={currentFont}
                onChange={(e) => handleFontChange(e.target.value)}
              >
                <option value="">Select Font</option>
                {FONT_OPTIONS.map(font => (
                  <option key={font.name} value={font.url}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="toolbar-group">
              <label className="toolbar-label">Font Size</label>
              <div className="font-size-controls">
                <input
                  type="range"
                  min="8"
                  max="120"
                  step="1"
                  value={currentFontSize}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  className="font-size-slider"
                />
                <input
                  type="number"
                  min="8"
                  max="120"
                  step="1"
                  value={currentFontSize}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  className="font-size-input"
                />
              </div>
            </div>
            
            {/* Text Style Buttons */}
            <div className="toolbar-group">
              <label className="toolbar-label">Style</label>
              <div className="text-style-buttons">
                <button
                  className={`style-button ${textStyles.bold ? 'active' : ''}`}
                  onClick={() => handleTextStyleToggle('bold')}
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  className={`style-button ${textStyles.italic ? 'active' : ''}`}
                  onClick={() => handleTextStyleToggle('italic')}
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  className={`style-button ${textStyles.underline ? 'active' : ''}`}
                  onClick={() => handleTextStyleToggle('underline')}
                  title="Underline"
                >
                  <u>U</u>
                </button>
              </div>
            </div>

            {/* Text Alignment */}
            <div className="toolbar-group">
              <label className="toolbar-label">Alignment</label>
              <div className="alignment-buttons">
                <button
                  className="alignment-button"
                  onClick={() => handleTextAlignmentChange('Left')}
                  title="Align Left"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="17" y1="10" x2="3" y2="10"></line>
                    <line x1="21" y1="6" x2="3" y2="6"></line>
                    <line x1="21" y1="14" x2="3" y2="14"></line>
                    <line x1="17" y1="18" x2="3" y2="18"></line>
                  </svg>
                </button>
                <button
                  className="alignment-button"
                  onClick={() => handleTextAlignmentChange('Center')}
                  title="Align Center"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="10" x2="6" y2="10"></line>
                    <line x1="21" y1="6" x2="3" y2="6"></line>
                    <line x1="21" y1="14" x2="3" y2="14"></line>
                    <line x1="18" y1="18" x2="6" y2="18"></line>
                  </svg>
                </button>
                <button
                  className="alignment-button"
                  onClick={() => handleTextAlignmentChange('Right')}
                  title="Align Right"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="21" y1="10" x2="7" y2="10"></line>
                    <line x1="21" y1="6" x2="3" y2="6"></line>
                    <line x1="21" y1="14" x2="3" y2="14"></line>
                    <line x1="21" y1="18" x2="7" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
        
        {/* Add Icon Button */}
        <div className="toolbar-group">
          <label className="toolbar-label">Add Elements</label>
          <button 
            className="add-icon-button"
            onClick={() => setShowIconPicker(!showIconPicker)}
          >
            Add Icon
          </button>
          
          {showIconPicker && (
            <div className="icon-picker-grid">
              {SVG_ICONS.map(icon => (
                <div 
                  key={icon.id}
                  className="icon-picker-item"
                  onClick={() => handleAddIcon(icon)}
                  title={icon.name}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d={icon.path} />
                  </svg>
                  <span>{icon.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedEditorToolbar;
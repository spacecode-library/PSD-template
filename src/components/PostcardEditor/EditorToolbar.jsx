import React, { useState, useEffect } from 'react';
import { BLOCK_TYPES, SAMPLE_IMAGES } from './constants';

const EditorToolbar = ({ cesdk, selectedBlocks }) => {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blockType, setBlockType] = useState(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [showImagePicker, setShowImagePicker] = useState(false);
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
      
      // Get current properties
      if (type === BLOCK_TYPES.TEXT) {
        try {
          const colors = cesdk.block.getTextColors(block);
          if (colors && colors.length > 0) {
            setCurrentColor(rgbaToHex(colors[0]));
          }
          
          const fontSize = cesdk.block.getFloat(block, 'text/fontSize');
          setCurrentFontSize(fontSize);
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
    
    setShowImagePicker(false); // Close image picker when selection changes
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
      // Get or create image fill
      let fill = cesdk.block.getFill(selectedBlock);
      if (!fill || cesdk.block.getType(fill) !== '//ly.img.ubq/fill/image') {
        // Create new image fill
        fill = cesdk.block.createFill('image');
        cesdk.block.setFill(selectedBlock, fill);
      }
      
      // Set the new image
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

  const predefinedColors = [
    '#000000', '#FFFFFF', '#17A2B8', '#FFC107', '#FF6B6B',
    '#2C3E50', '#E74C3C', '#3498DB', '#27AE60', '#9B59B6'
  ];

  if (!selectedBlock) {
    return (
      <div className="editor-toolbar">
        <div className="toolbar-message">
          Select an element to edit its properties
        </div>
      </div>
    );
  }

  return (
    <div className="editor-toolbar">
      <div className="toolbar-section">
        <h3 className="toolbar-title">Edit Properties</h3>
        
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
        
        {/* Color Picker - Show for both text and colored graphics */}
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
      </div>
    </div>
  );
};

export default EditorToolbar;
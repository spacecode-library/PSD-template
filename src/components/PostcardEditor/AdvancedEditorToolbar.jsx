import React, { useState, useEffect } from 'react';
import './AdvancedEditorToolbar.css';

const ADVANCED_FONTS = [
  { name: 'Archivo Bold', url: 'https://cdn.img.ly/assets/v3/ly.img.typeface/fonts/Archivo/ArchivoBold.ttf' },
  { name: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans' },
  { name: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto' },
  { name: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato' },
  { name: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat' },
  { name: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display' }
];

const ICONS = [
  { name: 'Phone', svg: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' },
  { name: 'Email', svg: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
  { name: 'Location', svg: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
  { name: 'Website', svg: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
  { name: 'Clock', svg: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2' },
  { name: 'Star', svg: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' }
];

const AdvancedEditorToolbar = ({ cesdk, selectedBlocks }) => {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blockType, setBlockType] = useState(null);
  const [activeTab, setActiveTab] = useState('properties');
  
  // Text properties
  const [textContent, setTextContent] = useState('');
  const [textColor, setTextColor] = useState('#111827');
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textDecoration, setTextDecoration] = useState('none');
  const [textAlign, setTextAlign] = useState('left');
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    if (!cesdk || !selectedBlocks || selectedBlocks.length === 0) {
      setSelectedBlock(null);
      setBlockType(null);
      return;
    }

    const block = selectedBlocks[0];
    const type = cesdk.block.getType(block);
    setSelectedBlock(block);
    setBlockType(type);

    if (type === 'text') {
      // Load text properties
      const content = cesdk.block.getString(block, 'text/text');
      setTextContent(content);
      
      const size = cesdk.block.getFloat(block, 'text/fontSize');
      setFontSize(Math.round(size));
      
      const align = cesdk.block.getString(block, 'text/horizontalAlignment') || 'Left';
      setTextAlign(align.toLowerCase());
      
      // Get opacity
      const alpha = cesdk.block.getFloat(block, 'opacity');
      setOpacity(Math.round(alpha * 100));
      
      // Get text color
      try {
        const colors = cesdk.block.getTextColors(block);
        if (colors && colors.length > 0) {
          const color = colors[0];
          const hex = rgbaToHex(color.r, color.g, color.b);
          setTextColor(hex);
        }
      } catch (e) {
        console.log('Could not get text color');
      }
    }
  }, [cesdk, selectedBlocks]);

  const rgbaToHex = (r, g, b) => {
    const toHex = (n) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
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

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setTextContent(newText);
    
    if (selectedBlock && cesdk && blockType === 'text') {
      cesdk.block.setString(selectedBlock, 'text/text', newText);
    }
  };

  const handleColorChange = (e) => {
    const color = e.target.value;
    setTextColor(color);
    
    if (selectedBlock && cesdk && blockType === 'text') {
      const rgba = hexToRgba(color);
      if (rgba) {
        cesdk.block.setTextColor(selectedBlock, rgba);
      }
    }
  };

  const handleFontSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setFontSize(newSize);
    
    if (selectedBlock && cesdk && blockType === 'text') {
      cesdk.block.setFloat(selectedBlock, 'text/fontSize', newSize);
    }
  };

  const handleAlignChange = (align) => {
    setTextAlign(align);
    
    if (selectedBlock && cesdk && blockType === 'text') {
      const alignValue = align.charAt(0).toUpperCase() + align.slice(1);
      cesdk.block.setString(selectedBlock, 'text/horizontalAlignment', alignValue);
    }
  };

  const handleOpacityChange = (e) => {
    const newOpacity = parseInt(e.target.value);
    setOpacity(newOpacity);
    
    if (selectedBlock && cesdk) {
      cesdk.block.setFloat(selectedBlock, 'opacity', newOpacity / 100);
    }
  };

  const handleStyleToggle = (style) => {
    if (selectedBlock && cesdk && blockType === 'text') {
      if (style === 'bold') {
        const newWeight = fontWeight === 'bold' ? 'normal' : 'bold';
        setFontWeight(newWeight);
        // Note: Weight changes might need font variant support
      } else if (style === 'italic') {
        const newStyle = fontStyle === 'italic' ? 'normal' : 'italic';
        setFontStyle(newStyle);
        // Note: Style changes might need font variant support
      } else if (style === 'underline') {
        const newDecoration = textDecoration === 'underline' ? 'none' : 'underline';
        setTextDecoration(newDecoration);
        // Note: Text decoration might need additional implementation
      }
    }
  };

  const addIcon = async (iconPath) => {
    if (!cesdk) return;
    
    const page = cesdk.block.findByType('page')[0];
    if (!page) return;
    
    // Create SVG graphic block
    const svgBlock = cesdk.block.create('graphic');
    const shape = cesdk.block.createShape('rect');
    cesdk.block.setShape(svgBlock, shape);
    cesdk.block.setFloat(svgBlock, 'width', 1);
    cesdk.block.setFloat(svgBlock, 'height', 1);
    cesdk.block.setPositionX(svgBlock, 2.15);
    cesdk.block.setPositionY(svgBlock, 3.75);
    
    // Set fill color
    cesdk.block.setFillEnabled(svgBlock, true);
    const fill = cesdk.block.getFill(svgBlock);
    cesdk.block.setColor(fill, 'fill/color/value', {
      r: 0.125, g: 0.698, b: 0.667, a: 1 // Primary color
    });
    
    cesdk.block.appendChild(page, svgBlock);
    cesdk.block.select(svgBlock);
  };

  return (
    <div className="advanced-toolbar">
      <div className="toolbar-tabs">
        <button
          className={`tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Properties
        </button>
        <button
          className={`tab ${activeTab === 'style' ? 'active' : ''}`}
          onClick={() => setActiveTab('style')}
        >
          Style
        </button>
        <button
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Elements
        </button>
      </div>
      
      <div className="toolbar-panels">
        {activeTab === 'properties' && (
          <div className="properties-panel">
            {blockType === 'text' ? (
              <>
                <div className="panel-section">
                  <label>Text Content</label>
                  <textarea
                    value={textContent}
                    onChange={handleTextChange}
                    rows={4}
                    className="text-input"
                  />
                </div>
                
                <div className="panel-section">
                  <label>Font Size</label>
                  <div className="slider-control">
                    <input
                      type="range"
                      min="12"
                      max="96"
                      value={fontSize}
                      onChange={handleFontSizeChange}
                    />
                    <input
                      type="number"
                      min="12"
                      max="96"
                      value={fontSize}
                      onChange={handleFontSizeChange}
                      className="number-input"
                    />
                  </div>
                </div>
                
                <div className="panel-section">
                  <label>Alignment</label>
                  <div className="alignment-buttons">
                    <button
                      className={textAlign === 'left' ? 'active' : ''}
                      onClick={() => handleAlignChange('left')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/>
                      </svg>
                    </button>
                    <button
                      className={textAlign === 'center' ? 'active' : ''}
                      onClick={() => handleAlignChange('center')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 3h18v2H3V3zm3 4h12v2H6V7zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/>
                      </svg>
                    </button>
                    <button
                      className={textAlign === 'right' ? 'active' : ''}
                      onClick={() => handleAlignChange('right')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : selectedBlock ? (
              <div className="panel-section">
                <label>Element Type</label>
                <p className="info-text">{blockType}</p>
              </div>
            ) : (
              <div className="empty-state">
                <p>Select an element to edit its properties</p>
              </div>
            )}
            
            {selectedBlock && (
              <div className="panel-section">
                <label>Opacity</label>
                <div className="slider-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={handleOpacityChange}
                  />
                  <span className="slider-value">{opacity}%</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'style' && (
          <div className="style-panel">
            {blockType === 'text' ? (
              <>
                <div className="panel-section">
                  <label>Text Color</label>
                  <div className="color-picker-advanced">
                    <input
                      type="color"
                      value={textColor}
                      onChange={handleColorChange}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={handleColorChange}
                      className="color-text"
                    />
                  </div>
                </div>
                
                <div className="panel-section">
                  <label>Text Style</label>
                  <div className="style-buttons">
                    <button
                      className={fontWeight === 'bold' ? 'active' : ''}
                      onClick={() => handleStyleToggle('bold')}
                    >
                      B
                    </button>
                    <button
                      className={fontStyle === 'italic' ? 'active' : ''}
                      onClick={() => handleStyleToggle('italic')}
                    >
                      I
                    </button>
                    <button
                      className={textDecoration === 'underline' ? 'active' : ''}
                      onClick={() => handleStyleToggle('underline')}
                    >
                      U
                    </button>
                  </div>
                </div>
                
                <div className="panel-section">
                  <label>Font Family</label>
                  <select className="font-select">
                    {ADVANCED_FONTS.map((font, index) => (
                      <option key={index} value={font.url}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Select a text element to style it</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'add' && (
          <div className="add-panel">
            <div className="panel-section">
              <label>Add Icons</label>
              <div className="icon-grid">
                {ICONS.map((icon) => (
                  <button
                    key={icon.name}
                    className="icon-button"
                    onClick={() => addIcon(icon.svg)}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={icon.svg} />
                    </svg>
                    <span>{icon.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedEditorToolbar;
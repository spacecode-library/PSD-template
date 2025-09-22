import React, { useState, useEffect } from 'react';
import './SimpleEditorToolbar.enhanced.css';

const SIMPLE_FONTS = [
  { name: 'Archivo Bold', url: 'https://cdn.img.ly/assets/v3/ly.img.typeface/fonts/Archivo/ArchivoBold.ttf' },
  { name: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans' },
  { name: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto' }
];

const PRESET_COLORS = [
  '#20B2AA', '#1A9D96', '#111827', '#FFFFFF', '#DC2626',
  '#F59E0B', '#10B981', '#3B82F6', '#9333EA', '#6B7280'
];

const SAMPLE_IMAGES = [
  { name: 'Office', url: 'https://img.ly/static/ubq_samples/imgly_logo.jpg' },
  { name: 'Team', url: 'https://img.ly/static/ubq_samples/sample_1_1024x683.jpg' },
  { name: 'Product', url: 'https://img.ly/static/ubq_samples/sample_2_1024x683.jpg' },
  { name: 'Service', url: 'https://img.ly/static/ubq_samples/sample_3_1024x768.jpg' },
  { name: 'Location', url: 'https://img.ly/static/ubq_samples/sample_4_1024x682.jpg' }
];

const BASIC_SHAPES = [
  { name: 'Rectangle', type: 'rect', icon: '▭' },
  { name: 'Circle', type: 'ellipse', icon: '●' },
  { name: 'Line', type: 'line', icon: '━' }
];

const SimpleEditorToolbar = ({ cesdk, selectedBlocks }) => {
  const [selectedTextBlock, setSelectedTextBlock] = useState(null);
  const [selectedImageBlock, setSelectedImageBlock] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [textColor, setTextColor] = useState('#111827');
  const [fontSize, setFontSize] = useState(24);
  const [selectedFont, setSelectedFont] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [activePanel, setActivePanel] = useState('edit');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!cesdk || !selectedBlocks || selectedBlocks.length === 0) {
      setSelectedTextBlock(null);
      setSelectedImageBlock(null);
      return;
    }

    const block = selectedBlocks[0];
    
    try {
      // Check if block is valid
      if (!cesdk.block.isValid(block)) {
        setSelectedTextBlock(null);
        setSelectedImageBlock(null);
        return;
      }
      
      const blockType = cesdk.block.getType(block);

      // Get opacity
      const alpha = cesdk.block.getFloat(block, 'opacity');
      setOpacity(Math.round(alpha * 100));

      if (blockType === 'text') {
        setSelectedTextBlock(block);
        setSelectedImageBlock(null);
        
        // Get current text content
        const content = cesdk.block.getString(block, 'text/text');
        setTextContent(content);
        
        // Get current font size
        const size = cesdk.block.getFloat(block, 'text/fontSize');
        setFontSize(Math.round(size));
        
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
      } else if (blockType === 'graphic') {
        // Check if it's an image
        try {
          const fills = cesdk.block.getFills(block);
          if (fills.length > 0 && cesdk.block.isValid(fills[0])) {
            const fillType = cesdk.block.getType(fills[0]);
            if (fillType === 'image') {
              setSelectedImageBlock(block);
              setSelectedTextBlock(null);
            }
          }
        } catch (e) {
          console.log('Could not get fills');
        }
      } else {
        setSelectedTextBlock(null);
        setSelectedImageBlock(null);
      }
    } catch (error) {
      console.error('Error in selection handling:', error);
      setSelectedTextBlock(null);
      setSelectedImageBlock(null);
    }
  }, [cesdk, selectedBlocks]);

  // Check undo/redo availability
  useEffect(() => {
    if (!cesdk) return;

    const checkHistory = () => {
      try {
        setCanUndo(cesdk.editor.canUndo());
        setCanRedo(cesdk.editor.canRedo());
      } catch (e) {
        console.log('History not available');
      }
    };

    checkHistory();
    
    // Subscribe to changes
    const unsubscribe = cesdk.editor.onHistoryUpdated(checkHistory);
    return () => unsubscribe();
  }, [cesdk]);

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
    
    if (selectedTextBlock && cesdk) {
      try {
        if (cesdk.block.isValid(selectedTextBlock)) {
          cesdk.block.setString(selectedTextBlock, 'text/text', newText);
        }
      } catch (error) {
        console.error('Failed to update text:', error);
      }
    }
  };

  const handleColorChange = (color) => {
    setTextColor(color);
    
    if (selectedTextBlock && cesdk) {
      try {
        if (cesdk.block.isValid(selectedTextBlock)) {
          const rgba = hexToRgba(color);
          if (rgba) {
            cesdk.block.setTextColor(selectedTextBlock, rgba);
          }
        }
      } catch (error) {
        console.error('Failed to update color:', error);
      }
    }
  };

  const handleFontSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setFontSize(newSize);
    
    if (selectedTextBlock && cesdk) {
      try {
        if (cesdk.block.isValid(selectedTextBlock)) {
          cesdk.block.setFloat(selectedTextBlock, 'text/fontSize', newSize);
        }
      } catch (error) {
        console.error('Failed to update font size:', error);
      }
    }
  };

  const handleFontChange = (index) => {
    setSelectedFont(index);
    
    if (selectedTextBlock && cesdk) {
      try {
        if (cesdk.block.isValid(selectedTextBlock)) {
          cesdk.block.setString(selectedTextBlock, 'text/fontFileUri', SIMPLE_FONTS[index].url);
        }
      } catch (error) {
        console.error('Failed to update font:', error);
      }
    }
  };

  const handleOpacityChange = (e) => {
    const newOpacity = parseInt(e.target.value);
    setOpacity(newOpacity);
    
    const block = selectedTextBlock || selectedImageBlock;
    if (block && cesdk) {
      try {
        if (cesdk.block.isValid(block)) {
          cesdk.block.setFloat(block, 'opacity', newOpacity / 100);
        }
      } catch (error) {
        console.error('Failed to update opacity:', error);
      }
    }
  };

  const handleImageReplace = async (imageUrl) => {
    if (!selectedImageBlock || !cesdk) return;
    
    try {
      const fills = cesdk.block.getFills(selectedImageBlock);
      if (fills.length > 0) {
        cesdk.block.setSourceSet(fills[0], 'fill/image/sourceSet', [{
          uri: imageUrl,
          width: 1024,
          height: 683
        }]);
      }
    } catch (error) {
      console.error('Failed to replace image:', error);
    }
  };

  const handleAddText = () => {
    if (!cesdk) return;
    
    try {
      const page = cesdk.block.findByType('page')[0];
      if (!page) return;
      
      const textBlock = cesdk.block.create('text');
      cesdk.block.setString(textBlock, 'text/text', 'Click to edit text');
      cesdk.block.setFloat(textBlock, 'width', 3);
      cesdk.block.setFloat(textBlock, 'height', 0.5);
      cesdk.block.setPositionX(textBlock, 1.15);
      cesdk.block.setPositionY(textBlock, 3.75);
      cesdk.block.appendChild(page, textBlock);
      
      // Select the new text block
      cesdk.block.select(textBlock);
    } catch (error) {
      console.error('Failed to add text:', error);
    }
  };

  const handleAddShape = (shapeType) => {
    if (!cesdk) return;
    
    try {
      const page = cesdk.block.findByType('page')[0];
      if (!page) return;
      
      const shapeBlock = cesdk.block.create('graphic');
      const shape = cesdk.block.createShape(shapeType);
      cesdk.block.setShape(shapeBlock, shape);
      
      if (shapeType === 'line') {
        cesdk.block.setFloat(shapeBlock, 'width', 2);
        cesdk.block.setFloat(shapeBlock, 'height', 0.1);
      } else {
        cesdk.block.setFloat(shapeBlock, 'width', 1);
        cesdk.block.setFloat(shapeBlock, 'height', 1);
      }
      
      cesdk.block.setPositionX(shapeBlock, 2.15);
      cesdk.block.setPositionY(shapeBlock, 3.75);
      
      // Set fill color
      cesdk.block.setFillEnabled(shapeBlock, true);
      const fill = cesdk.block.getFill(shapeBlock);
      cesdk.block.setColor(fill, 'fill/color/value', hexToRgba('#20B2AA'));
      
      cesdk.block.appendChild(page, shapeBlock);
      cesdk.block.select(shapeBlock);
    } catch (error) {
      console.error('Failed to add shape:', error);
    }
  };

  const handleUndo = () => {
    if (cesdk && canUndo) {
      try {
        cesdk.editor.undo();
      } catch (error) {
        console.error('Failed to undo:', error);
      }
    }
  };

  const handleRedo = () => {
    if (cesdk && canRedo) {
      try {
        cesdk.editor.redo();
      } catch (error) {
        console.error('Failed to redo:', error);
      }
    }
  };

  const handleDelete = () => {
    const block = selectedTextBlock || selectedImageBlock;
    if (block && cesdk) {
      try {
        if (cesdk.block.isValid(block)) {
          cesdk.block.destroy(block);
          setSelectedTextBlock(null);
          setSelectedImageBlock(null);
        }
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  return (
    <div className="simple-toolbar-enhanced">
      <div className="toolbar-header-enhanced">
        <h2>Edit Tools</h2>
        <div className="history-controls">
          <button 
            className={`history-btn ${!canUndo ? 'disabled' : ''}`}
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo"
          >
            ↶
          </button>
          <button 
            className={`history-btn ${!canRedo ? 'disabled' : ''}`}
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo"
          >
            ↷
          </button>
        </div>
      </div>
      
      <div className="panel-tabs-simple">
        <button
          className={`tab-simple ${activePanel === 'edit' ? 'active' : ''}`}
          onClick={() => setActivePanel('edit')}
        >
          Edit
        </button>
        <button
          className={`tab-simple ${activePanel === 'add' ? 'active' : ''}`}
          onClick={() => setActivePanel('add')}
        >
          Add
        </button>
      </div>
      
      <div className="toolbar-content-enhanced">
        {activePanel === 'edit' ? (
          <>
            {selectedTextBlock ? (
              <>
                <div className="tool-section">
                  <h3>Edit Text</h3>
                  <textarea
                    className="text-editor"
                    value={textContent}
                    onChange={handleTextChange}
                    placeholder="Type your text here..."
                    rows={3}
                  />
                </div>
                
                <div className="tool-section">
                  <h3>Text Color</h3>
                  <div className="color-grid">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`color-swatch ${textColor === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange(color)}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="tool-section">
                  <h3>Font Style</h3>
                  <div className="font-selector-simple">
                    {SIMPLE_FONTS.map((font, index) => (
                      <button
                        key={index}
                        className={`font-option ${selectedFont === index ? 'active' : ''}`}
                        onClick={() => handleFontChange(index)}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="tool-section">
                  <h3>Text Size</h3>
                  <div className="size-control">
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={fontSize}
                      onChange={handleFontSizeChange}
                      className="size-slider"
                    />
                    <span className="size-value">{fontSize}pt</span>
                  </div>
                </div>
              </>
            ) : selectedImageBlock ? (
              <div className="tool-section">
                <h3>Replace Image</h3>
                <div className="image-grid">
                  {SAMPLE_IMAGES.map((image) => (
                    <button
                      key={image.name}
                      className="image-option"
                      onClick={() => handleImageReplace(image.url)}
                    >
                      <img src={image.url} alt={image.name} />
                      <span>{image.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <div className="empty-icon">✏️</div>
                <p>Click on text or images to edit</p>
              </div>
            )}
            
            {(selectedTextBlock || selectedImageBlock) && (
              <>
                <div className="tool-section">
                  <h3>Transparency</h3>
                  <div className="opacity-control">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opacity}
                      onChange={handleOpacityChange}
                      className="opacity-slider"
                    />
                    <span className="opacity-value">{opacity}%</span>
                  </div>
                </div>
                
                <div className="action-section">
                  <button className="delete-btn" onClick={handleDelete}>
                    🗑 Delete Element
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="add-panel">
            <div className="tool-section">
              <h3>Add Elements</h3>
              <div className="add-buttons">
                <button className="add-btn" onClick={handleAddText}>
                  <span className="add-icon">T</span>
                  <span>Add Text</span>
                </button>
                
                {BASIC_SHAPES.map(shape => (
                  <button 
                    key={shape.type}
                    className="add-btn"
                    onClick={() => handleAddShape(shape.type)}
                  >
                    <span className="add-icon">{shape.icon}</span>
                    <span>{shape.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="tool-section">
              <p className="tip">💡 Tip: Click any element to edit its properties</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleEditorToolbar;
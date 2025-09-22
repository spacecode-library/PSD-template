import { isRGBAColor } from '@cesdk/engine';

const SCENE_PADDING = 60;

export const SimpleEditorPlugin = () => ({
  name: 'ly.img.simple-postcard-editor',
  version: '1.0.0',
  initialize: async ({ cesdk }) => {
    if (cesdk == null) return;

    const engine = cesdk.engine;

    // Configure engine for restricted editing
    engine.editor.setSettingBool('page/title/show', false);
    engine.editor.setSettingBool('mouse/enableScroll', false);
    engine.editor.setSettingBool('mouse/enableZoom', false);

    // Hide all UI elements - we want custom form-based controls
    cesdk.ui.setInspectorBarOrder([]);
    cesdk.ui.setDockOrder([]);
    cesdk.ui.setCanvasBarOrder([], 'bottom');
    cesdk.ui.setNavigationBarOrder([
      'ly.img.undoRedo.navigationBar',
      'ly.img.spacer',
      'ly.img.actions.navigationBar'
    ]);

    // Disable page resize feature
    cesdk.feature.enable('ly.img.page.resize', false);

    // Allow selection, but we'll control what can be selected per element
    engine.editor.setGlobalScope('editor/select', 'Allow');

    // Set up translations
    cesdk.i18n.setTranslations({
      en: {
        'panel.simple-editor': 'Edit Postcard'
      }
    });

    let imageBlocks = [];
    let editableImageBlocks = [];
    let textBlocks = [];
    let editableTextBlocks = [];
    let colors = {};

    // Set up automatic canvas fitting with ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      const scene = engine.scene?.get();
      if (!engine.scene || !scene) {
        return;
      }
      
      // Fit the scene to the canvas with padding
      engine.scene.zoomToBlock(
        scene,
        SCENE_PADDING,
        SCENE_PADDING,
        SCENE_PADDING,
        SCENE_PADDING
      );
    });
    
    // Observe the engine canvas element for size changes
    if (engine.element) {
      resizeObserver.observe(engine.element);
    }

    // Set up scene change handler
    engine.scene.onActiveChanged(() => {
      async function setupScene() {
        // Relocate resources to blob URLs for preview
        relocateResourcesToBlobURLs(engine);
        
        // Deselect all blocks
        engine.block.findAllSelected().forEach((block) => {
          engine.block.setSelected(block, false);
        });

        // Find editable elements
        imageBlocks = getEditableImageBlocks(engine);
        editableImageBlocks = blocksToEditableProperties(engine, imageBlocks);

        textBlocks = getEditableTextBlocks(engine);
        editableTextBlocks = blocksToEditableProperties(engine, textBlocks, (block) => {
          const text = engine.block.getString(block, 'text/text');
          return {
            expanded: text.includes('\n')
          };
        });

        colors = getAllColors(engine);

        // Debug: Review all layers and components
        reviewAllLayersAndComponents(engine);

        // Configure selection permissions for all blocks
        setupSelectionPermissions(engine, imageBlocks, textBlocks);

        // Wait for resources to load then fit the canvas
        await waitUntilLoaded(engine);
        const scene = engine.scene.get();
        if (scene) {
          engine.scene.zoomToBlock(
            scene,
            SCENE_PADDING,
            SCENE_PADDING,
            SCENE_PADDING,
            SCENE_PADDING
          );
        }

        // Reset history to clean state
        let oldHistory = engine.editor.getActiveHistory();
        let newHistory = engine.editor.createHistory();
        engine.editor.setActiveHistory(newHistory);
        engine.editor.destroyHistory(oldHistory);
        engine.editor.addUndoStep();
      }
      setupScene();
    });

    // Set up selection change handler to provide user feedback
    engine.block.onSelectionChanged(() => {
      const selected = engine.block.findAllSelected();
      if (selected.length > 0) {
        const selectedBlock = selected[0];
        const blockType = engine.block.getType(selectedBlock);
        const blockName = engine.block.getName(selectedBlock) || `Block ${selectedBlock}`;
        
        // Provide feedback about what's selected
        if (blockType === '//ly.img.ubq/text') {
          const textContent = engine.block.getString(selectedBlock, 'text/text');
          console.log(`📝 Text selected: "${blockName}" - Content: "${textContent}"`);
          console.log(`👉 You can now edit this text in the form panel on the right`);
        } else if (blockType === '//ly.img.ubq/graphic') {
          console.log(`🖼️ Image selected: "${blockName}"`);
          console.log(`👉 You can now replace this image in the form panel on the right`);
        }
      } else {
        console.log(`👆 Click on any text or image to select and edit it`);
      }
    });

    // Register the dynamic selection-based panel for editing
    cesdk.ui.registerPanel(
      'simple-editor',
      ({ builder, engine, state }) => {
        console.group('🎛️ BUILDING DYNAMIC SIDEBAR PANEL');
        
        const pages = engine.block.findByType('page');
        console.log(`Found ${pages.length} pages`);
        if (pages.length === 0) {
          console.warn('No pages found - sidebar will be empty');
          console.groupEnd();
          return;
        }
        
        // Get current selection
        const selectedBlocks = engine.block.findAllSelected();
        const selectedBlock = selectedBlocks.length > 0 ? selectedBlocks[0] : null;
        
        console.log(`📊 Current selection: ${selectedBlock ? `Block ${selectedBlock} (${engine.block.getType(selectedBlock)})` : 'None'}`);
        console.log(`📊 Available content for sidebar:`);
        console.log(`   • Image blocks: ${imageBlocks.length}`);
        console.log(`   • Text blocks: ${textBlocks.length}`);
        console.log(`   • Color options: ${Object.keys(colors).length}`);
        
        // Build different sections based on what's selected
        if (selectedBlock) {
          buildContextualSidebar(builder, engine, state, selectedBlock, {
            imageBlocks,
            editableImageBlocks,
            textBlocks,
            editableTextBlocks,
            colors
          });
        } else {
          buildOverviewSidebar(builder, engine, state, {
            imageBlocks,
            editableImageBlocks,
            textBlocks,
            editableTextBlocks,
            colors
          });
        }

        // Remove old static sections - now using dynamic contextual sidebar
        /*
          builder.Section('simple-editor.images', {
            title: 'Images',
            children: () => {
              editableImageBlocks.forEach(({ blocks, name }) => {
                const block = blocks[0];
                const fillBlock = engine.block.getFill(block);
                const uri = 
                  engine.block.getSourceSet(fillBlock, 'fill/image/sourceSet')?.[0]?.uri ??
                  engine.block.getString(fillBlock, 'fill/image/imageFileURI');

                const uploadState = state(`imageUpload-${block}`, false);
                const blockName = name || 'Image';

                builder.MediaPreview(`imagePreview-${block}`, {
                  size: 'small',
                  preview: {
                    type: 'image',
                    uri
                  },
                  action: {
                    label: `Change ${blockName}`,
                    isLoading: uploadState.value,
                    onClick: () => {
                      uploadState.setValue(true);
                      uploadFile({
                        supportedMimeTypes: ['image/*']
                      }).then((files) => {
                        const [file] = files;
                        if (file != null) {
                          const url = URL.createObjectURL(file);
                          blocks.forEach((blockToChange) => {
                            const fillToChange = engine.block.getFill(blockToChange);
                            engine.block.setString(fillToChange, 'fill/image/imageFileURI', '');
                            engine.block.setSourceSet(fillToChange, 'fill/image/sourceSet', []);
                            
                            engine.block
                              .addImageFileURIToSourceSet(fillToChange, 'fill/image/sourceSet', url)
                              .then(() => {
                                uploadState.setValue(false);
                                engine.editor.addUndoStep();
                              })
                              .catch(() => {
                                console.error('Error uploading image');
                                uploadState.setValue(false);
                              });
                          });
                        }
                      }).catch(() => {
                        uploadState.setValue(false);
                      });
                    }
                  }
                });
              });
            }
          });
        }

        // Text editing section
        console.log(`📝 Building text section with ${textBlocks.length} blocks and ${editableTextBlocks.length} editable groups`);
        if (textBlocks.length > 0) {
          const textBlockState = state('textBlockState', new Map(
            editableTextBlocks.map(({ name, options }) => [name, options])
          ));
          
          // Force refresh text values when blocks change
          const textValuesState = state('textValues', new Map());
          
          builder.Section('simple-editor.text', {
            title: 'Text',
            children: () => {
              editableTextBlocks.forEach(({ blocks, name }) => {
                try {
                  // Validate blocks still exist
                  const validBlocks = blocks.filter(block => {
                    try {
                      return engine.block.isValid(block);
                    } catch (error) {
                      console.warn(`Block ${block} is no longer valid for text editing`);
                      return false;
                    }
                  });
                  
                  if (validBlocks.length === 0) {
                    console.warn(`No valid blocks found for text section: ${name}`);
                    return;
                  }

                  // Get current text value with error handling
                  let currentValue = '';
                  try {
                    currentValue = engine.block.getString(validBlocks[0], 'text/text') || '';
                  } catch (error) {
                    console.warn(`Failed to get text for block ${validBlocks[0]}:`, error);
                    currentValue = textValuesState.value.get(name) || '';
                  }
                  
                  // Update cached value
                  textValuesState.value.set(name, currentValue);
                  
                  const setValue = (newValue) => {
                    try {
                      if (!newValue && newValue !== '') {
                        console.warn('Invalid text value provided');
                        return;
                      }
                      
                      // Update all valid blocks
                      let updatedCount = 0;
                      validBlocks.forEach((block) => {
                        try {
                          if (engine.block.isValid(block)) {
                            engine.block.replaceText(block, newValue);
                            updatedCount++;
                          }
                        } catch (blockError) {
                          console.warn(`Failed to update text for block ${block}:`, blockError);
                        }
                      });
                      
                      if (updatedCount > 0) {
                        // Update cached value
                        textValuesState.value.set(name, newValue);
                        engine.editor.addUndoStep();
                        console.log(`✅ Updated text "${name}" to "${newValue}" (${updatedCount} blocks)`);
                      } else {
                        console.warn(`Failed to update any blocks for text "${name}"`);
                      }
                    } catch (setError) {
                      console.error(`Error setting text value for "${name}":`, setError);
                    }
                  };

                  const expanded = textBlockState.value.get(name)?.expanded ?? false;
                  
                  // Create unique key for each text input to ensure proper re-rendering
                  const inputKey = `text-${name}-${validBlocks[0]}`;
                  
                  if (expanded) {
                    builder.TextArea(inputKey, {
                      inputLabel: `${name} (${validBlocks.length} block${validBlocks.length > 1 ? 's' : ''})`,
                      value: currentValue,
                      setValue,
                      placeholder: 'Enter your text here...'
                    });
                  } else {
                    builder.TextInput(inputKey, {
                      inputLabel: `${name} (${validBlocks.length} block${validBlocks.length > 1 ? 's' : ''})`,
                      value: currentValue,
                      setValue,
                      placeholder: 'Enter your text here...'
                    });
                  }
                } catch (sectionError) {
                  console.error(`Error creating text input for "${name}":`, sectionError);
                  
                  // Create fallback text input
                  builder.TextInput(`text-error-${name}`, {
                    inputLabel: `${name} (Error)`,
                    value: 'Error loading text',
                    setValue: () => console.warn(`Text input "${name}" is in error state`),
                    disabled: true
                  });
                }
              });
            }
          });
        }

        // Color editing section
        if (Object.keys(colors).length > 0) {
          builder.Section('simple-editor.colors', {
            title: 'Colors',
            children: () => {
              Object.keys(colors).forEach((colorId, i) => {
                const color = JSON.parse(colorId);
                const colorState = state(`color-${colorId}`, color);
                const foundColors = colors[colorId];

                builder.ColorInput(`color-${colorId}`, {
                  inputLabel: `Color ${i + 1}`,
                  value: colorState.value,
                  setValue: (newValue) => {
                    colorState.setValue(newValue);

                    foundColors.forEach((foundColor) => {
                      if (foundColor.type === 'fill') {
                        const fill = engine.block.getFill(foundColor.id);
                        engine.block.setColor(fill, 'fill/color/value', {
                          ...newValue,
                          a: foundColor.initialOpacity
                        });
                      } else if (foundColor.type === 'stroke') {
                        engine.block.setStrokeColor(foundColor.id, {
                          ...newValue,
                          a: foundColor.initialOpacity
                        });
                      } else if (foundColor.type === 'text') {
                        engine.block.setTextColor(foundColor.id, {
                          ...newValue,
                          a: foundColor.initialOpacity
                        });
                      }
                    });
                    
                    engine.editor.addUndoStep();
                  }
                });
              });
            }
          });
        */
        
        console.groupEnd();
      }
    );

    // Open the panel and make it non-closable
    cesdk.ui.openPanel('simple-editor', { closableByUser: false });

    // Cleanup function
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }
});

// Helper functions
const waitUntilLoaded = async (engine) => {
  const scene = engine.scene.get();
  if (scene) {
    await engine.block.forceLoadResources([scene]);
  }
};

const reviewAllLayersAndComponents = (engine) => {
  console.group('🔍 Scene Analysis - All Layers and Components');
  
  try {
    const scene = engine.scene.get();
    if (!scene) {
      console.log('No scene found');
      console.groupEnd();
      return;
    }

    const allBlocks = engine.block.findAll();
    console.log(`Total blocks in scene: ${allBlocks.length}`);
    
    // Filter out invalid blocks (like 4294967295)
    const validBlocks = allBlocks.filter((blockId) => {
      if (blockId === 4294967295 || blockId < 0) {
        console.warn(`Skipping invalid block ID: ${blockId}`);
        return false;
      }
      
      try {
        // Test if block still exists
        return engine.block.isValid(blockId);
      } catch (error) {
        console.warn(`Block ${blockId} is no longer valid:`, error);
        return false;
      }
    });
    
    console.log(`Valid blocks: ${validBlocks.length} out of ${allBlocks.length}`);
    
    // Analyze each valid block
    validBlocks.forEach((blockId, index) => {
      try {
        const blockType = engine.block.getType(blockId);
        const blockName = engine.block.getName(blockId) || `Block ${blockId}`;
        const isVisible = engine.block.isVisible(blockId);
        const hasParent = engine.block.getParent(blockId);
        const children = engine.block.getChildren(blockId);
        
        console.group(`📦 Block ${index + 1}: ${blockName} (ID: ${blockId})`);
        console.log(`Type: ${blockType}`);
        console.log(`Visible: ${isVisible}`);
        console.log(`Parent: ${hasParent}`);
        console.log(`Children: ${children.length}`);
        
        // Check specific properties based on type
        if (blockType === '//ly.img.ubq/text') {
          const text = engine.block.getString(blockId, 'text/text');
          const textEditScope = engine.block.isScopeEnabled(blockId, 'text/edit');
          const textColors = engine.block.getTextColors(blockId);
          console.log(`📝 Text content: "${text}"`);
          console.log(`📝 Text editable: ${textEditScope}`);
          console.log(`📝 Text colors: ${textColors.length} color(s)`);
          
          // Check if text has formatting
          try {
            const fontSizes = engine.block.getTextFontSizes(blockId);
            const fontFamilies = engine.block.getTextFontFamilies(blockId);
            console.log(`📝 Font families: ${fontFamilies.length} different font(s)`);
            console.log(`📝 Font sizes: ${fontSizes.length} different size(s)`);
          } catch (e) {
            console.log(`📝 Basic text formatting`);
          }
        } else if (blockType === '//ly.img.ubq/graphic') {
          const hasFill = engine.block.supportsFill(blockId);
          if (hasFill) {
            const fillBlock = engine.block.getFill(blockId);
            const fillType = engine.block.getType(fillBlock);
            const fillChangeScope = engine.block.isScopeEnabled(blockId, 'fill/change');
            console.log(`Fill type: ${fillType}`);
            console.log(`Fill changeable: ${fillChangeScope}`);
          }
        } else if (blockType === '//ly.img.ubq/page') {
          const width = engine.block.getWidth(blockId);
          const height = engine.block.getHeight(blockId);
          console.log(`Page dimensions: ${width}" x ${height}"`);
        }
        
        // Check selection scope
        const selectScope = engine.block.isScopeEnabled(blockId, 'editor/select');
        console.log(`Selectable: ${selectScope}`);
        
        console.groupEnd();
      } catch (blockError) {
        console.error(`Error analyzing block ${blockId}:`, blockError);
      }
    });
  } catch (error) {
    console.error('Error in reviewAllLayersAndComponents:', error);
  }
  
  console.groupEnd();
};

const setupSelectionPermissions = (engine, imageBlocks, textBlocks) => {
  console.group('🎯 Setting up selection permissions...');
  
  // Get all blocks in the scene
  const allBlocks = engine.block.findAll();
  
  // Create sets for easy lookup
  const editableImageSet = new Set(imageBlocks);
  const editableTextSet = new Set(textBlocks);
  
  console.log(`📊 Summary:`);
  console.log(`   • Editable images: ${imageBlocks.length}`);
  console.log(`   • Editable text blocks: ${textBlocks.length}`);
  console.log(`   • Total blocks: ${allBlocks.length}`);
  
  // Log details about each text block
  if (textBlocks.length > 0) {
    console.group('📝 Text blocks that will be editable:');
    textBlocks.forEach((blockId, index) => {
      const blockName = engine.block.getName(blockId) || `Text Block ${blockId}`;
      const textContent = engine.block.getString(blockId, 'text/text');
      console.log(`   ${index + 1}. "${blockName}": "${textContent}"`);
    });
    console.groupEnd();
  }
  
  // Log details about each image block  
  if (imageBlocks.length > 0) {
    console.group('🖼️ Image blocks that will be editable:');
    imageBlocks.forEach((blockId, index) => {
      const blockName = engine.block.getName(blockId) || `Image Block ${blockId}`;
      console.log(`   ${index + 1}. "${blockName}" (ID: ${blockId})`);
    });
    console.groupEnd();
  }
  
  allBlocks.forEach((blockId) => {
    const blockType = engine.block.getType(blockId);
    const blockName = engine.block.getName(blockId) || `Block ${blockId}`;
    
    // Disable selection for pages and non-editable elements
    if (blockType === '//ly.img.ubq/page') {
      engine.block.setScopeEnabled(blockId, 'editor/select', false);
      console.log(`❌ Disabled selection for page: ${blockName}`);
    }
    // Enable selection only for editable text and image blocks
    else if (editableTextSet.has(blockId) || editableImageSet.has(blockId)) {
      engine.block.setScopeEnabled(blockId, 'editor/select', true);
      
      // Disable moving/resizing for these blocks while keeping them selectable
      engine.block.setScopeEnabled(blockId, 'layer/move', false);
      engine.block.setScopeEnabled(blockId, 'layer/resize', false);
      engine.block.setScopeEnabled(blockId, 'layer/rotate', false);
      
      console.log(`✅ Enabled selection for editable element: ${blockName} (${blockType})`);
    }
    // Disable selection for all other elements (backgrounds, shapes, etc.)
    else {
      engine.block.setScopeEnabled(blockId, 'editor/select', false);
      console.log(`❌ Disabled selection for non-editable element: ${blockName} (${blockType})`);
    }
  });
  
  console.groupEnd();
};

const getAllColors = (engine) => {
  const allElements = engine.block.findAll();
  const blocksByColors = {};

  allElements.forEach((element) => {
    // Handle fill colors
    const hasFillColor = 
      engine.block.supportsFill(element) &&
      engine.block.isValid(engine.block.getFill(element)) &&
      engine.block.getType(engine.block.getFill(element)) === '//ly.img.ubq/fill/color' &&
      engine.block.isFillEnabled(element) &&
      engine.block.getType(element) !== '//ly.img.ubq/text';

    if (hasFillColor && engine.block.isScopeEnabled(element, 'fill/change')) {
      const fill = engine.block.getFill(element);
      const color = engine.block.getColor(fill, 'fill/color/value');
      if (isRGBAColor(color)) {
        const initialOpacity = color.a;
        const colorKey = JSON.stringify({ ...color, a: 1 });
        
        blocksByColors[colorKey] = blocksByColors[colorKey] || [];
        blocksByColors[colorKey].push({
          id: element,
          color: { ...color, a: 1 },
          initialOpacity,
          type: 'fill'
        });
      }
    }

    // Handle stroke colors
    const hasStroke = 
      engine.block.supportsStroke(element) &&
      engine.block.isStrokeEnabled(element);

    if (hasStroke && engine.block.isScopeEnabled(element, 'stroke/change')) {
      const color = engine.block.getStrokeColor(element);
      if (isRGBAColor(color)) {
        const initialOpacity = color.a;
        const colorKey = JSON.stringify({ ...color, a: 1 });
        
        blocksByColors[colorKey] = blocksByColors[colorKey] || [];
        blocksByColors[colorKey].push({
          id: element,
          color: { ...color, a: 1 },
          initialOpacity,
          type: 'stroke'
        });
      }
    }

    // Handle text colors
    if (engine.block.getType(element) === '//ly.img.ubq/text') {
      const textColors = engine.block.getTextColors(element);
      if (textColors.length === 1) {
        const color = textColors[0];
        if (isRGBAColor(color)) {
          const initialOpacity = color.a;
          const colorKey = JSON.stringify({ ...color, a: 1 });
          
          blocksByColors[colorKey] = blocksByColors[colorKey] || [];
          blocksByColors[colorKey].push({
            id: element,
            color: { ...color, a: 1 },
            initialOpacity,
            type: 'text'
          });
        }
      }
    }
  });

  return blocksByColors;
};

const getEditableTextBlocks = (engine) => {
  try {
    // Get ALL text blocks in the scene - use the correct type identifier
    const allTextBlocks = engine.block.findByType('//ly.img.ubq/text');
    
    console.log(`🔍 TEXT BLOCK DISCOVERY: Found ${allTextBlocks.length} text blocks total`);
    if (allTextBlocks.length > 0) {
      console.group('📝 Raw text blocks found:');
      allTextBlocks.forEach((blockId, index) => {
        try {
          const blockName = engine.block.getName(blockId) || `Unnamed`;
          const textContent = engine.block.getString(blockId, 'text/text') || '';
          const isEditable = engine.block.isScopeEnabled(blockId, 'text/edit');
          console.log(`   ${index + 1}. ID:${blockId} "${blockName}" - "${textContent}" (Editable: ${isEditable})`);
        } catch (error) {
          console.log(`   ${index + 1}. ID:${blockId} - ERROR: ${error.message}`);
        }
      });
      console.groupEnd();
    } else {
      console.warn('⚠️ NO TEXT BLOCKS FOUND - This could indicate:');
      console.warn('   • PSD import may not have completed yet');
      console.warn('   • Text blocks might be nested inside groups');
      console.warn('   • Text might be converted to shapes/images during import');
    }
    
    // Filter out invalid blocks and force enable text editing for valid ones
    const validTextBlocks = allTextBlocks.filter((blockId) => {
      try {
        // Check for invalid block IDs
        if (blockId === 4294967295 || blockId < 0) {
          console.warn(`Skipping invalid text block ID: ${blockId}`);
          return false;
        }
        
        if (!engine.block.isValid(blockId)) {
          console.warn(`Text block ${blockId} is no longer valid`);
          return false;
        }

        const currentlyEditable = engine.block.isScopeEnabled(blockId, 'text/edit');
        const blockName = engine.block.getName(blockId) || `Text Block ${blockId}`;
        const textContent = engine.block.getString(blockId, 'text/text');
        
        if (!currentlyEditable) {
          // Force enable text editing scope
          engine.block.setScopeEnabled(blockId, 'text/edit', true);
          console.log(`✅ Enabled text editing for: "${blockName}" - Content: "${textContent}"`);
        } else {
          console.log(`📝 Already editable: "${blockName}" - Content: "${textContent}"`);
        }
        
        return true;
      } catch (error) {
        console.warn(`Error processing text block ${blockId}:`, error);
        return false;
      }
    });
    
    console.log(`✅ VALID TEXT BLOCKS: ${validTextBlocks.length} out of ${allTextBlocks.length}`);
    
    if (validTextBlocks.length === 0 && allTextBlocks.length > 0) {
      console.error('❌ ALL TEXT BLOCKS WERE FILTERED OUT - Check error messages above');
    }
    
    if (validTextBlocks.length > 0) {
      console.group('📋 Final text blocks for sidebar:');
      validTextBlocks.forEach((blockId, index) => {
        try {
          const blockName = engine.block.getName(blockId) || `Text Block ${blockId}`;
          const textContent = engine.block.getString(blockId, 'text/text');
          console.log(`   ${index + 1}. "${blockName}": "${textContent}"`);
        } catch (error) {
          console.log(`   ${index + 1}. Block ${blockId}: ERROR - ${error.message}`);
        }
      });
      console.groupEnd();
    }
    
    // Return all valid text blocks, ordered by position
    return orderBlocksByPosition(engine, validTextBlocks);
  } catch (error) {
    console.error('Error getting editable text blocks:', error);
    return [];
  }
};

const getEditableImageBlocks = (engine) => {
  try {
    const graphicBlocks = engine.block.findByType('//ly.img.ubq/graphic');
    const validImageBlocks = graphicBlocks.filter((block) => {
      try {
        // Check for invalid block IDs
        if (block === 4294967295 || block < 0) {
          console.warn(`Skipping invalid graphic block ID: ${block}`);
          return false;
        }
        
        if (!engine.block.isValid(block)) {
          console.warn(`Graphic block ${block} is no longer valid`);
          return false;
        }

        if (!engine.block.supportsFill(block)) return false;

        const fillBlock = engine.block.getFill(block);
        if (!fillBlock || !engine.block.isValid(fillBlock)) {
          console.warn(`Fill block invalid for graphic ${block}`);
          return false;
        }
        
        const fillType = engine.block.getType(fillBlock);
        if (fillType !== '//ly.img.ubq/fill/image') return false;

        return engine.block.isScopeEnabled(block, 'fill/change');
      } catch (error) {
        console.warn(`Error checking graphic block ${block}:`, error);
        return false;
      }
    });

    return orderBlocksByPosition(engine, validImageBlocks);
  } catch (error) {
    console.error('Error getting editable image blocks:', error);
    return [];
  }
};

const orderBlocksByPosition = (engine, blocks) => {
  const topLeft = { x: 0, y: 0 };
  return blocks.sort((a, b) => {
    const aPos = {
      x: engine.block.getPositionX(a),
      y: engine.block.getPositionY(a)
    };
    const bPos = {
      x: engine.block.getPositionX(b),
      y: engine.block.getPositionY(b)
    };

    const aDistance = Math.sqrt(
      Math.pow(aPos.x - topLeft.x, 2) + Math.pow(aPos.y - topLeft.y, 2)
    );
    const bDistance = Math.sqrt(
      Math.pow(bPos.x - topLeft.x, 2) + Math.pow(bPos.y - topLeft.y, 2)
    );

    return aDistance - bDistance;
  });
};

const blocksToEditableProperties = (engine, blocks, defaultOptions) => {
  return blocks
    .map((block) => {
      const name = engine.block.getName(block) || `Block ${block}`;
      return {
        name,
        blocks: [block],
        options: defaultOptions?.(block) ?? {}
      };
    })
    .reduce((acc, block) => {
      const name = block.name;
      const existing = acc.find((existing) => existing.name === name);
      if (existing) {
        existing.blocks.push(...block.blocks);
      } else {
        acc.push(block);
      }
      return acc;
    }, []);
};

const relocateResourcesToBlobURLs = (engine) => {
  try {
    if (!engine?.editor) {
      console.warn('Engine or editor not available for resource relocation');
      return;
    }

    const resources = engine.editor.findAllTransientResources();
    if (!resources || resources.length === 0) {
      return;
    }

    resources.forEach((resource) => {
      try {
        const uri = resource.URL;
        if (!uri || uri.includes('bundle://ly.img.cesdk/') || uri.startsWith('blob:')) {
          return;
        }

        // Validate buffer exists and has content
        const length = engine.editor.getBufferLength(uri);
        if (length <= 0) {
          console.warn(`Invalid buffer length for URI: ${uri}`);
          return;
        }

        const data = engine.editor.getBufferData(uri, 0, length);
        if (!data || data.length === 0) {
          console.warn(`No buffer data available for URI: ${uri}`);
          return;
        }

        const blob = new Blob([data]);
        const blobURL = URL.createObjectURL(blob);
        engine.editor.relocateResource(uri, blobURL);
      } catch (resourceError) {
        console.warn(`Failed to relocate resource: ${resource.URL}`, resourceError);
      }
    });
  } catch (error) {
    console.error('Failed to relocate resources to blob URLs:', error);
  }
};

// Build contextual sidebar when an element is selected
const buildContextualSidebar = (builder, engine, state, selectedBlock, data) => {
  const { imageBlocks, editableImageBlocks, textBlocks, editableTextBlocks, colors } = data;
  const blockType = engine.block.getType(selectedBlock);
  const blockName = engine.block.getName(selectedBlock) || `Block ${selectedBlock}`;
  
  console.log(`🎯 Building contextual sidebar for ${blockType}: "${blockName}"`);

  // Selection Info Section
  builder.Section('simple-editor.selection-info', {
    title: 'Selected Element',
    children: () => {
      builder.Text('selection-info', {
        text: `${blockName} (${blockType.includes('text') ? 'Text' : blockType.includes('graphic') ? 'Image' : 'Element'})`
      });
    }
  });

  // Text editing for selected text block
  if (blockType === '//ly.img.ubq/text') {
    console.log(`📝 Creating text editor for selected text block`);
    
    builder.Section('simple-editor.selected-text', {
      title: 'Edit Text',
      children: () => {
        try {
          if (!engine.block.isValid(selectedBlock)) {
            builder.Text('invalid-text', { text: 'Selected text is no longer valid' });
            return;
          }

          const currentValue = engine.block.getString(selectedBlock, 'text/text') || '';
          const textValuesState = state('selectedTextValue', currentValue);

          const setValue = (newValue) => {
            try {
              if (engine.block.isValid(selectedBlock)) {
                engine.block.replaceText(selectedBlock, newValue);
                textValuesState.setValue(newValue);
                engine.editor.addUndoStep();
                console.log(`✅ Updated selected text to: "${newValue}"`);
              }
            } catch (error) {
              console.error('Error updating selected text:', error);
            }
          };

          const isMultiline = currentValue.includes('\n');
          
          if (isMultiline) {
            builder.TextArea('selected-text-area', {
              inputLabel: `${blockName}`,
              value: textValuesState.value,
              setValue,
              placeholder: 'Enter your text here...'
            });
          } else {
            builder.TextInput('selected-text-input', {
              inputLabel: `${blockName}`,
              value: textValuesState.value,
              setValue,
              placeholder: 'Enter your text here...'
            });
          }
        } catch (error) {
          console.error('Error creating text editor:', error);
          builder.Text('text-error', { text: 'Error loading text editor' });
        }
      }
    });
  }

  // Image editing for selected image block
  if (blockType === '//ly.img.ubq/graphic' && imageBlocks.includes(selectedBlock)) {
    console.log(`🖼️ Creating image editor for selected image block`);
    
    builder.Section('simple-editor.selected-image', {
      title: 'Edit Image',
      children: () => {
        try {
          if (!engine.block.isValid(selectedBlock) || !engine.block.supportsFill(selectedBlock)) {
            builder.Text('invalid-image', { text: 'Selected image is no longer valid' });
            return;
          }

          const fillBlock = engine.block.getFill(selectedBlock);
          const uri = engine.block.getSourceSet(fillBlock, 'fill/image/sourceSet')?.[0]?.uri ??
                     engine.block.getString(fillBlock, 'fill/image/imageFileURI');

          const uploadState = state(`selectedImageUpload-${selectedBlock}`, false);

          builder.MediaPreview(`selectedImagePreview-${selectedBlock}`, {
            size: 'small',
            preview: {
              type: 'image',
              uri
            },
            action: {
              label: `Replace ${blockName}`,
              isLoading: uploadState.value,
              onClick: () => {
                uploadState.setValue(true);
                uploadFile({
                  supportedMimeTypes: ['image/*']
                }).then((files) => {
                  const [file] = files;
                  if (file != null) {
                    const url = URL.createObjectURL(file);
                    const fillToChange = engine.block.getFill(selectedBlock);
                    engine.block.setString(fillToChange, 'fill/image/imageFileURI', '');
                    engine.block.setSourceSet(fillToChange, 'fill/image/sourceSet', []);
                    
                    engine.block
                      .addImageFileURIToSourceSet(fillToChange, 'fill/image/sourceSet', url)
                      .then(() => {
                        uploadState.setValue(false);
                        engine.editor.addUndoStep();
                        console.log(`✅ Replaced image for: "${blockName}"`);
                      })
                      .catch(() => {
                        console.error('Error replacing image');
                        uploadState.setValue(false);
                      });
                  }
                }).catch(() => {
                  uploadState.setValue(false);
                });
              }
            }
          });
        } catch (error) {
          console.error('Error creating image editor:', error);
          builder.Text('image-error', { text: 'Error loading image editor' });
        }
      }
    });
  }

  // Color editing for elements with colors
  const elementColors = getColorsForBlock(engine, selectedBlock);
  if (elementColors.length > 0) {
    console.log(`🎨 Creating color editor for selected element with ${elementColors.length} colors`);
    
    builder.Section('simple-editor.selected-colors', {
      title: 'Edit Colors',
      children: () => {
        elementColors.forEach((colorInfo, index) => {
          const colorState = state(`selectedColor-${selectedBlock}-${index}`, colorInfo.color);
          
          builder.ColorInput(`selectedColor-${selectedBlock}-${index}`, {
            inputLabel: `${colorInfo.type.charAt(0).toUpperCase() + colorInfo.type.slice(1)} Color`,
            value: colorState.value,
            setValue: (newValue) => {
              colorState.setValue(newValue);
              applyColorToBlock(engine, selectedBlock, colorInfo.type, newValue, colorInfo.initialOpacity);
              engine.editor.addUndoStep();
            }
          });
        });
      }
    });
  }
};

// Build overview sidebar when nothing is selected
const buildOverviewSidebar = (builder, engine, state, data) => {
  const { imageBlocks, editableImageBlocks, textBlocks, editableTextBlocks, colors } = data;
  
  console.log(`📋 Building overview sidebar`);

  // Instructions
  builder.Section('simple-editor.instructions', {
    title: 'Instructions',
    children: () => {
      builder.Text('instructions', {
        text: '👆 Click on any text or image to edit it directly, or use the sections below to see all editable elements.'
      });
    }
  });

  // Quick overview of editable elements
  if (textBlocks.length > 0 || imageBlocks.length > 0) {
    builder.Section('simple-editor.overview', {
      title: 'Editable Elements',
      children: () => {
        if (textBlocks.length > 0) {
          builder.Text('text-overview', {
            text: `📝 ${textBlocks.length} text element${textBlocks.length > 1 ? 's' : ''} available`
          });
        }
        if (imageBlocks.length > 0) {
          builder.Text('image-overview', {
            text: `🖼️ ${imageBlocks.length} image element${imageBlocks.length > 1 ? 's' : ''} available`
          });
        }
        if (Object.keys(colors).length > 0) {
          builder.Text('color-overview', {
            text: `🎨 ${Object.keys(colors).length} color option${Object.keys(colors).length > 1 ? 's' : ''} available`
          });
        }
      }
    });
  }

  // Show all text blocks for editing if requested
  if (textBlocks.length > 0) {
    builder.Section('simple-editor.all-text', {
      title: 'All Text Elements',
      children: () => {
        editableTextBlocks.forEach(({ blocks, name }) => {
          const block = blocks[0];
          if (engine.block.isValid(block)) {
            const currentValue = engine.block.getString(block, 'text/text') || '';
            const textState = state(`overview-text-${block}`, currentValue);

            const setValue = (newValue) => {
              blocks.forEach((blockToUpdate) => {
                if (engine.block.isValid(blockToUpdate)) {
                  engine.block.replaceText(blockToUpdate, newValue);
                }
              });
              textState.setValue(newValue);
              engine.editor.addUndoStep();
            };

            builder.TextInput(`overview-text-input-${block}`, {
              inputLabel: name,
              value: textState.value,
              setValue,
              placeholder: 'Enter your text here...'
            });
          }
        });
      }
    });
  }
};

// Helper function to get colors for a specific block
const getColorsForBlock = (engine, blockId) => {
  const elementColors = [];

  try {
    // Check for fill color
    if (engine.block.supportsFill(blockId) && 
        engine.block.isValid(engine.block.getFill(blockId)) &&
        engine.block.getType(engine.block.getFill(blockId)) === '//ly.img.ubq/fill/color' &&
        engine.block.isFillEnabled(blockId)) {
      
      const fill = engine.block.getFill(blockId);
      const color = engine.block.getColor(fill, 'fill/color/value');
      if (isRGBAColor(color)) {
        elementColors.push({
          type: 'fill',
          color: { ...color, a: 1 },
          initialOpacity: color.a
        });
      }
    }

    // Check for stroke color
    if (engine.block.supportsStroke(blockId) && engine.block.isStrokeEnabled(blockId)) {
      const color = engine.block.getStrokeColor(blockId);
      if (isRGBAColor(color)) {
        elementColors.push({
          type: 'stroke',
          color: { ...color, a: 1 },
          initialOpacity: color.a
        });
      }
    }

    // Check for text color
    if (engine.block.getType(blockId) === '//ly.img.ubq/text') {
      const textColors = engine.block.getTextColors(blockId);
      if (textColors.length === 1 && isRGBAColor(textColors[0])) {
        const color = textColors[0];
        elementColors.push({
          type: 'text',
          color: { ...color, a: 1 },
          initialOpacity: color.a
        });
      }
    }
  } catch (error) {
    console.warn(`Error getting colors for block ${blockId}:`, error);
  }

  return elementColors;
};

// Helper function to apply color to a block
const applyColorToBlock = (engine, blockId, colorType, newColor, initialOpacity) => {
  try {
    const colorWithOpacity = { ...newColor, a: initialOpacity };
    
    if (colorType === 'fill') {
      const fill = engine.block.getFill(blockId);
      engine.block.setColor(fill, 'fill/color/value', colorWithOpacity);
    } else if (colorType === 'stroke') {
      engine.block.setStrokeColor(blockId, colorWithOpacity);
    } else if (colorType === 'text') {
      engine.block.setTextColor(blockId, colorWithOpacity);
    }
    
    console.log(`✅ Applied ${colorType} color to block ${blockId}`);
  } catch (error) {
    console.error(`Error applying ${colorType} color to block ${blockId}:`, error);
  }
};

export const uploadFile = (() => {
  let element;

  element = document.createElement('input');
  element.setAttribute('type', 'file');
  element.style.display = 'none';
  document.body.appendChild(element);

  return ({ supportedMimeTypes, multiple = false }) => {
    const accept = supportedMimeTypes.join(',');

    if (element == null) {
      return Promise.reject(new Error('No valid upload element created'));
    }

    return new Promise((resolve, reject) => {
      if (accept) {
        element.setAttribute('accept', accept);
      }
      if (multiple) {
        element.setAttribute('multiple', String(multiple));
      }

      element.onchange = (e) => {
        const target = e.target;
        if (target.files) {
          const files = Object.values(target.files);
          resolve(files);
        } else {
          reject(new Error('No files selected'));
        }
        element.onchange = null;
        element.value = '';
      };

      element.click();
    });
  };
})();
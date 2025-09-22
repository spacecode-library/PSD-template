// Asset Sources Configuration for Professional Postcard Editor

export const configureAssetSources = async (instance) => {
  const engine = instance.engine;
  
  // Add default asset sources (shapes, stickers, etc.)
  await instance.addDefaultAssetSources();
  
  // Add demo asset sources selectively
  await instance.addDemoAssetSources({
    sceneMode: 'Design',
    withUploadAssetSources: true,
    // Exclude generic images, we'll add our own
    exclude: ['ly.img.image', 'ly.img.video', 'ly.img.audio']
  });
  
  // Configure custom postcard-specific assets
  await configurePostcardAssets(engine);
  
  // Add custom color library
  await configureColorLibrary(engine);
  
  // Add custom fonts
  await configureFonts(engine);
  
  // Filter stickers to only relevant ones
  await filterStickers(engine);
};

const configurePostcardAssets = async (engine) => {
  // Add custom image source for postcard-relevant images
  engine.asset.addLocalSource('postcard-images', ['image']);
  
  // Business & Office Images
  const businessImages = [
    {
      id: 'business-1',
      label: { en: 'Modern Office' },
      tags: { en: ['office', 'business', 'workspace'] },
      uri: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
      thumbUri: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400',
      width: 800,
      height: 533
    },
    {
      id: 'business-2',
      label: { en: 'Team Meeting' },
      tags: { en: ['team', 'meeting', 'collaboration'] },
      uri: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      thumbUri: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
      width: 800,
      height: 533
    },
    {
      id: 'business-3',
      label: { en: 'Customer Service' },
      tags: { en: ['service', 'customer', 'support'] },
      uri: 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=800',
      thumbUri: 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=400',
      width: 800,
      height: 533
    }
  ];
  
  businessImages.forEach(image => {
    engine.asset.addAssetToSource('postcard-images', {
      id: image.id,
      type: 'ly.img.image',
      label: image.label,
      tags: image.tags,
      payload: {
        sourceSet: [
          {
            uri: image.uri,
            width: image.width,
            height: image.height
          }
        ],
        thumbUri: image.thumbUri
      }
    });
  });
  
  // Add shapes specifically useful for postcards
  engine.asset.addLocalSource('postcard-shapes', ['shape']);
  
  const shapes = [
    {
      id: 'banner-rect',
      label: { en: 'Banner Rectangle' },
      shapeType: 'rect',
      defaultWidth: 4,
      defaultHeight: 0.8
    },
    {
      id: 'circle-badge',
      label: { en: 'Circle Badge' },
      shapeType: 'ellipse',
      defaultWidth: 1.2,
      defaultHeight: 1.2
    },
    {
      id: 'divider-line',
      label: { en: 'Divider Line' },
      shapeType: 'line',
      defaultWidth: 3,
      defaultHeight: 0.05
    }
  ];
  
  shapes.forEach(shape => {
    engine.asset.addAssetToSource('postcard-shapes', {
      id: shape.id,
      type: 'ly.img.shape',
      label: shape.label,
      payload: {
        shapeType: shape.shapeType,
        defaultWidth: shape.defaultWidth,
        defaultHeight: shape.defaultHeight
      }
    });
  });
};

const configureColorLibrary = async (engine) => {
  // Add custom color palettes
  engine.asset.addLocalSource('postcard-colors', ['color']);
  
  // Professional palette
  const professionalColors = [
    { name: 'Teal Primary', color: '#20B2AA' },
    { name: 'Teal Dark', color: '#1A9D96' },
    { name: 'Navy', color: '#2C3E50' },
    { name: 'Charcoal', color: '#111827' },
    { name: 'White', color: '#FFFFFF' },
    { name: 'Light Gray', color: '#F3F4F6' },
    { name: 'Accent Red', color: '#DC2626' },
    { name: 'Accent Gold', color: '#FFC107' },
    { name: 'Success Green', color: '#10B981' },
    { name: 'Info Blue', color: '#3B82F6' }
  ];
  
  professionalColors.forEach((item, index) => {
    const hex = item.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    engine.asset.addAssetToSource('postcard-colors', {
      id: `pro-color-${index}`,
      type: 'ly.img.color',
      label: { en: item.name },
      payload: {
        color: {
          colorSpace: 'sRGB',
          r, g, b, a: 1
        }
      }
    });
  });
};

const configureFonts = async (engine) => {
  // The fonts are already configured in the SDK,
  // For now, we'll just use the default fonts available
  // Custom font configuration would be done through the typeface API
  // when creating text blocks, not through global settings
};

const filterStickers = async (engine) => {
  // Get all stickers
  const stickers = await engine.asset.findAssets('ly.img.sticker', {
    perPage: 9999
  });
  
  // Keep only business-relevant stickers
  const relevantCategories = [
    'emoticons',
    'arrows',
    'badges',
    'business'
  ];
  
  stickers.assets.forEach(sticker => {
    const shouldKeep = sticker.groups?.some(group => 
      relevantCategories.some(cat => group.includes(cat))
    );
    
    if (!shouldKeep) {
      engine.asset.removeAssetFromSource('ly.img.sticker', sticker.id);
    }
  });
};

// Export additional configuration for library panel
export const getAssetLibraryConfig = (isSimpleMode) => {
  if (isSimpleMode) {
    return {
      tabs: ['postcard-images', 'postcard-colors'],
      defaultTab: 'postcard-images'
    };
  }
  
  return {
    tabs: [
      'postcard-images',
      'ly.img.image.upload',
      'postcard-shapes',
      'ly.img.sticker',
      'postcard-colors'
    ],
    defaultTab: 'postcard-images'
  };
};
/**
 * Template Converter Utility
 * Converts existing React component templates to IMG.LY CE.SDK format
 */

// Helper to convert RGB values (0-255) to CE.SDK format (0-1)
const rgbToFloat = (r, g, b) => ({
  r: r / 255,
  g: g / 255,
  b: b / 255,
  a: 1
});

// Brand colors that can be injected from BrandFetch API
const defaultBrandColors = {
  primary: rgbToFloat(32, 64, 128),    // Blue
  secondary: rgbToFloat(255, 230, 0),  // Yellow
  accent: rgbToFloat(255, 255, 255),   // White
  background: rgbToFloat(240, 242, 248) // Light gray
};

/**
 * Converts template data to CE.SDK scene blocks
 * @param {Object} templateData - Original template data
 * @param {Object} brandColors - Brand colors from BrandFetch API
 * @returns {Object} CE.SDK scene configuration
 */
export const convertTemplateToScene = (templateData, brandColors = defaultBrandColors) => {
  const scene = {
    type: 'postcard',
    dimensions: {
      width: 5.3,
      height: 7.5,
      unit: 'inch',
      dpi: 300
    },
    pages: [
      {
        name: 'Front',
        blocks: []
      },
      {
        name: 'Back',
        blocks: []
      }
    ]
  };

  // Front page design blocks
  const frontBlocks = [];

  // Background
  frontBlocks.push({
    type: 'graphic',
    name: 'Background',
    properties: {
      position: { x: 0, y: 0 },
      size: { width: 5.3, height: 7.5 },
      fill: {
        type: 'gradient',
        colors: [
          { color: brandColors.primary, stop: 0 },
          { color: brandColors.secondary, stop: 1 }
        ],
        direction: 'vertical'
      }
    }
  });

  // Business Name
  if (templateData.businessName) {
    frontBlocks.push({
      type: 'text',
      name: 'BusinessName',
      properties: {
        text: templateData.businessName,
        position: { x: 2.65, y: 0.8 },
        fontSize: 36,
        fontWeight: 'bold',
        color: brandColors.accent,
        alignment: 'center'
      }
    });
  }

  // Headline
  if (templateData.headline) {
    frontBlocks.push({
      type: 'text',
      name: 'Headline',
      properties: {
        text: templateData.headline,
        position: { x: 2.65, y: 1.5 },
        fontSize: 28,
        color: brandColors.accent,
        alignment: 'center'
      }
    });
  }

  // Subheadline
  if (templateData.subheadline) {
    frontBlocks.push({
      type: 'text',
      name: 'Subheadline',
      properties: {
        text: templateData.subheadline,
        position: { x: 2.65, y: 2.0 },
        fontSize: 24,
        color: brandColors.accent,
        alignment: 'center'
      }
    });
  }

  // Services or Offers
  if (templateData.services && Array.isArray(templateData.services)) {
    let yPosition = 2.8;
    templateData.services.forEach((service, index) => {
      if (index < 4) {
        const serviceText = typeof service === 'object'
          ? `${service.title}: ${service.description}`
          : service;
        
        frontBlocks.push({
          type: 'text',
          name: `Service${index + 1}`,
          properties: {
            text: serviceText,
            position: { x: 2.65, y: yPosition },
            fontSize: 16,
            color: brandColors.accent,
            alignment: 'center'
          }
        });
        yPosition += 0.5;
      }
    });
  } else if (templateData.offerAmount) {
    // Single offer template
    frontBlocks.push({
      type: 'text',
      name: 'OfferAmount',
      properties: {
        text: templateData.offerAmount,
        position: { x: 2.65, y: 3.5 },
        fontSize: 48,
        fontWeight: 'bold',
        color: rgbToFloat(255, 230, 0), // Yellow highlight
        alignment: 'center'
      }
    });

    if (templateData.offerDescription) {
      frontBlocks.push({
        type: 'text',
        name: 'OfferDescription',
        properties: {
          text: templateData.offerDescription,
          position: { x: 2.65, y: 4.2 },
          fontSize: 20,
          color: brandColors.accent,
          alignment: 'center'
        }
      });
    }
  }

  // Call to Action
  if (templateData.callToAction) {
    frontBlocks.push({
      type: 'text',
      name: 'CallToAction',
      properties: {
        text: templateData.callToAction,
        position: { x: 2.65, y: 5.5 },
        fontSize: 18,
        fontWeight: 'bold',
        color: brandColors.accent,
        alignment: 'center'
      }
    });
  }

  // Contact Info
  const contactInfo = [];
  if (templateData.phone) contactInfo.push(templateData.phone);
  if (templateData.website) contactInfo.push(templateData.website);
  
  if (contactInfo.length > 0) {
    frontBlocks.push({
      type: 'text',
      name: 'ContactInfo',
      properties: {
        text: contactInfo.join(' • '),
        position: { x: 2.65, y: 6.5 },
        fontSize: 14,
        color: brandColors.accent,
        alignment: 'center'
      }
    });
  }

  // Back page blocks (standard postcard back)
  const backBlocks = [
    // White background
    {
      type: 'graphic',
      name: 'BackBackground',
      properties: {
        position: { x: 0, y: 0 },
        size: { width: 5.3, height: 7.5 },
        fill: { type: 'color', color: rgbToFloat(255, 255, 255) }
      }
    },
    // Divider line
    {
      type: 'graphic',
      name: 'Divider',
      properties: {
        position: { x: 2.65, y: 0 },
        size: { width: 0.02, height: 7.5 },
        fill: { type: 'color', color: rgbToFloat(0, 0, 0) }
      }
    },
    // Address area
    {
      type: 'text',
      name: 'AddressArea',
      properties: {
        text: 'Recipient Address\n\n_________________\n\n_________________\n\n_________________',
        position: { x: 2.8, y: 3.5 },
        fontSize: 12,
        color: rgbToFloat(0, 0, 0),
        alignment: 'left'
      }
    },
    // Stamp area
    {
      type: 'graphic',
      name: 'StampArea',
      properties: {
        position: { x: 4.2, y: 0.5 },
        size: { width: 0.8, height: 0.8 },
        stroke: {
          width: 0.02,
          color: rgbToFloat(0, 0, 0)
        }
      }
    },
    // Stamp text
    {
      type: 'text',
      name: 'StampText',
      properties: {
        text: 'STAMP',
        position: { x: 4.6, y: 0.9 },
        fontSize: 10,
        color: rgbToFloat(0, 0, 0),
        alignment: 'center'
      }
    }
  ];

  scene.pages[0].blocks = frontBlocks;
  scene.pages[1].blocks = backBlocks;

  return scene;
};

/**
 * Creates CE.SDK blocks from scene configuration
 * @param {Object} cesdk - CE.SDK instance
 * @param {Object} page - Page block to add elements to
 * @param {Array} blocks - Array of block configurations
 */
export const createBlocksFromConfig = async (cesdk, page, blocks) => {
  const engine = cesdk.engine;

  for (const blockConfig of blocks) {
    let block;

    switch (blockConfig.type) {
      case 'graphic':
        block = engine.block.create('//ly.img.ubq/graphic');
        break;
      case 'text':
        block = engine.block.create('//ly.img.ubq/text');
        break;
      default:
        continue;
    }

    // Set common properties
    if (blockConfig.properties.position) {
      engine.block.setPositionX(block, blockConfig.properties.position.x * 72); // Convert inches to points
      engine.block.setPositionY(block, blockConfig.properties.position.y * 72);
    }

    if (blockConfig.properties.size) {
      engine.block.setWidth(block, blockConfig.properties.size.width * 72);
      engine.block.setHeight(block, blockConfig.properties.size.height * 72);
    }

    // Type-specific properties
    if (blockConfig.type === 'text') {
      engine.block.setString(block, 'text/text', blockConfig.properties.text);
      engine.block.setFloat(block, 'text/fontSize', blockConfig.properties.fontSize);
      if (blockConfig.properties.alignment) {
        engine.block.setEnum(block, 'text/horizontalAlignment', 
          blockConfig.properties.alignment.charAt(0).toUpperCase() + 
          blockConfig.properties.alignment.slice(1)
        );
      }
      if (blockConfig.properties.color) {
        engine.block.setColor(block, 'text/color', blockConfig.properties.color);
      }
    }

    if (blockConfig.type === 'graphic' && blockConfig.properties.fill) {
      if (blockConfig.properties.fill.type === 'color') {
        const fill = engine.block.createFill('color');
        engine.block.setColor(fill, 'fill/color/value', blockConfig.properties.fill.color);
        engine.block.setFill(block, fill);
      } else if (blockConfig.properties.fill.type === 'gradient') {
        const fill = engine.block.createFill('gradient');
        engine.block.setGradientColors(fill, blockConfig.properties.fill.colors);
        engine.block.setFill(block, fill);
      }
    }

    if (blockConfig.properties.stroke) {
      const stroke = engine.block.createStroke();
      engine.block.setStrokeWidth(block, blockConfig.properties.stroke.width * 72);
      engine.block.setColor(stroke, 'stroke/color', blockConfig.properties.stroke.color);
      engine.block.setStroke(block, stroke);
    }

    engine.block.appendChild(page, block);
  }
};

/**
 * Example usage:
 * 
 * const templateData = {
 *   businessName: 'ABC Cleaning',
 *   headline: 'Spring Cleaning Special',
 *   services: ['Window Cleaning', 'Carpet Cleaning', 'Deep Clean'],
 *   phone: '555-1234',
 *   website: 'www.abccleaning.com'
 * };
 * 
 * const brandColors = {
 *   primary: rgbToFloat(0, 100, 200),
 *   secondary: rgbToFloat(255, 200, 0)
 * };
 * 
 * const scene = convertTemplateToScene(templateData, brandColors);
 */
// IMG.LY Block Type Constants
export const BLOCK_TYPES = {
  TEXT: '//ly.img.ubq/text',
  GRAPHIC: '//ly.img.ubq/graphic',
  IMAGE: '//ly.img.ubq/image',
  PAGE: '//ly.img.ubq/page',
  FILL_COLOR: '//ly.img.ubq/fill/color'
};

// Template configuration
export const PSD_SERVER_URL = import.meta.env.VITE_PSD_SERVER_URL || 'http://localhost:3001';

// Export formats
export const EXPORT_FORMATS = {
  PDF: 'application/pdf',
  PNG: 'image/png',
  JPG: 'image/jpeg'
};

// Sample images for replacement
export const SAMPLE_IMAGES = [
  {
    id: 'sample-1',
    name: 'Business Office',
    uri: 'https://img.ly/static/ubq_samples/sample_1_1024x683.jpg',
    width: 1024,
    height: 683
  },
  {
    id: 'sample-2', 
    name: 'Team Meeting',
    uri: 'https://img.ly/static/ubq_samples/sample_2_1024x683.jpg',
    width: 1024,
    height: 683
  },
  {
    id: 'sample-3',
    name: 'Product Showcase',
    uri: 'https://img.ly/static/ubq_samples/sample_3_1024x683.jpg',
    width: 1024,
    height: 683
  },
  {
    id: 'sample-4',
    name: 'Customer Service',
    uri: 'https://img.ly/static/ubq_samples/sample_4_1024x683.jpg', 
    width: 1024,
    height: 683
  },
  {
    id: 'sample-5',
    name: 'Modern Workspace',
    uri: 'https://img.ly/static/ubq_samples/sample_5_1024x683.jpg',
    width: 1024,
    height: 683
  }
];
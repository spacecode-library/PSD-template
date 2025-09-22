# IMG.LY Postcard Editor Integration

## Overview
This demo implements the IMG.LY CreativeEditor SDK for creating and editing postcards. The editor provides professional design capabilities with a user-friendly interface for customizing postcard templates.

## Features
- **Professional Postcard Editor**: Full-featured design tools from IMG.LY
- **Template System**: Pre-designed postcard templates that can be customized
- **Real-time Preview**: See changes as you edit
- **Export to PDF**: High-quality PDF export for printing (300 DPI)
- **Responsive Design**: Works on desktop and tablet devices

## Architecture

### Key Components

1. **PostcardEditorDemo.jsx**
   - Main component that integrates the IMG.LY SDK
   - Handles template selection and management
   - Implements export functionality

2. **ImglyPostcardEditor.jsx** (Alternative implementation)
   - Standalone editor component with more granular control
   - Supports save/load functionality
   - Can be integrated into existing workflows

### Template Structure
Templates are defined as JavaScript objects with the following structure:
```javascript
{
  id: 'template-id',
  name: 'Template Name',
  description: 'Template description',
  businessData: {
    businessName: 'ABC Business',
    headline: 'Main Headline',
    subheadline: 'Secondary text',
    services: [...],
    phone: '1-800-123-4567',
    website: 'www.example.com',
    callToAction: 'Call us today!'
  }
}
```

## Technical Details

### Postcard Specifications
- **Size**: 5.3" × 7.5" (standard postcard)
- **Resolution**: 300 DPI for print
- **Format**: PDF export with bleeds
- **Pages**: Front (design) and Back (address area)

### IMG.LY SDK Configuration
```javascript
const config = {
  license: 'YOUR_LICENSE_KEY',
  ui: {
    elements: {
      panels: { settings: true },
      navigation: {
        action: {
          export: {
            show: true,
            format: ['application/pdf', 'image/png']
          }
        }
      }
    }
  }
};
```

## File Format Notes

### Supported Import Formats
- **Images**: JPG, PNG, WebP
- **Vector**: SVG
- **NOT SUPPORTED**: PSD files cannot be directly imported

### Recommended Workflow for Templates
1. **Design Phase**: Create designs in Figma/Sketch
2. **Export**: Export as SVG components and images
3. **Template Creation**: Build templates programmatically in CE.SDK
4. **Save**: Save as CE.SDK scene files (JSON format)

## Integration with Postcard-frontend

To integrate this editor into the existing Postcard-frontend application:

1. **Copy Components**:
   - Copy `PostcardEditorDemo.jsx` to the Postcard-frontend components
   - Update import paths as needed

2. **Replace Current Editors**:
   - In `OnboardingStep3.jsx`, replace the current editor with IMG.LY component
   - In `Step3Editor.jsx`, integrate the new editor

3. **Template Migration**:
   - Convert existing JSX templates to CE.SDK scene format
   - Store templates as JSON in the backend

4. **API Integration**:
   - Connect to BrandFetch API for automatic color extraction
   - Save edited designs to backend
   - Export print-ready files to printing service

## Next Steps

1. **Obtain License Key**: Contact IMG.LY for pricing ($300-500/month)
2. **Template Creation**: Convert existing templates to CE.SDK format
3. **Backend Integration**: 
   - Add endpoints for saving/loading designs
   - Implement template management system
4. **Production Setup**:
   - Configure CDN for assets
   - Set up export pipeline to printing service

## Running the Demo

1. Install dependencies:
```bash
npm install
```

2. Add your IMG.LY license key in `PostcardEditorDemo.jsx`:
```javascript
const config = {
  license: 'YOUR_ACTUAL_LICENSE_KEY_HERE',
  ...
};
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

## Troubleshooting

- **License Error**: Make sure you have a valid IMG.LY license key
- **Export Issues**: Check browser console for detailed error messages
- **Performance**: For better performance, use Chrome or Edge browsers

## Resources

- [IMG.LY Documentation](https://img.ly/docs/cesdk)
- [Postcard Editor Examples](https://github.com/imgly/cesdk-web-examples)
- [API Reference](https://img.ly/docs/cesdk/api)
# IMG.LY Postcard Editor Implementation

This is a simplified, professional postcard editor built with IMG.LY's CreativeEditor SDK.

## Features

### 1. **Two-Step Process**
- **Step 1**: Template Selection - Choose from professional postcard templates
- **Step 2**: Edit Content - Customize text, colors, and business information

### 2. **Fixed Layout Design**
- Users cannot move or resize elements (as requested)
- Only content is editable: text, colors, font sizes
- Maintains professional design consistency

### 3. **Templates Available**
1. **Business Services Template**
   - Teal header with bold typography
   - 4 service boxes with yellow highlights
   - Perfect for laundry, cleaning, maintenance services

2. **Professional Announcement Template**
   - Clean, modern design
   - Large offer amount display
   - Ideal for real estate, special offers

### 4. **Editor Features**
- **Text Editing**: Click any text to edit
- **Color Picker**: Change colors with predefined palette or custom colors
- **Font Size**: Adjust text size with slider
- **Text Alignment**: Left, center, right alignment options
- **PDF Export**: High-quality 300 DPI export for printing

## Technical Implementation

### File Structure
```
src/components/PostcardEditor/
├── SimplifiedPostcardEditor.jsx  # Main editor component
├── TemplateSelector.jsx          # Template selection screen
├── EditorToolbar.jsx            # Properties editor panel
├── PostcardEditor.css           # Styling
├── templates.json               # Template configuration
├── createPostcardScene.js       # Scene generation utilities
└── generateScenes.js            # Template generation helper

public/templates/
├── business-services.scene      # Template scene file
├── business-services-preview.svg # Template preview
├── professional-announcement.scene
└── professional-announcement-preview.svg
```

### Key Design Decisions

1. **Scene Format vs PSD**
   - Using IMG.LY's native .scene format
   - More efficient than PSD files
   - Better performance and smaller file size

2. **Role: Adopter**
   - Simplified UI for non-designers
   - Removes complex features
   - Focus on content editing only

3. **Property Control**
   - Position/size locked with ReadOnly mode
   - Only specific properties are editable
   - Prevents accidental layout breaks

## Usage

```jsx
import SimplifiedPostcardEditor from './components/PostcardEditor/SimplifiedPostcardEditor';

// Business data to populate templates
const businessData = {
  businessName: 'ABC LAUNDRY',
  headline: 'DROP OFF YOUR',
  subheadline: 'DRY CLEANING!',
  phone: '1-800-628-1804',
  website: 'www.abclaundry.com',
  callToAction: 'CALL OR VISIT US TODAY!',
  offerAmount: '$25 OFF',
  offerDescription: 'Your First Service'
};

<SimplifiedPostcardEditor businessData={businessData} />
```

## Customization

### Adding New Templates
1. Create a new scene generation function in `createPostcardScene.js`
2. Add template metadata to `templates.json`
3. Create a preview image (SVG or PNG)
4. Place files in `public/templates/`

### Modifying Colors
Edit the predefined color palette in `EditorToolbar.jsx`:
```javascript
const predefinedColors = [
  '#000000', '#FFFFFF', '#17A2B8', '#FFC107', '#FF6B6B',
  '#2C3E50', '#E74C3C', '#3498DB', '#27AE60', '#9B59B6'
];
```

## Notes

- The editor requires a valid IMG.LY license key
- Templates use placeholders like `{{businessName}}` for dynamic content
- Export includes bleed margins for professional printing
- Responsive design works on desktop and mobile devices
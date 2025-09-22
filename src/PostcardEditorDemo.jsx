import React, { useState } from 'react';
import CreativeEditor from '@cesdk/cesdk-js/react';
import './PostcardEditor.css';

// Configure CreativeEditor SDK for Postcard editing
const config = {
  license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX',
  role: 'Creator',
  theme: 'light',
  ui: {
    elements: {
      panels: {
        settings: true,
        inspector: {
          show: true,
          position: 'right'
        }
      },
      navigation: {
        action: {
          export: {
            show: true,
            format: ['application/pdf', 'image/png', 'image/jpeg']
          },
        },
      },
      libraries: {
        insert: {
          entries: [
            { id: 'ly.img.template', label: 'Templates' },
            { id: 'ly.img.image', label: 'Images' },
            { id: 'ly.img.text', label: 'Text' },
            { id: 'ly.img.shape', label: 'Shapes' },
            { id: 'ly.img.sticker', label: 'Stickers' }
          ]
        }
      },
      blocks: {
        '//ly.img.ubq/text': {
          controls: {
            '//ly.img.ubq/text/typographie': true,
            '//ly.img.ubq/text/character': true,
          }
        }
      }
    },
    scale: 'auto'
  },
  callbacks: {
    onUpload: 'local',
    onDownload: 'download',
    onExport: (blobs, options) => {
      const blob = blobs[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = options.fileName || 'postcard.pdf';
      a.click();
      URL.revokeObjectURL(url);
    }
  }
};

// Postcard templates data similar to existing templates
const postcardTemplates = [
  {
    id: 'laundry-pro',
    name: 'Laundry Pro',
    description: 'Modern laundry service with multiple offers',
    category: 'cleaning',
    businessData: {
      businessName: 'ABC LAUNDRY',
      headline: 'DROP OFF YOUR',
      subheadline: 'DRY CLEANING!',
      services: [
        { title: 'FREE', description: 'Single Item Cleaning', disclaimer: 'With this card' },
        { title: 'FREE', description: 'Soap for One Wash', disclaimer: 'With this card' },
        { title: 'FREE', description: 'Drying on Monday', disclaimer: 'With this card' },
        { title: 'FREE', description: 'Folding for 10 Items', disclaimer: 'With this card' }
      ],
      phone: '1-800-628-1804',
      website: 'www.website.com',
      callToAction: 'CALL OR VISIT US TODAY!'
    }
  },
  {
    id: 'sparkle-home',
    name: 'Sparkle Home',
    description: 'Premium home cleaning with special offer',
    category: 'cleaning',
    businessData: {
      businessName: 'ABC CLEANING',
      headline: 'MAKE YOUR HOME',
      subheadline: 'sparkle with',
      tagline: 'PREMIUM',
      mainText: 'CLEANING SERVICES!',
      offerAmount: '$100 OFF',
      offerDescription: 'your first deep clean',
      offerDisclaimer: 'See back for details',
      services: ['Residential Cleaning', 'Deep Cleaning', 'Move In/Out Cleaning'],
      phone: '1-800-628-1804',
      website: 'www.website.com',
      callToAction: 'Call or visit us online to book your service!'
    }
  }
];

// Initialize the postcard editor
const initPostcardEditor = async (cesdk, template) => {
  // Create a postcard design scene
  await cesdk.createDesignScene();
  
  // Get the page
  const page = cesdk.engine.block.findByType('page')[0];
  
  // Set postcard dimensions (5.3" x 7.5" at proper scale)
  cesdk.engine.block.setWidth(page, 5.3);
  cesdk.engine.block.setHeight(page, 7.5);
  
  // Create postcard design based on template
  await createPostcardDesign(cesdk, page, template.businessData);
  
  // Add asset sources
  await Promise.all([
    cesdk.addDefaultAssetSources(),
    cesdk.addDemoAssetSources({ sceneMode: 'Design', withUploadAssetSources: true }),
  ]);
};

// Create the postcard design
const createPostcardDesign = async (cesdk, page, data) => {
  const engine = cesdk.engine;
  
  // Add background
  const background = engine.block.create('//ly.img.ubq/graphic');
  engine.block.setWidth(background, 5.3);
  engine.block.setHeight(background, 7.5);
  engine.block.setPositionX(background, 0);
  engine.block.setPositionY(background, 0);
  
  // Set gradient background
  const fill = engine.block.createFill('gradient');
  engine.block.setGradientColors(fill, [
    { color: { r: 0.2, g: 0.4, b: 0.8, a: 1 }, stop: 0 },
    { color: { r: 0.1, g: 0.2, b: 0.6, a: 1 }, stop: 1 }
  ]);
  engine.block.setFill(background, fill);
  engine.block.appendChild(page, background);
  
  // Add business name
  const businessName = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(businessName, 'text/text', data.businessName);
  engine.block.setFloat(businessName, 'text/fontSize', 0.5);
  engine.block.setEnum(businessName, 'text/horizontalAlignment', 'Center');
  engine.block.setWidth(businessName, 5.0);
  engine.block.setPositionX(businessName, 0.15);
  engine.block.setPositionY(businessName, 0.5);
  engine.block.setColor(businessName, 'text/color', { r: 1, g: 1, b: 1, a: 1 });
  engine.block.appendChild(page, businessName);
  
  // Add headline
  const headline = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(headline, 'text/text', `${data.headline}\n${data.subheadline || ''}`);
  engine.block.setFloat(headline, 'text/fontSize', 0.4);
  engine.block.setEnum(headline, 'text/horizontalAlignment', 'Center');
  engine.block.setWidth(headline, 5.0);
  engine.block.setPositionX(headline, 0.15);
  engine.block.setPositionY(headline, 1.5);
  engine.block.setColor(headline, 'text/color', { r: 1, g: 1, b: 1, a: 1 });
  engine.block.appendChild(page, headline);
  
  // Add offer/services section
  if (data.services && Array.isArray(data.services)) {
    let yPosition = 2.8;
    data.services.forEach((service, index) => {
      if (index < 4) { // Limit to 4 services
        const serviceBlock = engine.block.create('//ly.img.ubq/text');
        const serviceText = typeof service === 'object' 
          ? `${service.title}: ${service.description}` 
          : service;
        engine.block.setString(serviceBlock, 'text/text', serviceText);
        engine.block.setFloat(serviceBlock, 'text/fontSize', 0.22);
        engine.block.setEnum(serviceBlock, 'text/horizontalAlignment', 'Center');
        engine.block.setWidth(serviceBlock, 5.0);
        engine.block.setPositionX(serviceBlock, 0.15);
        engine.block.setPositionY(serviceBlock, yPosition);
        engine.block.setColor(serviceBlock, 'text/color', { r: 1, g: 1, b: 1, a: 1 });
        engine.block.appendChild(page, serviceBlock);
        yPosition += 0.5;
      }
    });
  } else if (data.offerAmount) {
    // For templates with a single offer
    const offerBlock = engine.block.create('//ly.img.ubq/text');
    engine.block.setString(offerBlock, 'text/text', data.offerAmount);
    engine.block.setFloat(offerBlock, 'text/fontSize', 0.65);
    engine.block.setEnum(offerBlock, 'text/horizontalAlignment', 'Center');
    engine.block.setWidth(offerBlock, 5.0);
    engine.block.setPositionX(offerBlock, 0.15);
    engine.block.setPositionY(offerBlock, 3.5);
    engine.block.setColor(offerBlock, 'text/color', { r: 1, g: 0.9, b: 0, a: 1 });
    engine.block.appendChild(page, offerBlock);
    
    if (data.offerDescription) {
      const offerDesc = engine.block.create('//ly.img.ubq/text');
      engine.block.setString(offerDesc, 'text/text', data.offerDescription);
      engine.block.setFloat(offerDesc, 'text/fontSize', 0.28);
      engine.block.setEnum(offerDesc, 'text/horizontalAlignment', 'Center');
      engine.block.setWidth(offerDesc, 5.0);
      engine.block.setPositionX(offerDesc, 0.15);
      engine.block.setPositionY(offerDesc, 4.5);
      engine.block.setColor(offerDesc, 'text/color', { r: 1, g: 1, b: 1, a: 1 });
      engine.block.appendChild(page, offerDesc);
    }
  }
  
  // Add call to action
  const ctaBlock = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(ctaBlock, 'text/text', data.callToAction);
  engine.block.setFloat(ctaBlock, 'text/fontSize', 0.25);
  engine.block.setEnum(ctaBlock, 'text/horizontalAlignment', 'Center');
  engine.block.setWidth(ctaBlock, 5.0);
  engine.block.setPositionX(ctaBlock, 0.15);
  engine.block.setPositionY(ctaBlock, 5.8);
  engine.block.setColor(ctaBlock, 'text/color', { r: 1, g: 1, b: 1, a: 1 });
  engine.block.appendChild(page, ctaBlock);
  
  // Add contact info at bottom
  const contactBlock = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(contactBlock, 'text/text', `${data.phone} • ${data.website}`);
  engine.block.setFloat(contactBlock, 'text/fontSize', 0.19);
  engine.block.setEnum(contactBlock, 'text/horizontalAlignment', 'Center');
  engine.block.setWidth(contactBlock, 5.0);
  engine.block.setPositionX(contactBlock, 0.15);
  engine.block.setPositionY(contactBlock, 6.6);
  engine.block.setColor(contactBlock, 'text/color', { r: 1, g: 1, b: 1, a: 1 });
  engine.block.appendChild(page, contactBlock);
};

export default function PostcardEditorDemo() {
  const [selectedTemplate, setSelectedTemplate] = useState(postcardTemplates[0]);
  const [editorInstance, setEditorInstance] = useState(null);

  const handleTemplateChange = async (templateId) => {
    const template = postcardTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      if (editorInstance) {
        // Clear current design and load new template
        const pages = editorInstance.engine.block.findByType('page');
        if (pages.length > 0) {
          const page = pages[0];
          // Remove all children
          const children = editorInstance.engine.block.getChildren(page);
          children.forEach(child => {
            editorInstance.engine.block.destroy(child);
          });
          // Create new design
          await createPostcardDesign(editorInstance, page, template.businessData);
        }
      }
    }
  };

  const handleExport = async () => {
    if (editorInstance) {
      try {
        const pages = editorInstance.engine.block.findByType('page');
        if (pages.length > 0) {
          const blob = await editorInstance.engine.block.export(pages[0], {
            mimeType: 'application/pdf',
            targetDPI: 300
          });
          
          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `postcard-${selectedTemplate.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting postcard. Please try again.');
      }
    }
  };

  return (
    <div className="postcard-editor-container">
      {/* Template Selector and Export Controls */}
      <div className="postcard-editor-header">
        <div>
          <h3 className="postcard-editor-title">IMG.LY Postcard Editor</h3>
          <div className="template-selector">
            <label htmlFor="template-select">Choose Template:</label>
            <select 
              id="template-select"
              className="template-select"
              value={selectedTemplate.id} 
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              {postcardTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={handleExport}
          className="export-pdf-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
            <path d="M12 11v6"/>
            <path d="M9 14l3 3 3-3"/>
          </svg>
          Export as PDF
        </button>
      </div>
      
      {/* CreativeEditor */}
      <div className="editor-canvas-container">
        <CreativeEditor
          config={config}
          init={async (cesdk) => {
            setEditorInstance(cesdk);
            await initPostcardEditor(cesdk, selectedTemplate);
          }}
        />
      </div>
    </div>
  );
}
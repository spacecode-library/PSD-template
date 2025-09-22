import React, { useState, useRef, useCallback, useEffect } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';
// CE.SDK styles are loaded automatically when creating the instance
import TemplateSelector from './TemplateSelector';
import EditorToolbar from './EditorToolbar';
import './PostcardEditor.css';
// import { PSDLoader } from './PSDLoader'; // Temporarily disabled
import { SinglePageModeProvider } from './SinglePageMode';
import DebugView from './DebugView';
// Fixed imports

const SimplifiedPostcardEditor = ({ businessData = {} }) => {
  const [cesdk, setCesdk] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('select'); // 'select' or 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const containerRef = useRef(null);

  // Use minimal configuration like the working test editor
  const config = {
    license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX'
  };

  const handleBack = () => {
    setCurrentStep('select');
    setSelectedTemplate(null);
    if (cesdk) {
      cesdk.dispose();
      setCesdk(null);
    }
  };

  const handleTemplateSelect = async (template) => {
    console.log('Template selected:', template);
    setSelectedTemplate(template);
    setCurrentStep('edit');
    setIsLoading(true);
  };

  // Use effect to initialize editor when we switch to edit mode
  useEffect(() => {
    if (currentStep === 'edit' && selectedTemplate && containerRef.current && !cesdk) {
      // Ensure container is ready
      const checkContainer = () => {
        const container = containerRef.current;
        if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
          console.log('Container ready, initializing editor');
          initializeEditor();
        } else {
          console.log('Container not ready, retrying...');
          setTimeout(checkContainer, 100);
        }
      };
      checkContainer();
    }
  }, [currentStep, selectedTemplate]);

  const initializeEditor = async () => {
    try {
      console.log('Creating CreativeEditor instance...');
      console.log('Container ref:', containerRef.current);
      console.log('Container dimensions:', containerRef.current?.offsetWidth, 'x', containerRef.current?.offsetHeight);
      
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use the exact same config as the working test editor
      console.log('Container before CE.SDK:', containerRef.current.innerHTML);
      
      const instance = await CreativeEditorSDK.create(containerRef.current, {
        license: config.license
      });
      
      console.log('Container after CE.SDK:', containerRef.current.innerHTML);
      console.log('Instance created:', !!instance);
      console.log('Engine available:', !!instance?.engine);
      console.log('CreativeEditor instance created');
      setCesdk(instance);
      
      // CRITICAL: Wait for CE.SDK to fully initialize its UI
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check for canvas after a delay
      setTimeout(() => {
        const canvas = containerRef.current?.querySelector('canvas');
        console.log('Canvas check after load:', canvas ? 'Found' : 'Not found');
        
        // Check if canvas was created elsewhere in the DOM
        const allCanvas = document.querySelectorAll('canvas');
        console.log('All canvas elements in document:', allCanvas.length);
        allCanvas.forEach((c, i) => {
          console.log(`Canvas ${i}:`, c.parentElement?.className, 'Size:', c.width, 'x', c.height);
        });
        
        // Check CE.SDK container structure
        const allDivs = containerRef.current?.querySelectorAll('div');
        console.log('All divs in container:', allDivs?.length);
        
        // Check CE.SDK classes
        const ubqElements = document.querySelectorAll('[class*="ubq"]');
        console.log('All UBQ elements in document:', ubqElements.length);
        ubqElements.forEach(el => {
          console.log('UBQ element:', el.className, 'Parent:', el.parentElement?.className);
        });
        
        // Check shadow DOM
        const rootShadow = document.querySelector('#root-shadow');
        console.log('Shadow root element found:', !!rootShadow);
        if (rootShadow?.shadowRoot) {
          console.log('Has shadow root! Checking for canvas inside...');
          const shadowCanvas = rootShadow.shadowRoot.querySelector('canvas');
          console.log('Canvas in shadow DOM:', !!shadowCanvas);
        }
      }, 1000);
      
      // Match the exact order from BasicEditor which works
      // 1. Add sources FIRST
      await instance.addDefaultAssetSources();
      console.log('Default asset sources loaded');
      
      // 2. Create scene SECOND - wrap in try/catch to see errors
      try {
        const sceneResult = await instance.createDesignScene();
        console.log('Design scene created, result:', sceneResult);
      } catch (sceneError) {
        console.error('Error creating scene:', sceneError);
        // Try alternative scene creation
        console.log('Trying alternative scene creation...');
        await instance.engine.scene.createBlank();
        const page = instance.engine.block.create('page');
        instance.engine.block.setWidth(page, 1590);
        instance.engine.block.setHeight(page, 2250);
        instance.engine.scene.setPages([page]);
      }
      
      // Verify scene was actually created
      const scene = instance.engine.scene.get();
      console.log('Scene after creation:', scene);
      // Scene ID 0 is valid! Don't check for falsy
      if (scene === null || scene === undefined) {
        console.error('Scene creation failed!');
        throw new Error('Failed to create scene');
      }
      
      // 3. Then add additional sources
      await instance.addDemoAssetSources({ sceneMode: 'Design' });
      await addCustomImageSources(instance);
      console.log('All asset sources loaded');
      
      // Set instance to state first so loadTemplate can use it
      setCesdk(instance);
      
      // Load template
      await loadTemplate(instance, selectedTemplate, businessData);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing editor:', error);
      alert('Error loading editor: ' + error.message);
      setIsLoading(false);
      setCurrentStep('select');
    }
  };

  const loadTemplate = async (instance, template, data) => {
    console.log('Loading template:', template);
    console.log('Instance passed to loadTemplate:', instance);
    console.log('Instance has engine?', !!instance?.engine);
    try {
      // TEMPORARILY DISABLE PSD LOADING TO DEBUG CANVAS ISSUE
      const skipPSD = true;
      
      if (template.psdPath && !skipPSD) {
        console.log('PSD loading is currently disabled for debugging');
      }
      
      // Wait a bit for scene to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use the existing scene created in initializeEditor
      let scene = instance.engine.scene.get();
      // Scene ID 0 is valid!
      if (scene === null || scene === undefined) {
        console.error('No scene found! This should not happen.');
        return;
      }
      console.log('Using existing scene for template, scene ID:', scene);
      
      // Get the scene and page
      const pages = instance.engine.scene.getPages();
      const page = pages[0];
      
      // Set proper DPI for print quality
      instance.engine.block.setFloat(scene, 'scene/dpi', 300);
      
      // Set page size in pixels (standard postcard at 300 DPI)
      instance.engine.block.setWidth(page, 1590); // 5.3" * 300
      instance.engine.block.setHeight(page, 2250);   // 7.5" * 300
      
      // Create the appropriate template based on the template ID
      if (template.id === 'business-services') {
        await createBusinessServicesTemplate(instance.engine, page, data);
      } else if (template.id === 'professional-announcement') {
        await createProfessionalAnnouncementTemplate(instance.engine, page, data);
      } else {
        // Default template for any new templates
        await createBusinessServicesTemplate(instance.engine, page, data);
      }
      
      // Apply business data
      await applyBusinessData(instance.engine, data);
      
      // Setup constraints
      setupLayoutConstraints(instance.engine);
      
      // Ensure page is visible
      instance.engine.block.setVisible(page, true);
      
      // Zoom to fit with a slight delay to ensure layout is complete
      setTimeout(async () => {
        try {
          await instance.engine.scene.zoomToBlock(page, 0.75);
          console.log('Template loaded and zoomed');
          
          // Force a re-render of the canvas
          const canvas = containerRef.current?.querySelector('canvas');
          if (canvas) {
            console.log('Canvas found:', canvas.width, 'x', canvas.height);
            // Trigger a resize to ensure canvas renders
            window.dispatchEvent(new Event('resize'));
          } else {
            console.error('Canvas element not found!');
          }
        } catch (zoomError) {
          console.error('Zoom error:', zoomError);
        }
      }, 200);
      
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const createBusinessServicesTemplate = async (engine, page, data) => {
    // Background
    const bg = engine.block.create('//ly.img.ubq/graphic');
    engine.block.setWidth(bg, 1590);
    engine.block.setHeight(bg, 2250);
    engine.block.setPositionX(bg, 0);
    engine.block.setPositionY(bg, 0);
    const bgFill = engine.block.createFill('color');
    engine.block.setFill(bg, bgFill);
    engine.block.setColor(bg, 'fill/solid/color', { r: 1, g: 1, b: 1, a: 1 });
    engine.block.appendChild(page, bg);
    
    // Teal header
    const header = engine.block.create('//ly.img.ubq/graphic');
    engine.block.setWidth(header, 1590);
    engine.block.setHeight(header, 540);
    engine.block.setPositionX(header, 0);
    engine.block.setPositionY(header, 0);
    const headerFill = engine.block.createFill('color');
    engine.block.setFill(header, headerFill);
    engine.block.setColor(header, 'fill/solid/color', { r: 0.09, g: 0.64, b: 0.72, a: 1 });
    engine.block.appendChild(page, header);
    
    // Headline text
    const headline = engine.block.create('//ly.img.ubq/text');
    engine.block.setString(headline, 'text/text', data.headline || 'DROP OFF YOUR');
    engine.block.setFloat(headline, 'text/fontSize', 0.15); // in inches
    engine.block.setEnum(headline, 'text/horizontalAlignment', 'Center');
    engine.block.setWidth(headline, 1440);
    engine.block.setPositionX(headline, 0.25);
    engine.block.setPositionY(headline, 0.3);
    engine.block.setTextColor(headline, { r: 1, g: 1, b: 1, a: 1 });
    engine.block.appendChild(page, headline);
    
    // Subheadline text
    const subheadline = engine.block.create('//ly.img.ubq/text');
    engine.block.setString(subheadline, 'text/text', data.subheadline || 'DRY CLEANING!');
    engine.block.setFloat(subheadline, 'text/fontSize', 0.3); // in inches
    if (engine.block.canToggleBoldFont(subheadline)) {
      engine.block.toggleBoldFont(subheadline);
    }
    engine.block.setEnum(subheadline, 'text/horizontalAlignment', 'Center');
    engine.block.setWidth(subheadline, 1440);
    engine.block.setPositionX(subheadline, 0.25);
    engine.block.setPositionY(subheadline, 0.7);
    engine.block.setTextColor(subheadline, { r: 1, g: 1, b: 1, a: 1 });
    engine.block.appendChild(page, subheadline);
    
    // Add replaceable image in the middle section
    const imageBlock = engine.block.create('//ly.img.ubq/graphic');
    engine.block.setWidth(imageBlock, 1440);
    engine.block.setHeight(imageBlock, 600);
    engine.block.setPositionX(imageBlock, 75);
    engine.block.setPositionY(imageBlock, 600);
    
    // Create and apply image fill
    const imageFill = engine.block.createFill('image');
    const placeholderImage = 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=400&fit=crop';
    engine.block.setString(imageFill, 'fill/image/imageFileURI', placeholderImage);
    engine.block.setFill(imageBlock, imageFill);
    
    // Make the image replaceable
    engine.block.setBool(imageBlock, 'placeholder/enabled', true);
    
    engine.block.appendChild(page, imageBlock);
    
    // Service boxes (adjusted position)
    const services = data.services || ['Service 1', 'Service 2', 'Service 3', 'Service 4'];
    services.slice(0, 4).forEach((service, index) => {
      const x = index % 2 === 0 ? 60 : 810;
      const y = 1260 + Math.floor(index / 2) * 210;
      
      // Yellow box
      const box = engine.block.create('//ly.img.ubq/graphic');
      engine.block.setWidth(box, 720);
      engine.block.setHeight(box, 150);
      engine.block.setPositionX(box, x);
      engine.block.setPositionY(box, y);
      const boxFill = engine.block.createFill('color');
      engine.block.setFill(box, boxFill);
      engine.block.setColor(box, 'fill/solid/color', { r: 1, g: 0.76, b: 0.03, a: 1 });
      engine.block.appendChild(page, box);
      
      // Service text
      const serviceText = engine.block.create('//ly.img.ubq/text');
      engine.block.setString(serviceText, 'text/text', service);
      engine.block.setFloat(serviceText, 'text/fontSize', 24); // in pixels
      engine.block.setEnum(serviceText, 'text/horizontalAlignment', 'Center');
      engine.block.setWidth(serviceText, 660);
      engine.block.setPositionX(serviceText, x + 30);
      engine.block.setPositionY(serviceText, y + 45);
      engine.block.setTextColor(serviceText, { r: 0, g: 0, b: 0, a: 1 });
      engine.block.appendChild(page, serviceText);
    });
    
    // Bottom section
    const footer = engine.block.create('//ly.img.ubq/graphic');
    engine.block.setWidth(footer, 1590);
    engine.block.setHeight(footer, 300);
    engine.block.setPositionX(footer, 0);
    engine.block.setPositionY(footer, 1950);
    const footerFill = engine.block.createFill('color');
    engine.block.setFill(footer, footerFill);
    engine.block.setColor(footer, 'fill/solid/color', { r: 0.2, g: 0.2, b: 0.2, a: 1 });
    engine.block.appendChild(page, footer);
    
    // Business name
    const businessName = engine.block.create('//ly.img.ubq/text');
    engine.block.setString(businessName, 'text/text', data.businessName || 'YOUR BUSINESS');
    engine.block.setFloat(businessName, 'text/fontSize', 36); // in pixels
    if (engine.block.canToggleBoldFont(businessName)) {
      engine.block.toggleBoldFont(businessName);
    }
    engine.block.setEnum(businessName, 'text/horizontalAlignment', 'Center');
    engine.block.setWidth(businessName, 1440);
    engine.block.setPositionX(businessName, 75);
    engine.block.setPositionY(businessName, 1980);
    engine.block.setTextColor(businessName, { r: 1, g: 1, b: 1, a: 1 });
    engine.block.appendChild(page, businessName);
    
    // Call to action
    const cta = engine.block.create('//ly.img.ubq/text');
    engine.block.setString(cta, 'text/text', data.callToAction || 'CALL OR VISIT US TODAY!');
    engine.block.setFloat(cta, 'text/fontSize', 24); // in pixels
    engine.block.setEnum(cta, 'text/horizontalAlignment', 'Center');
    engine.block.setWidth(cta, 1440);
    engine.block.setPositionX(cta, 75);
    engine.block.setPositionY(cta, 2070);
    engine.block.setTextColor(cta, { r: 1, g: 0.76, b: 0.03, a: 1 });
    engine.block.appendChild(page, cta);
    
    // Contact info
    const contact = engine.block.create('//ly.img.ubq/text');
    engine.block.setString(contact, 'text/text', `${data.phone || '1-800-000-0000'} • ${data.website || 'www.website.com'}`);
    engine.block.setFloat(contact, 'text/fontSize', 21); // in pixels
    engine.block.setEnum(contact, 'text/horizontalAlignment', 'Center');
    engine.block.setWidth(contact, 1440);
    engine.block.setPositionX(contact, 75);
    engine.block.setPositionY(contact, 2145);
    engine.block.setTextColor(contact, { r: 1, g: 1, b: 1, a: 1 });
    engine.block.appendChild(page, contact);
  };

  const createProfessionalAnnouncementTemplate = async (engine, page, data) => {
    // Light background
    const bg = engine.block.create('//ly.img.ubq/graphic');
    engine.block.setWidth(bg, 1590);
    engine.block.setHeight(bg, 2250);
    engine.block.setPositionX(bg, 0);
    engine.block.setPositionY(bg, 0);
    const bgFill = engine.block.createFill('color');
    engine.block.setFill(bg, bgFill);
    engine.block.setColor(bg, 'fill/solid/color', { r: 0.93, g: 0.94, b: 0.95, a: 1 });
    engine.block.appendChild(page, bg);
    
    // Dark blue header
    const header = engine.block.create('//ly.img.ubq/graphic');
    engine.block.setWidth(header, 1590);
    engine.block.setHeight(header, 450);
    engine.block.setPositionX(header, 0);
    engine.block.setPositionY(header, 0);
    const headerFill = engine.block.createFill('color');
    engine.block.setFill(header, headerFill);
    engine.block.setColor(header, 'fill/solid/color', { r: 0.17, g: 0.24, b: 0.31, a: 1 });
    engine.block.appendChild(page, header);
    
    // Business name
    const businessName = engine.block.create('//ly.img.ubq/text');
    engine.block.setString(businessName, 'text/text', data.businessName || 'YOUR BUSINESS NAME');
    engine.block.setFloat(businessName, 'text/fontSize', 36); // in pixels
    if (engine.block.canToggleBoldFont(businessName)) {
      engine.block.toggleBoldFont(businessName);
    }
    engine.block.setEnum(businessName, 'text/horizontalAlignment', 'Center');
    engine.block.setWidth(businessName, 1440);
    engine.block.setPositionX(businessName, 75);
    engine.block.setPositionY(businessName, 150);
    engine.block.setTextColor(businessName, { r: 1, g: 1, b: 1, a: 1 });
    engine.block.appendChild(page, businessName);
    
    // Image block that can be replaced
    const imageBlock = engine.block.create('//ly.img.ubq/graphic');
    engine.block.setWidth(imageBlock, 1440);
    engine.block.setHeight(imageBlock, 900);
    engine.block.setPositionX(imageBlock, 75);
    engine.block.setPositionY(imageBlock, 510);
    
    // Create and apply image fill
    const imageFill = engine.block.createFill('image');
    const placeholderImage = 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop';
    engine.block.setString(imageFill, 'fill/image/imageFileURI', placeholderImage);
    engine.block.setFill(imageBlock, imageFill);
    
    // Make the image replaceable
    engine.block.setBool(imageBlock, 'placeholder/enabled', true);
    
    engine.block.appendChild(page, imageBlock);
    
    // Offer amount
    const offerAmount = engine.block.create('//ly.img.ubq/text');
    engine.block.setString(offerAmount, 'text/text', data.offerAmount || '$25 OFF');
    engine.block.setFloat(offerAmount, 'text/fontSize', 105); // in pixels
    if (engine.block.canToggleBoldFont(offerAmount)) {
      engine.block.toggleBoldFont(offerAmount);
    }
    engine.block.setEnum(offerAmount, 'text/horizontalAlignment', 'Center');
    engine.block.setWidth(offerAmount, 1440);
    engine.block.setPositionX(offerAmount, 75);
    engine.block.setPositionY(offerAmount, 1500);
    engine.block.setTextColor(offerAmount, { r: 0.91, g: 0.30, b: 0.24, a: 1 });
    engine.block.appendChild(page, offerAmount);
    
    // Offer description
    const offerDesc = engine.block.create('//ly.img.ubq/text');
    engine.block.setString(offerDesc, 'text/text', data.offerDescription || 'Your First Service');
    engine.block.setFloat(offerDesc, 'text/fontSize', 30); // in pixels
    engine.block.setEnum(offerDesc, 'text/horizontalAlignment', 'Center');
    engine.block.setWidth(offerDesc, 1440);
    engine.block.setPositionX(offerDesc, 75);
    engine.block.setPositionY(offerDesc, 1800);
    engine.block.setTextColor(offerDesc, { r: 0.17, g: 0.24, b: 0.31, a: 1 });
    engine.block.appendChild(page, offerDesc);
    
    // Contact info
    const contact = engine.block.create('//ly.img.ubq/text');
    engine.block.setString(contact, 'text/text', `${data.phone || '1-800-000-0000'} • ${data.website || 'www.website.com'}`);
    engine.block.setFloat(contact, 'text/fontSize', 0.08); // in inches
    engine.block.setEnum(contact, 'text/horizontalAlignment', 'Center');
    engine.block.setWidth(contact, 1440);
    engine.block.setPositionX(contact, 75);
    engine.block.setPositionY(contact, 2040);
    engine.block.setTextColor(contact, { r: 0.41, g: 0.45, b: 0.50, a: 1 });
    engine.block.appendChild(page, contact);
  };

  const applyBusinessData = async (engine, data) => {
    const scene = engine.scene.get();
    if (!scene) return;

    // Find and update text blocks with business data
    const blocks = engine.block.findAll();
    
    for (const blockId of blocks) {
      const blockType = engine.block.getType(blockId);
      
      if (blockType === '//ly.img.ubq/text') {
        const textContent = engine.block.getString(blockId, 'text/text');
        
        // Replace placeholders with actual business data
        const replacements = {
          '{{businessName}}': data.businessName || 'Your Business Name',
          '{{headline}}': data.headline || 'Your Headline',
          '{{subheadline}}': data.subheadline || 'Your Subheadline',
          '{{phone}}': data.phone || '1-800-000-0000',
          '{{website}}': data.website || 'www.yourwebsite.com',
          '{{callToAction}}': data.callToAction || 'Call Us Today!'
        };

        let newContent = textContent;
        for (const [placeholder, value] of Object.entries(replacements)) {
          newContent = newContent.replace(placeholder, value);
        }

        if (newContent !== textContent) {
          engine.block.setString(blockId, 'text/text', newContent);
        }
      }
    }
  };

  const setupLayoutConstraints = (engine) => {
    try {
      const blocks = engine.block.findAll();
      console.log('Setting up constraints for', blocks.length, 'blocks');
      
      for (const blockId of blocks) {
        const blockType = engine.block.getType(blockId);
        
        // Skip system blocks like camera, scene, etc
        if (blockType === '//ly.img.ubq/camera' || 
            blockType === '//ly.img.ubq/scene' ||
            blockType === '//ly.img.ubq/page') {
          continue;
        }
        
        // Set all content blocks to be non-movable
        try {
          engine.block.setBool(blockId, 'transformLocked', true);
        } catch (e) {
          // Some blocks might not support transform locking
          console.log('Could not lock transform for block type:', blockType);
        }
        
        // Allow only certain properties to be edited based on block type
        if (blockType === '//ly.img.ubq/graphic') {
          try {
            // Check if it has an image fill
            const fill = engine.block.getFill(blockId);
            if (fill) {
              const fillType = engine.block.getType(fill);
              if (fillType === '//ly.img.ubq/fill/image') {
                // For graphic blocks with image fills, ensure replacement is enabled
                engine.block.setBool(blockId, 'placeholder/enabled', true);
              }
            }
          } catch (e) {
            // Some graphics might not have fills or other issues
            console.log('Could not check fill for block:', blockId);
          }
        }
      }
    } catch (error) {
      console.error('Error setting up constraints:', error);
    }
  };
  
  const addCustomImageSources = async (instance) => {
    // Define 5 professional business-oriented images
    const businessImages = [
      {
        id: 'business-office-1',
        uri: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop',
        thumbUri: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=300&fit=crop',
        label: 'Modern Office Space'
      },
      {
        id: 'business-team-1',
        uri: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
        thumbUri: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop',
        label: 'Team Collaboration'
      },
      {
        id: 'business-laundry-1',
        uri: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop',
        thumbUri: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop',
        label: 'Laundry Service'
      },
      {
        id: 'business-cleaning-1',
        uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
        thumbUri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        label: 'Cleaning Service'
      },
      {
        id: 'business-professional-1',
        uri: 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=800&h=600&fit=crop',
        thumbUri: 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=400&h=300&fit=crop',
        label: 'Professional Service'
      }
    ];
    
    // Create a custom image source
    const customImageSource = {
      id: 'postcard-images',
      findAssets: async (queryData) => {
        // Return our business images
        return {
          assets: businessImages.map(img => ({
            id: img.id,
            type: 'ly.img.image',
            label: img.label,
            meta: {
              uri: img.uri,
              thumbUri: img.thumbUri || img.uri,
              mimeType: 'image/jpeg',
              width: 800,
              height: 600
            }
          })),
          total: businessImages.length,
          page: 0,
          perPage: businessImages.length
        };
      },
      applyAsset: async (asset) => {
        // This function is called when an asset is applied
        return {
          url: asset.meta.uri
        };
      },
      credits: {
        name: 'Postcard Images',
        url: '#'
      },
      license: {
        name: 'Free for commercial use',
        url: '#'
      }
    };
    
    // Add the custom source
    instance.engine.asset.addSource(customImageSource);
  };

  const handleExport = async () => {
    if (!cesdk) return;

    try {
      const scene = cesdk.engine.scene.get();
      if (!scene) return;

      // Export as PDF with print quality
      const mimeType = 'application/pdf';
      const options = {
        pageIds: [cesdk.engine.scene.getPages()[0]],
        mimeType,
        jpegQuality: 1.0,
        dpi: 300, // Print quality
        includeBleed: true
      };

      const blob = await cesdk.engine.block.export(scene, mimeType, options);
      
      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `postcard-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (currentStep === 'select') {
    return (
      <div className="postcard-editor-container">
        <TemplateSelector onSelect={handleTemplateSelect} />
      </div>
    );
  }

  const EditorContent = () => (
    <div className="postcard-editor-container">
      <div className="editor-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Templates
        </button>
        <h2 className="editor-title">Edit Your Postcard</h2>
        <button className="export-button" onClick={handleExport}>
          Export PDF
        </button>
      </div>
      
      <div className="editor-workspace">
        <div className="canvas-container">
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading template...</p>
            </div>
          )}
          <div 
            className="cesdk-wrapper" 
            ref={containerRef}
          >
            {/* CE.SDK will render here */}
          </div>
        </div>
        
        {cesdk && !isLoading && (
          <EditorToolbar cesdk={cesdk} />
        )}
      </div>
      
      {/* Debug view to help diagnose rendering issues */}
      <DebugView cesdk={cesdk} containerRef={containerRef} />
    </div>
  );

  // Wrap with SinglePageModeProvider if cesdk is available
  if (cesdk) {
    return (
      <SinglePageModeProvider cesdk={cesdk}>
        <EditorContent />
      </SinglePageModeProvider>
    );
  }

  return <EditorContent />;
};

export default SimplifiedPostcardEditor;
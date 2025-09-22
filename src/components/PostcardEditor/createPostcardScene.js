// Helper to create postcard scene files programmatically
// This creates scene files compatible with IMG.LY CE.SDK

export const createBusinessServicesScene = async (engine) => {
  // Create a new scene with postcard dimensions (5.3" x 7.5")
  await engine.scene.create();
  
  // Get the page
  const pages = engine.scene.getPages();
  const page = pages[0];
  
  // Set page size for postcard
  engine.block.setWidth(page, 5.3);
  engine.block.setHeight(page, 5.5);
  
  // Create background shape
  const background = engine.block.create('//ly.img.ubq/graphic');
  engine.block.setWidth(background, 5.3);
  engine.block.setHeight(background, 5.5);
  engine.block.setPositionX(background, 0);
  engine.block.setPositionY(background, 0);
  engine.block.setBoolean(background, 'fill/enabled', true);
  engine.block.setColor(background, 'fill/solid/color', { r: 1, g: 1, b: 1, a: 1 });
  engine.block.appendChild(page, background);
  
  // Create header section with teal background
  const header = engine.block.create('//ly.img.ubq/graphic');
  engine.block.setWidth(header, 5.3);
  engine.block.setHeight(header, 1.8);
  engine.block.setPositionX(header, 0);
  engine.block.setPositionY(header, 0);
  engine.block.setBoolean(header, 'fill/enabled', true);
  engine.block.setColor(header, 'fill/solid/color', { r: 0.09, g: 0.64, b: 0.72, a: 1 }); // #17A2B8
  engine.block.appendChild(page, header);
  
  // Add headline text
  const headline = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(headline, 'text/text', '{{headline}}');
  engine.block.setFloat(headline, 'text/fontSize', 0.3);
  engine.block.setEnum(headline, 'text/fontStyle', 'normal');
  engine.block.setEnum(headline, 'text/fontWeight', 'normal');
  engine.block.setEnum(headline, 'text/horizontalAlignment', 'center');
  engine.block.setWidth(headline, 4.8);
  engine.block.setPositionX(headline, 0.25);
  engine.block.setPositionY(headline, 0.3);
  engine.block.setColor(headline, 'text/color', { r: 1, g: 1, b: 1, a: 1 });
  engine.block.appendChild(page, headline);
  
  // Add subheadline text
  const subheadline = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(subheadline, 'text/text', '{{subheadline}}');
  engine.block.setFloat(subheadline, 'text/fontSize', 0.72);
  engine.block.setEnum(subheadline, 'text/fontStyle', 'normal');
  engine.block.setEnum(subheadline, 'text/fontWeight', 'bold');
  engine.block.setEnum(subheadline, 'text/horizontalAlignment', 'center');
  engine.block.setWidth(subheadline, 4.8);
  engine.block.setPositionX(subheadline, 0.25);
  engine.block.setPositionY(subheadline, 0.7);
  engine.block.setColor(subheadline, 'text/color', { r: 1, g: 1, b: 1, a: 1 });
  engine.block.appendChild(page, subheadline);
  
  // Add service boxes with yellow background
  const serviceY = 2.3;
  for (let i = 0; i < 4; i++) {
    const serviceBox = engine.block.create('//ly.img.ubq/graphic');
    engine.block.setWidth(serviceBox, 2.4);
    engine.block.setHeight(serviceBox, 0.5);
    engine.block.setPositionX(serviceBox, i % 2 === 0 ? 0.2 : 2.7);
    engine.block.setPositionY(serviceBox, serviceY + Math.floor(i / 2) * 0.7);
    engine.block.setBoolean(serviceBox, 'fill/enabled', true);
    engine.block.setColor(serviceBox, 'fill/solid/color', { r: 1, g: 0.76, b: 0.03, a: 1 }); // #FFC107
    engine.block.appendChild(page, serviceBox);
    
    // Add service text
    const serviceText = engine.block.create('//ly.img.ubq/text');
    engine.block.setString(serviceText, 'text/text', `Service ${i + 1}`);
    engine.block.setFloat(serviceText, 'text/fontSize', 0.14);
    engine.block.setEnum(serviceText, 'text/horizontalAlignment', 'center');
    engine.block.setWidth(serviceText, 2.2);
    engine.block.setPositionX(serviceText, i % 2 === 0 ? 0.3 : 2.8);
    engine.block.setPositionY(serviceText, serviceY + Math.floor(i / 2) * 0.7 + 0.15);
    engine.block.setColor(serviceText, 'text/color', { r: 0, g: 0, b: 0, a: 1 });
    engine.block.appendChild(page, serviceText);
  }
  
  // Add bottom section with business info
  const bottomSection = engine.block.create('//ly.img.ubq/graphic');
  engine.block.setWidth(bottomSection, 5.3);
  engine.block.setHeight(bottomSection, 1.2);
  engine.block.setPositionX(bottomSection, 0);
  engine.block.setPositionY(bottomSection, 4.3);
  engine.block.setBoolean(bottomSection, 'fill/enabled', true);
  engine.block.setColor(bottomSection, 'fill/solid/color', { r: 0.2, g: 0.2, b: 0.2, a: 1 });
  engine.block.appendChild(page, bottomSection);
  
  // Add business name
  const businessName = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(businessName, 'text/text', '{{businessName}}');
  engine.block.setFloat(businessName, 'text/fontSize', 0.24);
  engine.block.setEnum(businessName, 'text/fontWeight', 'bold');
  engine.block.setEnum(businessName, 'text/horizontalAlignment', 'center');
  engine.block.setWidth(businessName, 4.8);
  engine.block.setPositionX(businessName, 0.25);
  engine.block.setPositionY(businessName, 4.4);
  engine.block.setColor(businessName, 'text/color', { r: 1, g: 1, b: 1, a: 1 });
  engine.block.appendChild(page, businessName);
  
  // Add call to action
  const cta = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(cta, 'text/text', '{{callToAction}}');
  engine.block.setFloat(cta, 'text/fontSize', 0.16);
  engine.block.setEnum(cta, 'text/horizontalAlignment', 'center');
  engine.block.setWidth(cta, 4.8);
  engine.block.setPositionX(cta, 0.25);
  engine.block.setPositionY(cta, 4.7);
  engine.block.setColor(cta, 'text/color', { r: 1, g: 0.76, b: 0.03, a: 1 });
  engine.block.appendChild(page, cta);
  
  // Add contact info
  const contact = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(contact, 'text/text', '{{phone}} • {{website}}');
  engine.block.setFloat(contact, 'text/fontSize', 0.12);
  engine.block.setEnum(contact, 'text/horizontalAlignment', 'center');
  engine.block.setWidth(contact, 4.8);
  engine.block.setPositionX(contact, 0.25);
  engine.block.setPositionY(contact, 5.0);
  engine.block.setColor(contact, 'text/color', { r: 1, g: 1, b: 1, a: 1 });
  engine.block.appendChild(page, contact);
  
  return page;
};

export const createProfessionalAnnouncementScene = async (engine) => {
  // Create a new scene
  await engine.scene.create();
  
  const pages = engine.scene.getPages();
  const page = pages[0];
  
  // Set page size
  engine.block.setWidth(page, 5.3);
  engine.block.setHeight(page, 5.5);
  
  // Create background
  const background = engine.block.create('//ly.img.ubq/graphic');
  engine.block.setWidth(background, 5.3);
  engine.block.setHeight(background, 5.5);
  engine.block.setPositionX(background, 0);
  engine.block.setPositionY(background, 0);
  engine.block.setBoolean(background, 'fill/enabled', true);
  engine.block.setColor(background, 'fill/solid/color', { r: 0.93, g: 0.94, b: 0.95, a: 1 }); // #ECF0F1
  engine.block.appendChild(page, background);
  
  // Create header with dark blue
  const header = engine.block.create('//ly.img.ubq/graphic');
  engine.block.setWidth(header, 5.3);
  engine.block.setHeight(header, 1.5);
  engine.block.setPositionX(header, 0);
  engine.block.setPositionY(header, 0);
  engine.block.setBoolean(header, 'fill/enabled', true);
  engine.block.setColor(header, 'fill/solid/color', { r: 0.17, g: 0.24, b: 0.31, a: 1 }); // #2C3E50
  engine.block.appendChild(page, header);
  
  // Add business name
  const businessName = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(businessName, 'text/text', '{{businessName}}');
  engine.block.setFloat(businessName, 'text/fontSize', 0.28);
  engine.block.setEnum(businessName, 'text/fontWeight', 'bold');
  engine.block.setEnum(businessName, 'text/horizontalAlignment', 'center');
  engine.block.setWidth(businessName, 4.8);
  engine.block.setPositionX(businessName, 0.25);
  engine.block.setPositionY(businessName, 0.5);
  engine.block.setColor(businessName, 'text/color', { r: 1, g: 1, b: 1, a: 1 });
  engine.block.appendChild(page, businessName);
  
  // Add image placeholder
  const imagePlaceholder = engine.block.create('//ly.img.ubq/graphic');
  engine.block.setWidth(imagePlaceholder, 4.8);
  engine.block.setHeight(imagePlaceholder, 2.0);
  engine.block.setPositionX(imagePlaceholder, 0.25);
  engine.block.setPositionY(imagePlaceholder, 1.7);
  engine.block.setBoolean(imagePlaceholder, 'fill/enabled', true);
  engine.block.setColor(imagePlaceholder, 'fill/solid/color', { r: 0.8, g: 0.8, b: 0.8, a: 1 });
  engine.block.appendChild(page, imagePlaceholder);
  
  // Add offer amount (large text)
  const offerAmount = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(offerAmount, 'text/text', '{{offerAmount}}');
  engine.block.setFloat(offerAmount, 'text/fontSize', 0.8);
  engine.block.setEnum(offerAmount, 'text/fontWeight', 'bold');
  engine.block.setEnum(offerAmount, 'text/horizontalAlignment', 'center');
  engine.block.setWidth(offerAmount, 4.8);
  engine.block.setPositionX(offerAmount, 0.25);
  engine.block.setPositionY(offerAmount, 3.9);
  engine.block.setColor(offerAmount, 'text/color', { r: 0.91, g: 0.30, b: 0.24, a: 1 }); // #E74C3C
  engine.block.appendChild(page, offerAmount);
  
  // Add offer description
  const offerDesc = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(offerDesc, 'text/text', '{{offerDescription}}');
  engine.block.setFloat(offerDesc, 'text/fontSize', 0.18);
  engine.block.setEnum(offerDesc, 'text/horizontalAlignment', 'center');
  engine.block.setWidth(offerDesc, 4.8);
  engine.block.setPositionX(offerDesc, 0.25);
  engine.block.setPositionY(offerDesc, 4.6);
  engine.block.setColor(offerDesc, 'text/color', { r: 0.17, g: 0.24, b: 0.31, a: 1 });
  engine.block.appendChild(page, offerDesc);
  
  // Add contact info at bottom
  const contact = engine.block.create('//ly.img.ubq/text');
  engine.block.setString(contact, 'text/text', '{{phone}} • {{website}}');
  engine.block.setFloat(contact, 'text/fontSize', 0.14);
  engine.block.setEnum(contact, 'text/horizontalAlignment', 'center');
  engine.block.setWidth(contact, 4.8);
  engine.block.setPositionX(contact, 0.25);
  engine.block.setPositionY(contact, 5.1);
  engine.block.setColor(contact, 'text/color', { r: 0.41, g: 0.45, b: 0.50, a: 1 });
  engine.block.appendChild(page, contact);
  
  return page;
};
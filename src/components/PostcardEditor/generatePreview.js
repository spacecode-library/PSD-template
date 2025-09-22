// Generates SVG preview images for templates
export const generateTemplatePreview = (template) => {
  const { primaryColor, name, features } = template;
  
  const svg = `
    <svg width="380" height="540" viewBox="0 0 380 540" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="380" height="540" fill="${primaryColor || '#f8f9fa'}" />
      
      <!-- Header Area -->
      <rect x="0" y="0" width="380" height="120" fill="rgba(0,0,0,0.1)" />
      
      <!-- Title -->
      <text x="190" y="70" text-anchor="middle" 
            font-family="Arial, sans-serif" 
            font-size="28" 
            font-weight="bold" 
            fill="white">
        ${name.toUpperCase()}
      </text>
      
      <!-- Content Area -->
      ${features.includes('Image Areas') || features.includes('Photo Area') ? `
        <rect x="40" y="160" width="300" height="200" 
              fill="rgba(255,255,255,0.2)" 
              stroke="rgba(255,255,255,0.5)" 
              stroke-width="2" 
              stroke-dasharray="5,5" />
        <text x="190" y="270" text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="16" 
              fill="rgba(255,255,255,0.7)">
          Image Area
        </text>
      ` : ''}
      
      <!-- Text Area -->
      <rect x="40" y="400" width="300" height="80" 
            fill="rgba(255,255,255,0.1)" />
      
      <!-- Feature Tags -->
      <g transform="translate(40, 500)">
        ${features.slice(0, 3).map((feature, index) => `
          <rect x="${index * 100}" y="0" width="90" height="25" 
                rx="12" fill="rgba(255,255,255,0.2)" />
          <text x="${index * 100 + 45}" y="17" 
                text-anchor="middle" 
                font-family="Arial, sans-serif" 
                font-size="11" 
                fill="white">
            ${feature.substring(0, 10)}
          </text>
        `).join('')}
      </g>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
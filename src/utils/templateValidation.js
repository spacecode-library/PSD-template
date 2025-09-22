/**
 * Template Validation Utility
 * Validates PSD template files and provides file size information
 */

// Maximum recommended PSD file size (10MB in bytes)
const MAX_PSD_SIZE = 10 * 1024 * 1024;

/**
 * Validates if a template is safe to load based on file size
 * @param {Object} template - Template object with psdFileSize property
 * @returns {Object} Validation result with isValid, reason, and fileSize info
 */
export const validateTemplate = (template) => {
  // Templates without PSD files are always valid (programmatic templates)
  if (!template.psdFile) {
    return {
      isValid: true,
      reason: 'Programmatic template - no file size limitations',
      fileSize: null
    };
  }

  // Check if template has explicit availability setting
  if (template.available === false) {
    return {
      isValid: false,
      reason: template.unavailableReason || 'Template marked as unavailable',
      fileSize: template.psdFileSize
    };
  }

  // Check file size if provided
  if (template.psdFileSize) {
    if (template.psdFileSize > MAX_PSD_SIZE) {
      return {
        isValid: false,
        reason: `File size too large (${formatFileSize(template.psdFileSize)}) - may cause loading issues`,
        fileSize: template.psdFileSize
      };
    }
  }

  return {
    isValid: true,
    reason: 'Template meets size requirements',
    fileSize: template.psdFileSize
  };
};

/**
 * Filters an array of templates to only include valid ones
 * @param {Array} templates - Array of template objects
 * @returns {Array} Array of valid templates
 */
export const filterValidTemplates = (templates) => {
  return templates.filter(template => validateTemplate(template).isValid);
};

/**
 * Separates templates into available and unavailable groups
 * @param {Array} templates - Array of template objects
 * @returns {Object} Object with available and unavailable template arrays
 */
export const categorizeTemplates = (templates) => {
  const available = [];
  const unavailable = [];

  templates.forEach(template => {
    const validation = validateTemplate(template);
    if (validation.isValid) {
      available.push(template);
    } else {
      unavailable.push({
        ...template,
        validationResult: validation
      });
    }
  });

  return { available, unavailable };
};

/**
 * Formats file size from bytes to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "6.5MB", "1.2GB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)}${sizes[i]}`;
};

/**
 * Gets file size category for display purposes
 * @param {number} bytes - File size in bytes
 * @returns {string} Size category: 'small', 'medium', 'large', or 'xlarge'
 */
export const getFileSizeCategory = (bytes) => {
  if (!bytes) return 'unknown';
  if (bytes < 1024 * 1024) return 'small';      // < 1MB
  if (bytes < 5 * 1024 * 1024) return 'medium'; // < 5MB
  if (bytes < 20 * 1024 * 1024) return 'large'; // < 20MB
  return 'xlarge';                               // >= 20MB
};

/**
 * Validates template configuration before adding to templates.json
 * @param {Object} template - Template configuration object
 * @returns {Object} Validation result with any issues found
 */
export const validateTemplateConfig = (template) => {
  const issues = [];
  
  // Required fields
  if (!template.id) issues.push('Missing template ID');
  if (!template.name) issues.push('Missing template name');
  if (!template.description) issues.push('Missing template description');
  
  // PSD file validation
  if (template.psdFile) {
    if (!template.psdFileSize) {
      issues.push('PSD file specified but no file size provided');
    } else if (template.psdFileSize > MAX_PSD_SIZE && template.available !== false) {
      issues.push('Large PSD file should be marked as unavailable');
    }
  }
  
  // Availability logic
  if (template.available === false && !template.unavailableReason) {
    issues.push('Unavailable template should include reason');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Default export with all utility functions
 */
export default {
  validateTemplate,
  filterValidTemplates,
  categorizeTemplates,
  formatFileSize,
  getFileSizeCategory,
  validateTemplateConfig,
  MAX_PSD_SIZE
};
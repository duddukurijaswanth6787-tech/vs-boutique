// Zero-dependency JSON schema validator
// Validates field existence and data types based on WDK properties.

const validateSchema = (data, schema) => {
  if (!schema) return { valid: true };
  
  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Data must be a non-null object'] };
  }

  const errors = [];
  
  // 1. Check required properties
  if (schema.required && Array.isArray(schema.required)) {
    schema.required.forEach(field => {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    });
  }

  // 2. Validate types
  if (schema.properties) {
    Object.keys(schema.properties).forEach(key => {
      if (key in data) {
        const propSchema = schema.properties[key];
        const expectedType = propSchema.type;
        const value = data[key];
        
        let actualType = typeof value;
        if (value === null) actualType = 'null';
        else if (Array.isArray(value)) actualType = 'array';

        if (expectedType && actualType !== expectedType) {
          errors.push(`Field '${key}' type mismatch. Expected ${expectedType}, got ${actualType}`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = { validateSchema };

// Stub implementation of uri-templates
// This provides the same API as the original uri-templates package but does minimal processing

// Main constructor function
function UriTemplate(template) {
  if (!(this instanceof UriTemplate)) {
    return new UriTemplate(template);
  }
  this.template = template || '';
}

// Instance methods
UriTemplate.prototype.fill = function(variables) {
  // Basic template expansion - just return template unchanged for stub
  return this.template;
};

UriTemplate.prototype.fillFromObject = function(variables) {
  // Basic template expansion - just return template unchanged for stub
  return this.template;
};

UriTemplate.prototype.fromUri = function(uri, options) {
  // URI extraction - return empty object for stub
  return {};
};

UriTemplate.prototype.test = function(uri, options) {
  // URI testing - always return true for stub
  return true;
};

// Static method for direct template creation
function uriTemplates(template) {
  return new UriTemplate(template);
}

// Export the main function
module.exports = uriTemplates;

// Also export the constructor
module.exports.UriTemplate = UriTemplate; 
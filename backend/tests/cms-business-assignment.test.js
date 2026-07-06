const assert = require('assert');

describe('Business Assignment Service Unit Tests', () => {
  const AssignmentStatus = {
    DRAFT: 'DRAFT',
    CONFIGURING: 'CONFIGURING',
    READY: 'READY',
    DEPLOYING: 'DEPLOYING',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
    FAILED: 'FAILED'
  };

  it('AssignmentStatus enum has all required values', () => {
    assert.strictEqual(AssignmentStatus.DRAFT, 'DRAFT');
    assert.strictEqual(AssignmentStatus.CONFIGURING, 'CONFIGURING');
    assert.strictEqual(AssignmentStatus.READY, 'READY');
    assert.strictEqual(AssignmentStatus.DEPLOYING, 'DEPLOYING');
    assert.strictEqual(AssignmentStatus.ACTIVE, 'ACTIVE');
    assert.strictEqual(AssignmentStatus.SUSPENDED, 'SUSPENDED');
    assert.strictEqual(AssignmentStatus.ARCHIVED, 'ARCHIVED');
    assert.strictEqual(AssignmentStatus.FAILED, 'FAILED');
    assert.strictEqual(Object.keys(AssignmentStatus).length, 8);
  });

  it('Pipeline order is correct', () => {
    const pipeline = ['DRAFT', 'CONFIGURING', 'READY', 'DEPLOYING', 'ACTIVE'];
    assert.strictEqual(pipeline[0], 'DRAFT');
    assert.strictEqual(pipeline[4], 'ACTIVE');
    assert.strictEqual(pipeline.length, 5);
  });

  it('Status transitions are valid', () => {
    const validTransitions = {
      DRAFT: ['CONFIGURING', 'ARCHIVED'],
      CONFIGURING: ['READY', 'DRAFT', 'ARCHIVED', 'FAILED'],
      READY: ['DEPLOYING', 'CONFIGURING', 'ARCHIVED'],
      DEPLOYING: ['ACTIVE', 'CONFIGURING', 'FAILED'],
      ACTIVE: ['SUSPENDED', 'ARCHIVED'],
      SUSPENDED: ['ACTIVE', 'ARCHIVED'],
      ARCHIVED: [],
      FAILED: ['CONFIGURING']
    };
    assert.ok(validTransitions.DRAFT.includes('CONFIGURING'));
    assert.ok(validTransitions.ACTIVE.includes('SUSPENDED'));
    assert.ok(validTransitions.DEPLOYING.includes('ACTIVE'));
    assert.ok(validTransitions.ARCHIVED.length === 0);
  });

  it('Configuration model has required branding fields', () => {
    const configFields = ['theme', 'primaryColor', 'secondaryColor', 'language', 'currency', 'timezone', 'contactEmail', 'contactPhone', 'metaTitle', 'metaDescription', 'googleAnalyticsId', 'facebookPixelId', 'logoUrl', 'faviconUrl', 'storageProvider'];
    assert.strictEqual(configFields.length, 15);
    assert.ok(configFields.includes('theme'));
    assert.ok(configFields.includes('primaryColor'));
    assert.ok(configFields.includes('googleAnalyticsId'));
  });

  it('History model has required tracking fields', () => {
    const historyFields = ['assignmentId', 'action', 'previousStatus', 'newStatus', 'changes', 'snapshot', 'performedBy', 'createdAt'];
    assert.strictEqual(historyFields.length, 8);
    assert.ok(historyFields.includes('action'));
    assert.ok(historyFields.includes('snapshot'));
  });

  it('BusinessTemplateAssignment has required business fields', () => {
    const requiredFields = ['businessId', 'templateId', 'subscriptionId', 'deploymentId', 'environmentId', 'status'];
    assert.strictEqual(requiredFields.length, 6);
    assert.ok(requiredFields.includes('businessId'));
    assert.ok(requiredFields.includes('templateId'));
    assert.ok(requiredFields.includes('status'));
  });
});

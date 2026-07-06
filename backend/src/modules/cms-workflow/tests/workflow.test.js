const { eventBus, Events } = require('../../../services/eventBus');
const workflowService = require('../services/workflow.service');
const templatesService = require('../services/templates.service');

describe('Phase 19 — Workflow Automation Engine', () => {
  let listenSpy;

  beforeAll(async () => {
    await templatesService.initializeDefaults();
    listenSpy = jest.spyOn(eventBus, 'emit').mockImplementation(() => {});
  });

  afterAll(() => {
    listenSpy?.mockRestore();
  });

  describe('EventBus Constants', () => {
    test('should have all 11 workflow event constants', () => {
      expect(Events.WORKFLOW_STARTED).toBe('workflow:started');
      expect(Events.WORKFLOW_COMPLETED).toBe('workflow:completed');
      expect(Events.WORKFLOW_FAILED).toBe('workflow:failed');
      expect(Events.WORKFLOW_PAUSED).toBe('workflow:paused');
      expect(Events.WORKFLOW_RESUMED).toBe('workflow:resumed');
      expect(Events.WORKFLOW_CANCELLED).toBe('workflow:cancelled');
      expect(Events.WORKFLOW_ROLLBACK).toBe('workflow:rollback');
      expect(Events.WORKFLOW_RETRY).toBe('workflow:retry');
      expect(Events.WORKFLOW_STEP_STARTED).toBe('workflow:step:started');
      expect(Events.WORKFLOW_STEP_COMPLETED).toBe('workflow:step:completed');
      expect(Events.WORKFLOW_STEP_FAILED).toBe('workflow:step:failed');
    });
  });

  describe('workflowService.discover()', () => {
    test('should discover workflows across all engines', async () => {
      const result = await workflowService.discover();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('aiWorkflows');
      expect(result).toHaveProperty('certificationWorkflows');
      expect(result).toHaveProperty('templatePipelines');
      expect(result).toHaveProperty('workflowDefinitions');
      expect(typeof result.total).toBe('number');
    });
  });

  describe('templatesService.list()', () => {
    test('should list workflow templates', async () => {
      const templates = await templatesService.list();
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
    });

    test('should include all 12 default templates', async () => {
      const templates = await templatesService.list();
      const slugs = templates.map(t => t.id || t.slug);
      expect(slugs).toContain('website-upload');
      expect(slugs).toContain('website-certification');
      expect(slugs).toContain('website-publish');
      expect(slugs).toContain('business-onboarding');
      expect(slugs).toContain('deploy-website');
      expect(slugs).toContain('renew-ssl');
      expect(slugs).toContain('backup');
      expect(slugs).toContain('restore');
      expect(slugs).toContain('marketplace-publish');
      expect(slugs).toContain('subscription-renewal');
      expect(slugs).toContain('ai-auto-fix');
      expect(slugs).toContain('custom');
    });

    test('each template should have required fields', async () => {
      const templates = await templatesService.list();
      for (const tpl of templates) {
        expect(tpl.name).toBeDefined();
        expect(tpl.description).toBeDefined();
        expect(tpl.engine).toBeDefined();
        expect(tpl.stages).toBeDefined();
        expect(Array.isArray(tpl.stages)).toBe(true);
        expect(tpl.estimatedDuration).toBeDefined();
      }
    });
  });

  describe('templatesService.get()', () => {
    test('should get website-upload template', async () => {
      const tpl = await templatesService.get('website-upload');
      expect(tpl).toBeDefined();
      expect(tpl.name).toBe('Website Upload');
      expect(tpl.engine).toBe('ai-workflow');
    });

    test('should get website-publish template with 3 stages', async () => {
      const tpl = await templatesService.get('website-publish');
      expect(tpl).toBeDefined();
      expect(tpl.stages.length).toBe(3);
      expect(tpl.stages[0].name).toBe('Template Publish');
      expect(tpl.stages[2].name).toBe('Deploy');
    });

    test('should return null for unknown template', async () => {
      const tpl = await templatesService.get('nonexistent-template');
      expect(tpl).toBeNull();
    });
  });

  describe('workflowService.launch()', () => {
    test('should reject unknown template', async () => {
      await expect(workflowService.launch('nonexistent', {})).rejects.toThrow('Workflow template not found');
    });

    test('should launch ai-workflow engine template', async () => {
      const result = await workflowService.launch('website-upload', {}, 'test-user');
      expect(result).toBeDefined();
      expect(result.template).toBe('website-upload');
      expect(result.execution).toBeDefined();
    });

    test('should emit workflow:started event on launch', async () => {
      await workflowService.launch('website-upload', {}, 'test-user');
      expect(listenSpy).toHaveBeenCalledWith('workflow:started', expect.any(Object));
    });
  });

  describe('workflowService.getExecutions()', () => {
    test('should list executions across engines', async () => {
      const result = await workflowService.getExecutions({ page: 1, limit: 20 });
      expect(result).toBeDefined();
      expect(result).toHaveProperty('executions');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.executions)).toBe(true);
    });
  });

  describe('workflowService.getAnalytics()', () => {
    test('should return aggregated analytics', async () => {
      const result = await workflowService.getAnalytics();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('completed');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('successRate');
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('ai');
      expect(result.breakdown).toHaveProperty('certification');
      expect(result.breakdown).toHaveProperty('workflowExecution');
    });

    test('successRate should be between 0 and 100', async () => {
      const result = await workflowService.getAnalytics();
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Zero Duplicate Architecture', () => {
    test('no new Prisma models — templates stored in CmsAiSettings', async () => {
      const templates = await templatesService.list();
      expect(Array.isArray(templates)).toBe(true);
      const prisma = require('../../../utils/prisma');
      const modelNames = Object.keys(prisma).filter(k => k.startsWith('cms') || k.startsWith('workflow') || k.startsWith('certification'));
      expect(modelNames).not.toContain('workflowTemplate');
      expect(modelNames).not.toContain('cmsWorkflowTemplate');
    });

    test('execution delegates to existing engines, never creates new engine', () => {
      const aiWorkflowEngine = require('../../cms-ai-center/services/workflow.service');
      expect(aiWorkflowEngine).toBeDefined();
      expect(typeof aiWorkflowEngine.create).toBe('function');
      expect(typeof aiWorkflowEngine.execute).toBe('function');
      expect(typeof workflowService.launch).toBe('function');
    });
  });

  describe('templatesService.initializeDefaults()', () => {
    test('should initialize workflow templates', async () => {
      const result = await templatesService.initializeDefaults();
      expect(result).toBeDefined();
      expect(result.initialized).toBe(true);
      expect(result.count).toBeGreaterThanOrEqual(11);
    });
  });
});

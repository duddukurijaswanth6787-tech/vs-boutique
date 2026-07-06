const IPromptService = require('../interfaces/IPromptService');
const prisma = require('../../../utils/prisma');
const logger = require('../utils/logger');

class PromptService extends IPromptService {
  constructor() {
    super();
  }

  async createPrompt(name, content, variables = []) {
    logger.info(`Creating prompt template: ${name}`);
    
    // Create prompt template and push initial history version
    const template = await prisma.promptTemplate.create({
      data: {
        name,
        activeVersion: '1.0.0',
        variables: variables,
        promptsHistory: {
          create: {
            version: '1.0.0',
            promptContent: content,
            changeNotes: 'Initial template creation',
            author: 'System Admin'
          }
        }
      },
      include: {
        promptsHistory: true
      }
    });

    return template;
  }

  async getPrompt(templateId, version = null) {
    const template = await prisma.promptTemplate.findUnique({
      where: { id: templateId },
      include: { promptsHistory: true }
    });

    if (!template) {
      throw new Error(`Prompt template with ID '${templateId}' not found.`);
    }

    if (version) {
      const history = template.promptsHistory.find(h => h.version === version);
      if (!history) {
        throw new Error(`Version '${version}' for prompt template '${templateId}' not found.`);
      }
      return {
        ...template,
        activeContent: history.promptContent,
        requestedVersion: version
      };
    }

    // Default to active version content
    const activeHistory = template.promptsHistory.find(h => h.version === template.activeVersion);
    return {
      ...template,
      activeContent: activeHistory ? activeHistory.promptContent : '',
      requestedVersion: template.activeVersion
    };
  }

  async updatePrompt(templateId, newContent, changeNotes = 'Template updated', author = 'System Admin') {
    logger.info(`Updating prompt template: ${templateId}`);

    const template = await this.getPrompt(templateId);
    
    // Increment minor version (e.g., 1.0.0 -> 1.1.0)
    const versionParts = template.activeVersion.split('.');
    versionParts[1] = parseInt(versionParts[1], 10) + 1;
    const newVersion = versionParts.join('.');

    const updated = await prisma.promptTemplate.update({
      where: { id: templateId },
      data: {
        activeVersion: newVersion,
        promptsHistory: {
          create: {
            version: newVersion,
            promptContent: newContent,
            changeNotes,
            author
          }
        }
      },
      include: { promptsHistory: true }
    });

    return updated;
  }

  async compilePrompt(templateId, variablesValues, version = null) {
    const template = await this.getPrompt(templateId, version);
    let compiled = template.activeContent;

    // Validate variables
    const requiredVars = template.variables || [];
    const missing = [];

    requiredVars.forEach(v => {
      if (!(v in variablesValues)) {
        missing.push(v);
      }
    });

    if (missing.length > 0) {
      throw new Error(`Compilation failed. Missing required variables: ${missing.join(', ')}`);
    }

    // Perform replacement
    Object.keys(variablesValues).forEach(key => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      compiled = compiled.replace(regex, variablesValues[key]);
    });

    return compiled;
  }

  async rollbackPrompt(templateId, targetVersion) {
    logger.info(`Rolling back prompt template '${templateId}' to version: ${targetVersion}`);
    
    const template = await this.getPrompt(templateId, targetVersion);
    
    // Create new version containing the rolled back content
    const currentVersionParts = template.activeVersion.split('.');
    currentVersionParts[0] = parseInt(currentVersionParts[0], 10) + 1; // Increment major version
    currentVersionParts[1] = 0;
    const newVersion = currentVersionParts.join('.');

    const updated = await prisma.promptTemplate.update({
      where: { id: templateId },
      data: {
        activeVersion: newVersion,
        promptsHistory: {
          create: {
            version: newVersion,
            promptContent: template.activeContent, // Content loaded from the targetVersion history
            changeNotes: `Rolled back to version ${targetVersion}`,
            author: 'System Admin'
          }
        }
      },
      include: { promptsHistory: true }
    });

    return updated;
  }
}

module.exports = new PromptService();

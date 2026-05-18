import express from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { prisma } from '../index';

const router = express.Router();

// Configuration type definitions
interface ConfigurationValue {
  id: string;
  category: string;
  key: string;
  value: string;
  dataType: 'number' | 'string' | 'boolean' | 'json';
  description?: string;
  isEditable: boolean;
}

interface UpdateConfigurationRequest {
  value: string;
  description?: string;
}

// Helper function to parse configuration value based on data type
function parseConfigValue(value: string, dataType: string): any {
  switch (dataType) {
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value.toLowerCase() === 'true';
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

// Helper function to validate configuration value
function validateConfigValue(value: string, dataType: string): boolean {
  switch (dataType) {
    case 'number':
      return !isNaN(parseFloat(value));
    case 'boolean':
      return ['true', 'false'].includes(value.toLowerCase());
    case 'json':
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    default:
      return typeof value === 'string';
  }
}

// GET /api/configurations - Get all configurations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const configurations = await prisma.systemConfiguration.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    res.json({
      configurations: configurations.map(config => ({
        ...config,
        parsedValue: parseConfigValue(config.value, config.dataType)
      }))
    });
  } catch (error) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

// GET /api/configurations/:category - Get configurations by category
router.get('/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    
    const configurations = await prisma.systemConfiguration.findMany({
      where: { category },
      orderBy: { key: 'asc' }
    });

    if (configurations.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create a more convenient object format for frontend consumption
    const configObject = configurations.reduce((acc, config) => {
      acc[config.key] = {
        value: parseConfigValue(config.value, config.dataType),
        rawValue: config.value,
        dataType: config.dataType,
        description: config.description,
        isEditable: config.isEditable,
        id: config.id,
        updatedAt: config.updatedAt
      };
      return acc;
    }, {} as Record<string, any>);

    res.json({
      category,
      configurations: configObject,
      rawConfigurations: configurations
    });
  } catch (error) {
    console.error('Error fetching category configurations:', error);
    res.status(500).json({ error: 'Failed to fetch category configurations' });
  }
});

// GET /api/configurations/:category/:key - Get specific configuration
router.get('/:category/:key', authenticateToken, async (req, res) => {
  try {
    const { category, key } = req.params;
    
    const configuration = await prisma.systemConfiguration.findUnique({
      where: {
        category_key: { category, key }
      }
    });

    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({
      ...configuration,
      parsedValue: parseConfigValue(configuration.value, configuration.dataType)
    });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// PUT /api/configurations/:category/:key - Update specific configuration
router.put('/:category/:key', 
  authenticateToken, 
  requirePermission('configurations', 'update'),
  async (req, res) => {
    try {
      const { category, key } = req.params;
      const { value, description }: UpdateConfigurationRequest = req.body;
      const userId = (req as any).user.id;

      if (!value) {
        return res.status(400).json({ error: 'Value is required' });
      }

      // Find the existing configuration
      const existingConfig = await prisma.systemConfiguration.findUnique({
        where: {
          category_key: { category, key }
        }
      });

      if (!existingConfig) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      if (!existingConfig.isEditable) {
        return res.status(403).json({ error: 'This configuration is not editable' });
      }

      // Validate the value based on data type
      if (!validateConfigValue(value, existingConfig.dataType)) {
        return res.status(400).json({ 
          error: `Invalid value for data type ${existingConfig.dataType}` 
        });
      }

      // Update the configuration
      const updatedConfig = await prisma.systemConfiguration.update({
        where: {
          category_key: { category, key }
        },
        data: {
          value,
          description: description || existingConfig.description,
          updatedBy: userId
        }
      });

      res.json({
        ...updatedConfig,
        parsedValue: parseConfigValue(updatedConfig.value, updatedConfig.dataType),
        message: 'Configuration updated successfully'
      });
    } catch (error) {
      console.error('Error updating configuration:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  }
);

// POST /api/configurations - Create new configuration (admin only)
router.post('/', 
  authenticateToken,
  requirePermission('configurations', 'create'),
  async (req, res) => {
    try {
      const { category, key, value, dataType, description, isEditable = true } = req.body;
      const userId = (req as any).user.id;

      if (!category || !key || !value || !dataType) {
        return res.status(400).json({ 
          error: 'Category, key, value, and dataType are required' 
        });
      }

      // Validate data type
      if (!['number', 'string', 'boolean', 'json'].includes(dataType)) {
        return res.status(400).json({ 
          error: 'Invalid dataType. Must be one of: number, string, boolean, json' 
        });
      }

      // Validate the value
      if (!validateConfigValue(value, dataType)) {
        return res.status(400).json({ 
          error: `Invalid value for data type ${dataType}` 
        });
      }

      // Create the configuration
      const newConfig = await prisma.systemConfiguration.create({
        data: {
          category,
          key,
          value,
          dataType,
          description,
          isEditable,
          createdBy: userId,
          updatedBy: userId
        }
      });

      res.status(201).json({
        ...newConfig,
        parsedValue: parseConfigValue(newConfig.value, newConfig.dataType),
        message: 'Configuration created successfully'
      });
    } catch (error) {
      if ((error as any).code === 'P2002') {
        return res.status(409).json({ error: 'Configuration with this category and key already exists' });
      }
      console.error('Error creating configuration:', error);
      res.status(500).json({ error: 'Failed to create configuration' });
    }
  }
);

// DELETE /api/configurations/:category/:key - Delete configuration (admin only)
router.delete('/:category/:key',
  authenticateToken,
  requirePermission('configurations', 'delete'),
  async (req, res) => {
    try {
      const { category, key } = req.params;

      const configuration = await prisma.systemConfiguration.findUnique({
        where: {
          category_key: { category, key }
        }
      });

      if (!configuration) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      if (!configuration.isEditable) {
        return res.status(403).json({ error: 'This configuration cannot be deleted' });
      }

      await prisma.systemConfiguration.delete({
        where: {
          category_key: { category, key }
        }
      });

      res.json({ message: 'Configuration deleted successfully' });
    } catch (error) {
      console.error('Error deleting configuration:', error);
      res.status(500).json({ error: 'Failed to delete configuration' });
    }
  }
);

// GET /api/configurations/categories - Get all categories
router.get('/meta/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.systemConfiguration.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    res.json({
      categories: categories.map(cat => ({
        name: cat.category,
        count: cat._count.category
      }))
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
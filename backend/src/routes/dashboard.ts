import { Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { broadcastToOrg, prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { createDashboardSchema, createWidgetSchema, validate } from '../middleware/validate';
import { cache, cacheKeys } from '../utils/cache';

const router = Router();

/**
 * @openapi
 * /api/dashboards:
 *   get:
 *     summary: Get all dashboards
 *     description: Retrieve all dashboards for the authenticated user's organization
 *     tags:
 *       - Dashboards
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dashboards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dashboard'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const dashboards = await prisma.dashboard.findMany({
      where: { organizationId: req.user!.organizationId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { widgets: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(dashboards);
  } catch (error) {
    console.error('Get dashboards error:', error);
    res.status(500).json({ error: 'Failed to get dashboards' });
  }
});

/**
 * @openapi
 * /api/dashboards/{dashboardId}:
 *   get:
 *     summary: Get dashboard by ID
 *     description: Retrieve a single dashboard with all its widgets
 *     tags:
 *       - Dashboards
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Dashboard ID
 *     responses:
 *       200:
 *         description: Dashboard details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dashboard'
 *       404:
 *         description: Dashboard not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
// Get single dashboard with widgets
router.get('/:dashboardId', async (req: AuthRequest, res: Response) => {
  try {
    const { dashboardId } = req.params;

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        organizationId: req.user!.organizationId
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        widgets: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json(dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

/**
 * @openapi
 * /api/dashboards:
 *   post:
 *     summary: Create a new dashboard
 *     description: Create a new dashboard for the authenticated user's organization
 *     tags:
 *       - Dashboards
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Dashboard name
 *                 example: Sales Dashboard
 *               description:
 *                 type: string
 *                 description: Dashboard description
 *                 example: Track sales metrics and KPIs
 *               layout:
 *                 type: string
 *                 enum: [grid, flex]
 *                 default: grid
 *                 description: Dashboard layout type
 *     responses:
 *       201:
 *         description: Dashboard created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dashboard'
 *       500:
 *         description: Server error
 */
// Create dashboard
router.post('/', validate(createDashboardSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, layout } = req.body;

    const dashboard = await prisma.dashboard.create({
      data: {
        id: uuidv4(),
        name,
        description,
        layout: layout || 'grid',
        organizationId: req.user!.organizationId,
        createdById: req.user!.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        action: 'dashboard.created',
        resourceType: 'dashboard',
        resourceId: dashboard.id,
        details: { name }
      }
    });

    // Broadcast to org
    broadcastToOrg(req.user!.organizationId, {
      type: 'dashboard_created',
      data: dashboard
    });

    res.status(201).json(dashboard);
  } catch (error) {
    console.error('Create dashboard error:', error);
    res.status(500).json({ error: 'Failed to create dashboard' });
  }
});

/**
 * @openapi
 * /api/dashboards/{dashboardId}:
 *   put:
 *     summary: Update dashboard
 *     description: Update an existing dashboard's properties
 *     tags:
 *       - Dashboards
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Dashboard ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               layout:
 *                 type: string
 *                 enum: [grid, flex]
 *               settings:
 *                 type: object
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Dashboard updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dashboard'
 *       404:
 *         description: Dashboard not found
 *       500:
 *         description: Server error
 */
// Update dashboard
router.put('/:dashboardId', async (req: AuthRequest, res: Response) => {
  try {
    const { dashboardId } = req.params;
    const { name, description, layout, settings, isPublic } = req.body;

    const existing = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        organizationId: req.user!.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (layout !== undefined) updateData.layout = layout;
    if (settings !== undefined) updateData.settings = settings;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const dashboard = await prisma.dashboard.update({
      where: { id: dashboardId },
      data: updateData,
      include: {
        widgets: true
      }
    });

    // Invalidate cache
    cache.delete(cacheKeys.dashboard(dashboardId));

    res.json(dashboard);
  } catch (error) {
    console.error('Update dashboard error:', error);
    res.status(500).json({ error: 'Failed to update dashboard' });
  }
});

// Delete dashboard
router.delete('/:dashboardId', async (req: AuthRequest, res: Response) => {
  try {
    const { dashboardId } = req.params;

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        organizationId: req.user!.organizationId
      }
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    await prisma.dashboard.delete({
      where: { id: dashboardId }
    });

    // Clear cache
    cache.delete(cacheKeys.dashboard(dashboardId));
    cache.delete(cacheKeys.dashboardWidgets(dashboardId));

    // Audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        action: 'dashboard.deleted',
        resourceType: 'dashboard',
        resourceId: dashboardId
      }
    });

    res.json({ message: 'Dashboard deleted' });
  } catch (error) {
    console.error('Delete dashboard error:', error);
    res.status(500).json({ error: 'Failed to delete dashboard' });
  }
});

/**
 * @openapi
 * /api/dashboards/{dashboardId}/widgets:
 *   post:
 *     summary: Add widget to dashboard
 *     description: Create a new widget and add it to a dashboard
 *     tags:
 *       - Widgets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Dashboard ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - dataSource
 *             properties:
 *               name:
 *                 type: string
 *                 example: Total Sales
 *               type:
 *                 type: string
 *                 enum: [metric, chart, table]
 *                 example: metric
 *               config:
 *                 type: object
 *               position:
 *                 type: object
 *                 properties:
 *                   x:
 *                     type: number
 *                   y:
 *                     type: number
 *                   w:
 *                     type: number
 *                   h:
 *                     type: number
 *               dataSource:
 *                 type: string
 *                 example: analytics_events
 *               refreshInterval:
 *                 type: number
 *                 default: 300
 *     responses:
 *       201:
 *         description: Widget created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Widget'
 *       404:
 *         description: Dashboard not found
 *       500:
 *         description: Server error
 */
// Add widget to dashboard
router.post('/:dashboardId/widgets', validate(createWidgetSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { dashboardId } = req.params;
    const { name, type, config, position, dataSource, refreshInterval } = req.body;

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        organizationId: req.user!.organizationId
      }
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    const widget = await prisma.widget.create({
      data: {
        id: uuidv4(),
        name,
        type,
        config: config || {},
        position: position || { x: 0, y: 0, w: 4, h: 3 },
        dataSource,
        refreshInterval: refreshInterval || 300,
        dashboardId,
        organizationId: req.user!.organizationId
      }
    });

    // Invalidate cache
    cache.delete(cacheKeys.dashboardWidgets(dashboardId));

    res.status(201).json(widget);
  } catch (error) {
    console.error('Create widget error:', error);
    res.status(500).json({ error: 'Failed to create widget' });
  }
});

// Update widget
router.put('/:dashboardId/widgets/:widgetId', async (req: AuthRequest, res: Response) => {
  try {
    const { dashboardId, widgetId } = req.params;
    const { name, type, config, position, dataSource, refreshInterval } = req.body;

    // Verify dashboard belongs to org
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        organizationId: req.user!.organizationId
      }
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (config !== undefined) updateData.config = config;
    if (position !== undefined) updateData.position = position;
    if (dataSource !== undefined) updateData.dataSource = dataSource;
    if (refreshInterval !== undefined) updateData.refreshInterval = refreshInterval;

    const widget = await prisma.widget.update({
      where: { id: widgetId },
      data: updateData
    });

    cache.delete(cacheKeys.dashboardWidgets(dashboardId));

    res.json(widget);
  } catch (error) {
    console.error('Update widget error:', error);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

// Delete widget
router.delete('/:dashboardId/widgets/:widgetId', async (req: AuthRequest, res: Response) => {
  try {
    const { dashboardId, widgetId } = req.params;

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        organizationId: req.user!.organizationId
      }
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    await prisma.widget.delete({
      where: { id: widgetId }
    });

    cache.delete(cacheKeys.dashboardWidgets(dashboardId));

    res.json({ message: 'Widget deleted' });
  } catch (error) {
    console.error('Delete widget error:', error);
    res.status(500).json({ error: 'Failed to delete widget' });
  }
});

// Get widget data
router.get('/:dashboardId/widgets/:widgetId/data', async (req: AuthRequest, res: Response) => {
  try {
    const { dashboardId, widgetId } = req.params;
    const { startDate, endDate } = req.query;

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        organizationId: req.user!.organizationId
      }
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    const widget = await prisma.widget.findFirst({
      where: {
        id: widgetId,
        dashboardId: dashboardId,
        organizationId: req.user!.organizationId
      }
    });

    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    // Fetch data based on widget type and config
    let data: any = null;

    switch (widget.type) {
      case 'metric':
        // Get count/sum of events
        data = await prisma.analyticsEvent.count({
          where: {
            organizationId: req.user!.organizationId,
            ...(startDate && endDate ? {
                  timestamp: {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string)
                  }
            } : {})
          }
        });
        break;

      case 'chart':
        data = await prisma.analyticsEvent.groupBy({
          by: ['eventType'],
          where: {
            organizationId: req.user!.organizationId
          },
          _count: true
        });
        break;

      case 'table':
        data = await prisma.analyticsEvent.findMany({
          where: {
            organizationId: req.user!.organizationId
          },
          orderBy: { timestamp: 'desc' },
          take: 100 // At least limited
        });
        break;

      default:
        data = [];
    }

    res.json({ widget, data });
  } catch (error) {
    console.error('Get widget data error:', error);
    res.status(500).json({ error: 'Failed to get widget data' });
  }
});

// Batch get all widget data for a dashboard
router.get('/:dashboardId/data', async (req: AuthRequest, res: Response) => {
  try {
    const { dashboardId } = req.params;

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        organizationId: req.user!.organizationId
      },
      include: {
        widgets: true
      }
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    const widgetData: any[] = [];

    for (const widget of dashboard.widgets) {
      // Each iteration makes database queries
      let data: any = null;

      if (widget.type === 'metric') {
        data = await prisma.analyticsEvent.count({
          where: { organizationId: req.user!.organizationId }
        });
      } else if (widget.type === 'chart') {
        data = await prisma.analyticsEvent.groupBy({
          by: ['eventType'],
          where: { organizationId: req.user!.organizationId },
          _count: true
        });
      } else if (widget.type === 'table') {
        data = await prisma.analyticsEvent.findMany({
          where: { organizationId: req.user!.organizationId },
          take: 50
        });
      }

      widgetData.push({
        widgetId: widget.id,
        data
      });
    }

    res.json({
      dashboard,
      widgetData
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Duplicate dashboard
router.post('/:dashboardId/duplicate', async (req: AuthRequest, res: Response) => {
  try {
    const { dashboardId } = req.params;
    const { name } = req.body;

    const original = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        organizationId: req.user!.organizationId
      },
      include: { widgets: true }
    });

    if (!original) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    const newDashboardId = uuidv4();

    // Create dashboard copy
    const dashboard = await prisma.dashboard.create({
      data: {
        id: newDashboardId,
        name: name || `${original.name} (Copy)`,
        description: original.description,
        layout: original.layout,
        settings: original.settings as any,
        organizationId: req.user!.organizationId,
        createdById: req.user!.id
      }
    });

    // Copy widgets
    for (const widget of original.widgets) {
      await prisma.widget.create({
        data: {
          id: uuidv4(),
          name: widget.name,
          type: widget.type,
          config: widget.config as any,
          position: widget.position as any,
          dataSource: widget.dataSource,
          refreshInterval: widget.refreshInterval,
          dashboardId: newDashboardId,
          organizationId: req.user!.organizationId
        }
      });
    }

    res.status(201).json(dashboard);
  } catch (error) {
    console.error('Duplicate dashboard error:', error);
    res.status(500).json({ error: 'Failed to duplicate dashboard' });
  }
});

// Share dashboard (get shareable link)
router.post('/:dashboardId/share', async (req: AuthRequest, res: Response) => {
  try {
    const { dashboardId } = req.params;

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        organizationId: req.user!.organizationId
      }
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    // Make dashboard public
    await prisma.dashboard.update({
      where: { id: dashboardId },
      data: { isPublic: true }
    });
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${dashboardId}`;

    res.json({ shareUrl });
  } catch (error) {
    console.error('Share dashboard error:', error);
    res.status(500).json({ error: 'Failed to share dashboard' });
  }
});

// Get shared dashboard (public endpoint would need to be added)
router.get('/shared/:dashboardId', async (req: AuthRequest, res: Response) => {
  try {
    const { dashboardId } = req.params;

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        isPublic: true
      },
      include: {
        widgets: true
      }
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found or not public' });
    }

    res.json(dashboard);
  } catch (error) {
    console.error('Get shared dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

export default router;

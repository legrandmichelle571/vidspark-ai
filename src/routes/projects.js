/**
 * Projects Routes
 */

const express = require('express');
const { supabase } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { NotFoundError, ValidationError } = require('../utils/errors');

const router = express.Router();

// GET /api/projects - List user's projects
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const { data: projects, error, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects - Create project
router.post('/', requireAuth, validate('createProject'), async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { title, description, project_type, youtube_channel_id, youtube_channel_name } = req.body;

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title,
        description,
        project_type,
        youtube_channel_id,
        youtube_channel_name
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !project) {
      throw new NotFoundError('Project not found');
    }

    res.json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;
    const { title, description } = req.body;

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        title,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !project) {
      throw new NotFoundError('Project not found');
    }

    res.json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;

    await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    res.json({
      success: true,
      message: 'Project deleted'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

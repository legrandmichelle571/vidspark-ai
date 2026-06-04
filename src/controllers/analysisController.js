/**
 * Analysis Controller
 * Handles video analysis requests
 */

const analysisService = require('../services/analysisService');
const { validateRequest, schemas } = require('../utils/validators');
const { ValidationError, NotFoundError } = require('../utils/errors');

class AnalysisController {
  /**
   * POST /api/analyze - Create new analysis
   */
  async createAnalysis(req, res, next) {
    try {
      const userId = req.user.userId;
      const { video_id, analysis_type, ai_provider } = req.body;

      // Validate
      const errors = validateRequest(schemas.createAnalysis, {
        video_id,
        analysis_type,
        ai_provider
      });

      if (errors) {
        throw new ValidationError('Validation failed', errors);
      }

      const analysis = await analysisService.createAnalysis(
        userId,
        video_id,
        analysis_type || 'full',
        ai_provider || 'openai'
      );

      res.status(201).json({
        success: true,
        data: analysis,
        message: 'Analysis started. Check status with polling or webhooks.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analyze - List user's analyses
   */
  async listAnalyses(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, status, video_id } = req.query;

      const result = await analysisService.listAnalyses(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        videoId: video_id
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analyze/:id - Get analysis details
   */
  async getAnalysis(req, res, next) {
    try {
      const userId = req.user.userId;
      const analysisId = req.params.id;

      const analysis = await analysisService.getAnalysis(analysisId, userId);

      res.json({
        success: true,
        data: analysis
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/analyze/:id - Delete analysis
   */
  async deleteAnalysis(req, res, next) {
    try {
      const userId = req.user.userId;
      const analysisId = req.params.id;

      const result = await analysisService.deleteAnalysis(analysisId, userId);

      res.json({
        success: true,
        message: 'Analysis deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/analyze/:id/regenerate - Regenerate with different provider
   */
  async regenerateAnalysis(req, res, next) {
    try {
      const userId = req.user.userId;
      const analysisId = req.params.id;
      const { ai_provider } = req.body;

      if (!ai_provider) {
        throw new ValidationError('AI provider required');
      }

      const result = await analysisService.regenerateAnalysis(
        analysisId,
        userId,
        ai_provider
      );

      res.json({
        success: true,
        message: 'Analysis regeneration started'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analyze/:id/export - Export analysis as PDF
   */
  async exportAnalysis(req, res, next) {
    try {
      const userId = req.user.userId;
      const analysisId = req.params.id;
      const { format = 'pdf' } = req.query;

      const content = await analysisService.exportAnalysis(
        analysisId,
        userId,
        format
      );

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="analysis-${analysisId}.pdf"`
      );

      res.send(content);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalysisController();

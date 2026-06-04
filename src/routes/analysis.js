/**
 * Analysis Routes
 */

const express = require('express');
const analysisController = require('../controllers/analysisController');
const { requireAuth } = require('../middleware/auth');
const { checkQuota } = require('../middleware/quota');

const router = express.Router();

// Create analysis
router.post('/', requireAuth, checkQuota, analysisController.createAnalysis);

// List analyses
router.get('/', requireAuth, analysisController.listAnalyses);

// Get analysis
router.get('/:id', requireAuth, analysisController.getAnalysis);

// Delete analysis
router.delete('/:id', requireAuth, analysisController.deleteAnalysis);

// Regenerate analysis
router.post('/:id/regenerate', requireAuth, checkQuota, analysisController.regenerateAnalysis);

// Export analysis
router.get('/:id/export', requireAuth, analysisController.exportAnalysis);

module.exports = router;

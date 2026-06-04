/**
 * Analysis Service
 * Core feature: Video analysis using AI providers
 */

const { supabase } = require('../config/supabase');
const aiService = require('./aiService');
const subscriptionService = require('./subscriptionService');
const { NotFoundError, PaymentError, QuotaExceededError } = require('../utils/errors');

class AnalysisService {
  /**
   * Create new analysis
   */
  async createAnalysis(userId, videoId, analysisType = 'full', aiProvider = 'openai') {
    // Get video details
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', userId)
      .single();

    if (videoError || !video) {
      throw new NotFoundError('Video not found');
    }

    // Check quota
    await subscriptionService.checkQuota(userId);

    // Check if user can access this AI provider
    const canAccess = await subscriptionService.canAccessProvider(userId, aiProvider);
    if (!canAccess) {
      throw new PaymentError(`AI provider '${aiProvider}' is not available in your plan`);
    }

    // Create analysis record
    const { data: analysis, error: createError } = await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        video_id: videoId,
        project_id: video.project_id,
        analysis_type: analysisType,
        ai_provider: aiProvider,
        status: 'processing'
      })
      .select()
      .single();

    if (createError) {
      throw new PaymentError('Failed to create analysis');
    }

    // Run analysis (async)
    this.runAnalysis(analysis.id, video, analysisType, aiProvider, userId);

    return analysis;
  }

  /**
   * Run analysis (called asynchronously)
   */
  async runAnalysis(analysisId, video, analysisType, aiProvider, userId) {
    try {
      // Get AI analysis
      const aiResults = await aiService.analyzeVideo(
        {
          title: video.title,
          description: video.description,
          transcript: video.transcript,
          duration: video.duration,
          view_count: video.view_count,
          like_count: video.like_count,
          comment_count: video.comment_count
        },
        { provider: aiProvider, type: analysisType }
      );

      // Update analysis with results
      const { error: updateError } = await supabase
        .from('analyses')
        .update({
          results: aiResults.results,
          status: 'completed',
          credits_used: this.calculateCreditsUsed(analysisType)
        })
        .eq('id', analysisId);

      if (!updateError) {
        // Increment user quota
        await subscriptionService.useQuota(userId, 1);
      }
    } catch (err) {
      console.error('[AnalysisService] Error running analysis:', err);

      // Mark analysis as failed
      await supabase
        .from('analyses')
        .update({
          status: 'failed',
          error_message: err.message
        })
        .eq('id', analysisId);
    }
  }

  /**
   * Get user's analyses
   */
  async listAnalyses(userId, options = {}) {
    const { page = 1, limit = 20, status = null, videoId = null } = options;

    let query = supabase
      .from('analyses')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (videoId) {
      query = query.eq('video_id', videoId);
    }

    const { data: analyses, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new PaymentError('Failed to fetch analyses');
    }

    return {
      data: analyses,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get analysis details
   */
  async getAnalysis(analysisId, userId) {
    const { data: analysis, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (error || !analysis) {
      throw new NotFoundError('Analysis not found');
    }

    return analysis;
  }

  /**
   * Delete analysis
   */
  async deleteAnalysis(analysisId, userId) {
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', userId);

    if (error) {
      throw new PaymentError('Failed to delete analysis');
    }

    return { success: true };
  }

  /**
   * Regenerate analysis with different provider
   */
  async regenerateAnalysis(analysisId, userId, newProvider) {
    // Get existing analysis
    const analysis = await this.getAnalysis(analysisId, userId);

    // Get video
    const { data: video } = await supabase
      .from('videos')
      .select('*')
      .eq('id', analysis.video_id)
      .single();

    // Check quota again
    await subscriptionService.checkQuota(userId);

    // Check provider access
    const canAccess = await subscriptionService.canAccessProvider(userId, newProvider);
    if (!canAccess) {
      throw new PaymentError(`AI provider '${newProvider}' is not available in your plan`);
    }

    // Update analysis
    const { error } = await supabase
      .from('analyses')
      .update({
        ai_provider: newProvider,
        status: 'processing'
      })
      .eq('id', analysisId);

    if (error) {
      throw new PaymentError('Failed to regenerate analysis');
    }

    // Run new analysis
    this.runAnalysis(analysisId, video, analysis.analysis_type, newProvider, userId);

    return { success: true };
  }

  /**
   * Export analysis as PDF
   */
  async exportAnalysis(analysisId, userId, format = 'pdf') {
    const analysis = await this.getAnalysis(analysisId, userId);

    if (analysis.status !== 'completed') {
      throw new PaymentError('Analysis not completed yet');
    }

    // Generate PDF content
    const pdfContent = this.generatePDF(analysis);

    return pdfContent;
  }

  /**
   * Calculate credits used
   */
  calculateCreditsUsed(analysisType) {
    const costs = {
      full: 10,
      seo: 5,
      engagement: 5,
      audience: 7,
      competitor: 8
    };

    return costs[analysisType] || 10;
  }

  /**
   * Generate PDF
   */
  generatePDF(analysis) {
    // This would use a PDF library like pdfkit or html2pdf
    // For now, return mock content
    return JSON.stringify({
      analysis_id: analysis.id,
      analysis_type: analysis.analysis_type,
      ai_provider: analysis.ai_provider,
      results: analysis.results,
      generated_at: new Date().toISOString()
    });
  }
}

module.exports = new AnalysisService();

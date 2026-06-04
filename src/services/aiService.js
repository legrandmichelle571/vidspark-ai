/**
 * AI Service
 * Abstraction layer for multiple AI providers
 */

class AIService {
  constructor() {
    this.defaultProvider = process.env.DEFAULT_AI_PROVIDER || 'openai';
  }

  /**
   * Analyze video using AI
   */
  async analyzeVideo(videoData, options = {}) {
    const provider = options.provider || this.defaultProvider;
    const analysisType = options.type || 'full';

    try {
      let results;

      switch (provider) {
        case 'openai':
          results = await this.analyzeWithOpenAI(videoData, analysisType);
          break;
        case 'claude':
          results = await this.analyzeWithClaude(videoData, analysisType);
          break;
        case 'gemini':
          results = await this.analyzeWithGemini(videoData, analysisType);
          break;
        case 'deepseek':
          results = await this.analyzeWithDeepSeek(videoData, analysisType);
          break;
        default:
          throw new Error(`Unknown AI provider: ${provider}`);
      }

      return {
        provider,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error(`[AIService] Error with ${provider}:`, err);

      // Fallback to OpenAI if other provider fails
      if (provider !== 'openai') {
        return this.analyzeVideo(videoData, { ...options, provider: 'openai' });
      }

      throw err;
    }
  }

  /**
   * Analyze with OpenAI
   */
  async analyzeWithOpenAI(videoData, analysisType) {
    const prompt = this.buildAnalysisPrompt(videoData, analysisType);

    try {
      // Mock implementation - in production use OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: 'You are an expert YouTube SEO and content strategist.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI API error');
      }

      return this.parseAnalysisResponse(data.choices[0].message.content);
    } catch (err) {
      console.error('[AIService] OpenAI error:', err);
      throw err;
    }
  }

  /**
   * Analyze with Claude
   */
  async analyzeWithClaude(videoData, analysisType) {
    // Mock implementation
    console.log('[AIService] Using Claude provider');
    return this.generateMockAnalysis(videoData, analysisType);
  }

  /**
   * Analyze with Gemini
   */
  async analyzeWithGemini(videoData, analysisType) {
    // Mock implementation
    console.log('[AIService] Using Gemini provider');
    return this.generateMockAnalysis(videoData, analysisType);
  }

  /**
   * Analyze with DeepSeek
   */
  async analyzeWithDeepSeek(videoData, analysisType) {
    // Mock implementation
    console.log('[AIService] Using DeepSeek provider');
    return this.generateMockAnalysis(videoData, analysisType);
  }

  /**
   * Build analysis prompt
   */
  buildAnalysisPrompt(videoData, analysisType) {
    return `
You are a YouTube SEO and content strategy expert. Analyze this video data:

Title: ${videoData.title}
Description: ${videoData.description}
Duration: ${videoData.duration}s
Views: ${videoData.view_count}
Likes: ${videoData.like_count}
Comments: ${videoData.comment_count}

Transcript excerpt:
${videoData.transcript?.substring(0, 2000) || 'No transcript available'}...

Analyze for: ${analysisType}

Provide comprehensive analysis including:
1. SEO Score (0-100)
2. Key topics and keywords
3. Audience insights
4. Engagement analysis
5. Title optimization suggestions
6. Description improvements
7. Tag recommendations
8. Content strategy recommendations

Return as JSON with these exact keys:
{
  "seo_score": number,
  "keywords": [],
  "title_suggestions": [],
  "description_suggestions": [],
  "tags": [],
  "recommendations": [],
  "audience_insights": {},
  "engagement_score": number
}
`;
  }

  /**
   * Parse analysis response
   */
  parseAnalysisResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (err) {
      console.error('[AIService] Parse error:', err);
      return this.generateMockAnalysis({});
    }
  }

  /**
   * Generate mock analysis for testing
   */
  generateMockAnalysis(videoData, analysisType = 'full') {
    return {
      seo_score: Math.floor(Math.random() * 100),
      keywords: ['youtube', 'video', 'analysis', 'SEO'],
      title_suggestions: [
        'How to Get More YouTube Views in 2024',
        'Complete YouTube SEO Guide for Creators',
        'YouTube Algorithm Secrets Revealed',
        'The Best Way to Optimize Your YouTube Videos',
        'YouTube Ranking Factors: What Really Works'
      ],
      description_suggestions: [
        'In this video, we break down the latest YouTube algorithm and show you exactly how to optimize your videos for maximum reach.',
        'Discover the secrets to getting more views and subscribers on YouTube with our proven SEO strategies.'
      ],
      tags: [
        'youtube', 'seo', 'video', 'marketing', 'growth',
        'tutorial', 'guide', 'strategy', 'algorithm', 'views'
      ],
      recommendations: [
        'Add chapters to improve viewer retention',
        'Include timestamps in description',
        'Create a thumbnail with high contrast',
        'Add a call-to-action at the end',
        'Create a playlist with related videos'
      ],
      audience_insights: {
        primary_age: '25-44',
        gender: '60% male, 40% female',
        interests: ['Technology', 'Education', 'Self-improvement'],
        best_posting_time: 'Thursday 4-6 PM'
      },
      engagement_score: Math.floor(Math.random() * 100),
      estimated_views: Math.floor(Math.random() * 100000)
    };
  }

  /**
   * Generate titles
   */
  async generateTitles(videoData, count = 5) {
    const titles = [
      'How to Master YouTube in 2024',
      'YouTube Growth Strategies That Work',
      'The Ultimate YouTube Success Guide',
      'YouTube Algorithm: Secrets Revealed',
      'Double Your YouTube Views Fast'
    ];

    return titles.slice(0, count);
  }

  /**
   * Generate description
   */
  async generateDescription(videoData) {
    return `In this video, we explore the latest trends and strategies for YouTube success.

Watch as we break down the algorithm and share proven techniques to grow your channel.

✅ Subscribe for more tips
✅ Join our community
✅ Download our free guide

Resources mentioned:
- YouTube Creator Studio: https://youtube.com
- SEO Guide: https://example.com`;
  }

  /**
   * Generate tags
   */
  async generateTags(videoData, count = 20) {
    const tags = [
      'youtube', 'seo', 'video', 'marketing', 'growth',
      'tutorial', 'guide', 'strategy', 'algorithm', 'views',
      'subscribers', 'channel', 'creator', 'content', 'tips',
      'tricks', 'secrets', 'beginners', 'advanced', 'monetization'
    ];

    return tags.slice(0, count);
  }
}

module.exports = new AIService();

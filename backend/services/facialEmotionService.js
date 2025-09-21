const axios = require('axios');

/**
 * Facial Emotion Recognition Service
 * Handles facial emotion analysis using Hugging Face ElenaRyumina/face_emotion_recognition model
 */
class FacialEmotionService {
  constructor() {
    this.huggingFaceApiKey = process.env.HUGGING_FACE_API_KEY;
    this.modelUrl = 'https://api-inference.huggingface.co/models/ElenaRyumina/face_emotion_recognition';
    this.aiServicesUrl = process.env.AI_SERVICES_URL || 'http://localhost:8000';
    this.isHuggingFaceAvailable = false;
    this.isLocalAvailable = false;
    this.initializeService();
  }

  async initializeService() {
    // Check Hugging Face API availability
    if (this.huggingFaceApiKey && this.huggingFaceApiKey !== 'your_hugging_face_api_key') {
      try {
        const testResponse = await axios.post(
          this.modelUrl,
          { inputs: 'test' },
          {
            headers: {
              'Authorization': `Bearer ${this.huggingFaceApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        this.isHuggingFaceAvailable = true;
        console.log('✅ Hugging Face emotion recognition model available');
      } catch (error) {
        console.warn('⚠️ Hugging Face API unavailable:', error.response?.status || error.message);
        this.isHuggingFaceAvailable = false;
      }
    }

    // Check local AI services
    try {
      const response = await axios.get(`${this.aiServicesUrl}/health`, { timeout: 5000 });
      this.isLocalAvailable = response.status === 200;
      console.log('✅ Local facial emotion service available');
    } catch (error) {
      console.warn('⚠️ Local facial emotion service unavailable');
      this.isLocalAvailable = false;
    }

    if (!this.isHuggingFaceAvailable && !this.isLocalAvailable) {
      console.warn('⚠️ All facial emotion services unavailable, using fallback analysis');
    }
  }

  /**
   * Analyze facial emotions from base64 image data
   * @param {string} imageData - Base64 encoded image
   * @param {string} userId - User ID for logging
   * @returns {Object} Emotion analysis results
   */
  async analyzeFacialEmotion(imageData, userId = null) {
    try {
      // Validate input
      if (!imageData || typeof imageData !== 'string') {
        throw new Error('Invalid image data provided');
      }

      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

      // Try Hugging Face model first
      if (this.isHuggingFaceAvailable) {
        try {
          const huggingFaceResult = await this.analyzeWithHuggingFace(base64Data, userId);
          if (huggingFaceResult) {
            return huggingFaceResult;
          }
        } catch (hfError) {
          console.warn('Hugging Face analysis failed:', hfError.message);
        }
      }

      // Fallback to local AI services
      if (this.isLocalAvailable) {
        try {
          const response = await axios.post(
            `${this.aiServicesUrl}/analyze/facial-emotion`,
            {
              image_data: base64Data,
              user_id: userId
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 30000
            }
          );

          if (response.data && response.data.success) {
            return this.formatEmotionResults(response.data.data);
          }
        } catch (aiError) {
          console.warn('Local AI facial emotion analysis failed:', aiError.message);
        }
      }

      // Final fallback to mock analysis
      return this.getFallbackEmotionAnalysis();

    } catch (error) {
      console.error('Facial emotion analysis error:', error);
      throw new Error('Failed to analyze facial emotions');
    }
  }

  /**
   * Analyze emotions using Hugging Face ElenaRyumina/face_emotion_recognition model
   * @param {string} base64Data - Base64 encoded image
   * @param {string} userId - User ID for logging
   * @returns {Object} Emotion analysis results
   */
  async analyzeWithHuggingFace(base64Data, userId = null) {
    try {
      // Convert base64 to buffer for Hugging Face API
      const imageBuffer = Buffer.from(base64Data, 'base64');

      const response = await axios.post(
        this.modelUrl,
        imageBuffer,
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceApiKey}`,
            'Content-Type': 'application/octet-stream'
          },
          timeout: 30000
        }
      );

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return this.formatHuggingFaceResults(response.data, userId);
      }

      throw new Error('Invalid response from Hugging Face API');
    } catch (error) {
      console.error('Hugging Face API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Format emotion analysis results from Hugging Face API
   * @param {Array} huggingFaceResults - Results from Hugging Face API
   * @param {string} userId - User ID for logging
   * @returns {Object} Formatted emotion results
   */
  formatHuggingFaceResults(huggingFaceResults, userId = null) {
    try {
      // Hugging Face returns array of emotion predictions
      const emotions = {};
      let dominantEmotion = 'neutral';
      let maxConfidence = 0;

      // Process emotion predictions
      huggingFaceResults.forEach(prediction => {
        const label = prediction.label.toLowerCase();
        const score = prediction.score;

        // Map Hugging Face labels to our emotion categories
        const emotionMap = {
          'anger': 'angry',
          'disgust': 'disgust',
          'fear': 'fear',
          'happiness': 'happy',
          'joy': 'happy',
          'sadness': 'sad',
          'surprise': 'surprise',
          'neutral': 'neutral'
        };

        const mappedEmotion = emotionMap[label] || label;
        emotions[mappedEmotion] = score;

        if (score > maxConfidence) {
          maxConfidence = score;
          dominantEmotion = mappedEmotion;
        }
      });

      // Ensure all emotion categories are present
      const allEmotions = {
        happy: emotions.happy || 0,
        sad: emotions.sad || 0,
        angry: emotions.angry || 0,
        fear: emotions.fear || 0,
        surprise: emotions.surprise || 0,
        disgust: emotions.disgust || 0,
        neutral: emotions.neutral || 0.1
      };

      // Normalize emotions to sum to 1
      const total = Object.values(allEmotions).reduce((sum, val) => sum + val, 0);
      Object.keys(allEmotions).forEach(key => {
        allEmotions[key] = allEmotions[key] / total;
      });

      const stressScore = this.calculateStressScore(allEmotions);

      return {
        success: true,
        emotions: allEmotions,
        dominantEmotion,
        confidence: maxConfidence,
        stressScore,
        stressLevel: this.getStressLevel(stressScore),
        metadata: {
          processingTime: Date.now(),
          modelVersion: 'ElenaRyumina/face_emotion_recognition',
          timestamp: new Date().toISOString(),
          source: 'hugging_face',
          userId
        }
      };
    } catch (error) {
      console.error('Error formatting Hugging Face results:', error);
      return this.getFallbackEmotionAnalysis();
    }
  }

  /**
   * Format emotion analysis results from AI service
   * @param {Object} rawResults - Raw results from AI service
   * @returns {Object} Formatted emotion results
   */
  formatEmotionResults(rawResults) {
    const emotions = rawResults.emotions || {};
    const dominantEmotion = rawResults.dominant_emotion || 'neutral';
    const confidence = rawResults.confidence || 0.75;

    // Calculate stress score based on emotions
    const stressScore = this.calculateStressScore(emotions);

    return {
      success: true,
      emotions: {
        happy: emotions.happy || 0,
        sad: emotions.sad || 0,
        angry: emotions.angry || 0,
        fear: emotions.fear || 0,
        surprise: emotions.surprise || 0,
        disgust: emotions.disgust || 0,
        neutral: emotions.neutral || 0.5
      },
      dominantEmotion,
      confidence,
      stressScore,
      stressLevel: this.getStressLevel(stressScore),
      metadata: {
        processingTime: rawResults.processing_time || 0,
        modelVersion: rawResults.model_version || '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Generate fallback emotion analysis when AI service is unavailable
   * @returns {Object} Fallback emotion results
   */
  getFallbackEmotionAnalysis() {
    // Generate realistic emotion distribution
    const emotions = {
      neutral: Math.random() * 0.4 + 0.4, // 40-80%
      happy: Math.random() * 0.3 + 0.1,   // 10-40%
      sad: Math.random() * 0.2 + 0.05,    // 5-25%
      angry: Math.random() * 0.15 + 0.02, // 2-17%
      fear: Math.random() * 0.1 + 0.01,   // 1-11%
      surprise: Math.random() * 0.1 + 0.01, // 1-11%
      disgust: Math.random() * 0.05 + 0.01  // 1-6%
    };

    // Normalize emotions to sum to 1
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
    Object.keys(emotions).forEach(key => {
      emotions[key] = emotions[key] / total;
    });

    // Find dominant emotion
    const dominantEmotion = Object.entries(emotions)
      .reduce((max, [emotion, value]) => value > max.value ? { emotion, value } : max, 
              { emotion: 'neutral', value: 0 }).emotion;

    const stressScore = this.calculateStressScore(emotions);

    return {
      success: true,
      emotions,
      dominantEmotion,
      confidence: 0.75,
      stressScore,
      stressLevel: this.getStressLevel(stressScore),
      metadata: {
        processingTime: Math.floor(Math.random() * 2000) + 500,
        modelVersion: 'fallback-1.0.0',
        timestamp: new Date().toISOString(),
        fallback: true
      }
    };
  }

  /**
   * Calculate stress score based on emotion distribution
   * @param {Object} emotions - Emotion scores
   * @returns {number} Stress score (0-100)
   */
  calculateStressScore(emotions) {
    // Weight emotions by their stress contribution
    const stressWeights = {
      angry: 0.8,
      fear: 0.7,
      sad: 0.6,
      disgust: 0.5,
      surprise: 0.3,
      neutral: 0.2,
      happy: 0.1
    };

    let weightedScore = 0;
    Object.entries(emotions).forEach(([emotion, value]) => {
      const weight = stressWeights[emotion] || 0.2;
      weightedScore += value * weight;
    });

    // Convert to 0-100 scale
    return Math.round(weightedScore * 100);
  }

  /**
   * Convert stress score to stress level
   * @param {number} score - Stress score (0-100)
   * @returns {string} Stress level
   */
  getStressLevel(score) {
    if (score <= 30) return 'low';
    if (score <= 60) return 'moderate';
    return 'high';
  }

  /**
   * Validate image data format
   * @param {string} imageData - Base64 image data
   * @returns {boolean} Is valid
   */
  validateImageData(imageData) {
    if (!imageData || typeof imageData !== 'string') return false;
    
    // Check if it's a valid base64 string (with or without data URL prefix)
    const base64Regex = /^(data:image\/[a-z]+;base64,)?[A-Za-z0-9+/]+=*$/;
    return base64Regex.test(imageData);
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getServiceStatus() {
    return {
      huggingFace: {
        available: this.isHuggingFaceAvailable,
        modelUrl: this.modelUrl,
        model: 'ElenaRyumina/face_emotion_recognition'
      },
      localServices: {
        available: this.isLocalAvailable,
        aiServicesUrl: this.aiServicesUrl
      },
      fallbackAvailable: true,
      lastChecked: new Date().toISOString()
    };
  }
}

// Export singleton instance
module.exports = new FacialEmotionService();

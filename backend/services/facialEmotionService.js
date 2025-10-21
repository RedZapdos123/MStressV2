const axios = require('axios');

/**
 * Facial Emotion Recognition Service
 * Handles facial emotion analysis using LibreFace (FER service) from AI services
 */
class FacialEmotionService {
  constructor() {
    this.aiServicesUrl = process.env.AI_SERVICES_URL || 'http://localhost:8000';
    this.ferEndpoint = `${this.aiServicesUrl}/fer/recognize-emotion`;
    this.isLibreFaceAvailable = false;
    this.initializeService();
  }

  async initializeService() {
    // Check LibreFace (FER) service availability
    try {
      const response = await axios.get(`${this.aiServicesUrl}/health`, { timeout: 5000 });
      if (response.status === 200) {
        this.isLibreFaceAvailable = true;
        console.log('✅ LibreFace (FER) facial emotion service available at', this.ferEndpoint);
      }
    } catch (error) {
      console.error('❌ LibreFace (FER) service unavailable at', this.ferEndpoint);
      console.error('Error:', error.message);
      this.isLibreFaceAvailable = false;
    }
  }

  /**
   * Analyze facial emotions from base64 image data using LibreFace
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

      // Ensure LibreFace service is available
      if (!this.isLibreFaceAvailable) {
        throw new Error('LibreFace (FER) service is not available. Please ensure AI services are running.');
      }

      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

      // Call LibreFace (FER) service directly
      console.log(`📸 Sending facial emotion analysis request to LibreFace at ${this.ferEndpoint}`);

      const response = await axios.post(
        this.ferEndpoint,
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
        console.log('✅ LibreFace analysis successful');
        return this.formatLibreFaceResults(response.data.data, userId);
      } else {
        throw new Error('Invalid response from LibreFace service');
      }

    } catch (error) {
      console.error('❌ Facial emotion analysis error:', error.message);
      throw new Error(`Facial emotion analysis failed: ${error.message}`);
    }
  }

  /**
   * Format emotion analysis results from LibreFace (FER) service
   * @param {Object} libreaceResults - Results from LibreFace service
   * @param {string} userId - User ID for logging
   * @returns {Object} Formatted emotion results
   */
  formatLibreFaceResults(libreaceResults, userId = null) {
    try {
      // LibreFace returns emotion predictions
      const emotions = libreaceResults.all_emotions || {};
      const dominantEmotion = libreaceResults.dominant_emotion || 'neutral';
      const confidence = libreaceResults.confidence || 0.75;

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
      if (total > 0) {
        Object.keys(allEmotions).forEach(key => {
          allEmotions[key] = allEmotions[key] / total;
        });
      }

      const stressScore = this.calculateStressScore(allEmotions);

      return {
        success: true,
        emotions: allEmotions,
        dominantEmotion,
        confidence,
        stressScore,
        stressLevel: this.getStressLevel(stressScore),
        metadata: {
          processingTime: libreaceResults.timestamp ? new Date(libreaceResults.timestamp).getTime() : Date.now(),
          modelVersion: 'LibreFace-FER',
          timestamp: new Date().toISOString(),
          source: 'libreface',
          userId
        }
      };
    } catch (error) {
      console.error('Error formatting LibreFace results:', error);
      throw new Error(`Failed to format LibreFace results: ${error.message}`);
    }
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
      libreface: {
        available: this.isLibreFaceAvailable,
        endpoint: this.ferEndpoint,
        model: 'LibreFace-FER'
      },
      aiServicesUrl: this.aiServicesUrl,
      fallbackAvailable: false,
      lastChecked: new Date().toISOString()
    };
  }
}

// Export singleton instance
module.exports = new FacialEmotionService();

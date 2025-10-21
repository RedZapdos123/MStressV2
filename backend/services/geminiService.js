const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generate personalized mental health recommendations using Gemini API
 * @param {Object} assessmentData - User's assessment data
 * @returns {Promise<Object>} Recommendations in three categories
 */
async function generateRecommendations(assessmentData) {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key') {
      return getFallbackRecommendations(assessmentData);
    }

    const {
      stressScore = 50,
      stressLevel = 'moderate',
      assessmentType = 'standard',
      lastThreeScores = [],
      dass21Scores = {}
    } = assessmentData;

    // Calculate trend
    let trend = 'stable';
    if (lastThreeScores.length >= 2) {
      const recent = lastThreeScores[0];
      const previous = lastThreeScores[1];
      if (recent > previous + 5) {
        trend = 'worsening';
      } else if (recent < previous - 5) {
        trend = 'improving';
      }
    }

    // Build detailed prompt
    const prompt = `You are a mental health expert. Based on the following assessment data, provide personalized mental health recommendations in JSON format with three categories.

Assessment Data:
- Current Stress Score: ${stressScore}/100
- Stress Level: ${stressLevel}
- Assessment Type: ${assessmentType}
- Trend: ${trend}
${lastThreeScores.length > 0 ? `- Last Three Scores: ${lastThreeScores.join(', ')}` : ''}
${Object.keys(dass21Scores).length > 0 ? `- DASS-21 Subscales: Depression=${dass21Scores.depression || 'N/A'}, Anxiety=${dass21Scores.anxiety || 'N/A'}, Stress=${dass21Scores.stress || 'N/A'}` : ''}

Please provide recommendations in this exact JSON format:
{
  "immediateActions": [
    "Action 1 (something to do today)",
    "Action 2 (something to do today)",
    "Action 3 (something to do today)"
  ],
  "weeklyPractices": [
    "Practice 1 (habit to build this week)",
    "Practice 2 (habit to build this week)",
    "Practice 3 (habit to build this week)"
  ],
  "longTermStrategies": [
    "Strategy 1 (ongoing mental health practice)",
    "Strategy 2 (ongoing mental health practice)",
    "Strategy 3 (ongoing mental health practice)"
  ],
  "summary": "A brief 2-3 sentence summary of the recommendations"
}

Ensure recommendations are specific, actionable, and tailored to the stress level and trend. Be compassionate and encouraging.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const recommendations = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        recommendations,
        source: 'gemini'
      };
    }

    return getFallbackRecommendations(assessmentData);
  } catch (error) {
    console.error('Gemini API error:', error.message);
    return getFallbackRecommendations(assessmentData);
  }
}

/**
 * Fallback recommendations when Gemini API is unavailable
 */
function getFallbackRecommendations(assessmentData) {
  const { stressLevel = 'moderate' } = assessmentData;

  const recommendations = {
    immediateActions: [
      'Take 5 deep breaths right now - breathe in for 4 counts, hold for 4, exhale for 4',
      'Step outside for 10 minutes to get fresh air and sunlight',
      'Drink a glass of water and have a healthy snack'
    ],
    weeklyPractices: [
      'Practice 20 minutes of meditation or mindfulness daily',
      'Exercise for at least 30 minutes, 3-4 times this week',
      'Maintain a consistent sleep schedule (7-9 hours per night)'
    ],
    longTermStrategies: [
      'Develop a regular exercise routine (150 minutes per week)',
      'Practice mindfulness meditation (10-20 minutes daily)',
      'Build a strong support network and maintain regular social connections'
    ],
    summary: 'Focus on foundational wellness practices: regular exercise, adequate sleep, and mindfulness. These evidence-based strategies are proven to reduce stress and improve mental health.'
  };

  if (stressLevel === 'high' || stressLevel === 'severe') {
    recommendations.immediateActions.push('Consider reaching out to a mental health professional or counselor');
    recommendations.longTermStrategies.push('Schedule regular therapy or counseling sessions with a licensed mental health professional');
  }

  return {
    success: true,
    recommendations,
    source: 'fallback'
  };
}

module.exports = {
  generateRecommendations
};


import React, { useState, useEffect } from 'react';
import {
  HeartIcon,
  SparklesIcon,
  ClockIcon,
  PlayIcon,
  ArrowPathIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const MindfulnessSection = ({ userAssessments = [] }) => {
  const [mindfulnessTechniques, setMindfulnessTechniques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    generateMindfulnessTechniques();
  }, [userAssessments]);

  const generateMindfulnessTechniques = async () => {
    setLoading(true);
    try {
      // Prepare assessment data for AI analysis
      const latestAssessment = userAssessments[0];
      const assessmentData = latestAssessment ? {
        overall_score: latestAssessment.score || latestAssessment.stressScore,
        stress_level: latestAssessment.stressLevel || 'moderate',
        assessment_count: userAssessments.length,
        recent_trend: userAssessments.length > 1 ? 
          (userAssessments[0].score > userAssessments[1].score ? 'increasing' : 'decreasing') : 'stable'
      } : {
        overall_score: 50,
        stress_level: 'moderate',
        assessment_count: 0,
        recent_trend: 'stable'
      };

      // Call Gemini AI for personalized mindfulness techniques
      const response = await axios.post('/api/ai/mindfulness-techniques', {
        assessmentData,
        userProfile: {
          assessmentHistory: userAssessments.slice(0, 3) // Last 3 assessments
        }
      });

      if (response.data.success) {
        setMindfulnessTechniques(response.data.techniques || []);
        setLastUpdated(new Date());
      } else {
        // Fallback techniques if AI fails
        setFallbackTechniques(assessmentData.stress_level);
      }
    } catch (error) {
      console.error('Error generating mindfulness techniques:', error);
      // Use fallback techniques
      setFallbackTechniques(userAssessments[0]?.stressLevel || 'moderate');
    } finally {
      setLoading(false);
    }
  };

  const setFallbackTechniques = (stressLevel) => {
    const fallbackTechniques = {
      low: [
        {
          title: "Gratitude Reflection",
          description: "Take a moment to appreciate three positive things from your day.",
          duration: "3-5 minutes",
          type: "reflection",
          instructions: [
            "Find a comfortable, quiet space",
            "Think of three things you're grateful for today",
            "Reflect on why each one is meaningful to you",
            "Notice how this makes you feel"
          ]
        },
        {
          title: "Mindful Walking",
          description: "A gentle walking meditation to maintain your positive state.",
          duration: "10-15 minutes",
          type: "movement",
          instructions: [
            "Walk at a slower pace than usual",
            "Focus on the sensation of your feet touching the ground",
            "Notice your surroundings without judgment",
            "Breathe naturally and stay present"
          ]
        }
      ],
      moderate: [
        {
          title: "5-Minute Breathing Space",
          description: "A quick reset technique to center yourself during busy moments.",
          duration: "5 minutes",
          type: "breathing",
          instructions: [
            "Sit comfortably and close your eyes",
            "Take three deep breaths to settle in",
            "Focus on your breath for 2 minutes",
            "Expand awareness to your whole body",
            "Set an intention for the rest of your day"
          ]
        },
        {
          title: "Body Scan Check-in",
          description: "Release tension and reconnect with your body.",
          duration: "8-10 minutes",
          type: "body-awareness",
          instructions: [
            "Lie down or sit comfortably",
            "Start at the top of your head",
            "Slowly scan down through your body",
            "Notice areas of tension without trying to change them",
            "Send breath to any tense areas"
          ]
        }
      ],
      high: [
        {
          title: "Emergency Calm Technique",
          description: "Quick grounding exercise for immediate stress relief.",
          duration: "2-3 minutes",
          type: "grounding",
          instructions: [
            "Name 5 things you can see",
            "Name 4 things you can touch",
            "Name 3 things you can hear",
            "Name 2 things you can smell",
            "Name 1 thing you can taste"
          ]
        },
        {
          title: "Progressive Muscle Release",
          description: "Systematic tension release for high stress moments.",
          duration: "10-15 minutes",
          type: "relaxation",
          instructions: [
            "Tense your fists for 5 seconds, then release",
            "Tense your arms, hold, then release",
            "Continue with shoulders, face, and body",
            "Notice the contrast between tension and relaxation",
            "End with three deep, calming breaths"
          ]
        }
      ]
    };

    setMindfulnessTechniques(fallbackTechniques[stressLevel] || fallbackTechniques.moderate);
    setLastUpdated(new Date());
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'breathing': return HeartIcon;
      case 'movement': return SparklesIcon;
      case 'reflection': return LightBulbIcon;
      case 'grounding': return SparklesIcon;
      case 'body-awareness': return HeartIcon;
      case 'relaxation': return HeartIcon;
      default: return SparklesIcon;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'breathing': return 'bg-blue-100 text-blue-800';
      case 'movement': return 'bg-green-100 text-green-800';
      case 'reflection': return 'bg-purple-100 text-purple-800';
      case 'grounding': return 'bg-orange-100 text-orange-800';
      case 'body-awareness': return 'bg-indigo-100 text-indigo-800';
      case 'relaxation': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SparklesIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-xl font-semibold text-gray-900">Personalized Mindfulness</h3>
        </div>
        <button
          onClick={generateMindfulnessTechniques}
          disabled={loading}
          className="btn-secondary text-sm flex items-center"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating...' : 'Refresh'}
        </button>
      </div>

      {lastUpdated && (
        <p className="text-sm text-gray-500 mb-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating personalized mindfulness techniques...</p>
        </div>
      ) : mindfulnessTechniques.length > 0 ? (
        <div className="space-y-6">
          {mindfulnessTechniques.map((technique, index) => {
            const Icon = getTypeIcon(technique.type);
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 text-indigo-600 mr-2" />
                    <h4 className="font-medium text-gray-900">{technique.title}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(technique.type)}`}>
                      {technique.type.replace('-', ' ')}
                    </span>
                    <span className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {technique.duration}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{technique.description}</p>

                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Instructions:</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    {technique.instructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>

                <button className="btn-primary w-full flex items-center justify-center">
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Practice
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <SparklesIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No mindfulness techniques available.</p>
          <p className="text-sm text-gray-400 mt-2">
            Complete an assessment to get personalized recommendations.
          </p>
        </div>
      )}

      {/* Quick Access Tips */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Quick Mindfulness Tips</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-blue-800">
              <strong>Morning:</strong> Start with 5 minutes of mindful breathing
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-green-800">
              <strong>Midday:</strong> Take mindful breaks between tasks
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-purple-800">
              <strong>Evening:</strong> Practice gratitude before sleep
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-orange-800">
              <strong>Anytime:</strong> Use 5-4-3-2-1 grounding when stressed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindfulnessSection;

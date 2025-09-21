import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  SparklesIcon, 
  ClockIcon, 
  PlayIcon,
  ArrowPathIcon,
  LightBulbIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  GlobeAltIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../App';
import axios from 'axios';
import toast from 'react-hot-toast';

const MindfulnessPage = () => {
  const { user } = useAuth();
  const [mindfulnessTechniques, setMindfulnessTechniques] = useState([]);
  const [userAssessments, setUserAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeCategory, setActiveCategory] = useState('personalized');

  useEffect(() => {
    fetchUserAssessments();
  }, []);

  useEffect(() => {
    if (userAssessments.length > 0) {
      generateMindfulnessTechniques();
    }
  }, [userAssessments]);

  const fetchUserAssessments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/user/assessments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserAssessments(response.data.assessments || []);
      }
    } catch (error) {
      console.error('Failed to fetch user assessments:', error);
    }
  };

  const generateMindfulnessTechniques = async () => {
    setLoading(true);
    try {
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

      const response = await axios.post('/api/ai/mindfulness-techniques', {
        assessmentData,
        userProfile: {
          assessmentHistory: userAssessments.slice(0, 3)
        }
      });

      if (response.data.success) {
        setMindfulnessTechniques(response.data.techniques || []);
        setLastUpdated(new Date());
      } else {
        setFallbackTechniques(assessmentData.stress_level);
      }
    } catch (error) {
      console.error('Error generating mindfulness techniques:', error);
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

  const generalTechniques = [
    {
      title: "4-7-8 Breathing",
      description: "A powerful technique to reduce anxiety and promote relaxation.",
      duration: "5-10 minutes",
      type: "breathing",
      instructions: [
        "Sit comfortably with your back straight",
        "Exhale completely through your mouth",
        "Close your mouth and inhale through your nose for 4 counts",
        "Hold your breath for 7 counts",
        "Exhale through your mouth for 8 counts",
        "Repeat the cycle 3-4 times"
      ]
    },
    {
      title: "Loving-Kindness Meditation",
      description: "Cultivate compassion and positive emotions towards yourself and others.",
      duration: "10-20 minutes",
      type: "meditation",
      instructions: [
        "Sit comfortably and close your eyes",
        "Begin by sending loving thoughts to yourself",
        "Extend these feelings to loved ones",
        "Include neutral people in your life",
        "Finally, send kindness to difficult people",
        "End by extending love to all beings"
      ]
    },
    {
      title: "Mindful Observation",
      description: "Practice present-moment awareness through careful observation.",
      duration: "5-15 minutes",
      type: "awareness",
      instructions: [
        "Choose an object to focus on (flower, candle, etc.)",
        "Observe it as if seeing it for the first time",
        "Notice colors, textures, shapes, and details",
        "When your mind wanders, gently return to the object",
        "End by appreciating the beauty you've discovered"
      ]
    }
  ];

  const mindfulnessResources = [
    {
      title: "Headspace",
      description: "Guided meditation and mindfulness app with structured programs",
      url: "https://www.headspace.com",
      type: "App"
    },
    {
      title: "Insight Timer",
      description: "Free meditation app with thousands of guided sessions",
      url: "https://insighttimer.com",
      type: "App"
    },
    {
      title: "Mindful.org",
      description: "Articles, practices, and resources on mindfulness",
      url: "https://www.mindful.org",
      type: "Website"
    },
    {
      title: "UCLA Mindful Awareness Research Center",
      description: "Free guided meditations and mindfulness resources",
      url: "https://www.uclahealth.org/marc/mindful-meditations",
      type: "Website"
    }
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'breathing': return HeartIcon;
      case 'movement': return MusicalNoteIcon;
      case 'reflection': return LightBulbIcon;
      case 'grounding': return SparklesIcon;
      case 'body-awareness': return HeartIcon;
      case 'relaxation': return HeartIcon;
      case 'meditation': return BookOpenIcon;
      case 'awareness': return SparklesIcon;
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
      case 'meditation': return 'bg-teal-100 text-teal-800';
      case 'awareness': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = {
    personalized: {
      title: 'Personalized for You',
      techniques: mindfulnessTechniques,
      description: 'AI-generated techniques based on your recent assessments'
    },
    general: {
      title: 'General Techniques',
      techniques: generalTechniques,
      description: 'Proven mindfulness practices for everyone'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Mindfulness & Meditation
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover personalized mindfulness techniques and meditation practices to help you find calm, 
              reduce stress, and improve your mental wellbeing.
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          {Object.entries(categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
                activeCategory === key 
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>

        {/* Active Category Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {categories[activeCategory].title}
              </h2>
              <p className="text-gray-600 mt-1">
                {categories[activeCategory].description}
              </p>
            </div>
            {activeCategory === 'personalized' && (
              <button
                onClick={generateMindfulnessTechniques}
                disabled={loading}
                className="btn-secondary flex items-center"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generating...' : 'Refresh'}
              </button>
            )}
          </div>

          {activeCategory === 'personalized' && lastUpdated && (
            <p className="text-sm text-gray-500 mb-6">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}

          {loading && activeCategory === 'personalized' ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating personalized mindfulness techniques...</p>
            </div>
          ) : categories[activeCategory].techniques.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categories[activeCategory].techniques.map((technique, index) => {
                const Icon = getTypeIcon(technique.type);
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <Icon className="h-6 w-6 text-indigo-600 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">{technique.title}</h3>
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

                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Instructions:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
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
            <div className="text-center py-12">
              <SparklesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No techniques available.</p>
              {activeCategory === 'personalized' && (
                <p className="text-sm text-gray-400 mt-2">
                  Complete an assessment to get personalized recommendations.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Mindfulness Resources */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Recommended Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mindfulnessResources.map((resource, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{resource.title}</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {resource.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  Visit Resource
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white mb-8">
          <h3 className="text-xl font-semibold mb-4">Mindfulness Tips for Daily Life</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <h4 className="font-medium mb-2">Morning</h4>
              <p>Start with 5 minutes of mindful breathing before checking your phone</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <h4 className="font-medium mb-2">Work</h4>
              <p>Take mindful breaks between tasks to reset your focus and energy</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <h4 className="font-medium mb-2">Evening</h4>
              <p>Practice gratitude by reflecting on three positive moments from your day</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <h4 className="font-medium mb-2">Anytime</h4>
              <p>Use the 5-4-3-2-1 grounding technique when feeling overwhelmed</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to Start Your Mindfulness Journey?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Regular mindfulness practice can significantly improve your mental health and overall wellbeing.
              Start with just 5 minutes a day and gradually build your practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/assessment" className="btn-primary">
                Take Assessment for Personalized Techniques
              </Link>
              <Link to="/exercises" className="btn-secondary">
                Explore More Wellness Exercises
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindfulnessPage;

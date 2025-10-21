import React, { useState } from 'react';
import { 
  HeartIcon, 
  PlayIcon, 
  ClockIcon, 
  StarIcon,
  GlobeAltIcon,
  BookOpenIcon,
  VideoCameraIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../App';

const ExercisePage = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('breathing');

  const exerciseCategories = {
    breathing: {
      title: 'Breathing Exercises',
      icon: HeartIcon,
      color: 'blue',
      exercises: [
        {
          id: 1,
          title: '4-7-8 Breathing Technique',
          duration: '5-10 minutes',
          difficulty: 'Beginner',
          description: 'A powerful technique to reduce anxiety and promote relaxation by controlling your breath pattern.',
          steps: [
            'Sit comfortably with your back straight',
            'Exhale completely through your mouth',
            'Close your mouth and inhale through your nose for 4 counts',
            'Hold your breath for 7 counts',
            'Exhale through your mouth for 8 counts',
            'Repeat the cycle 3-4 times'
          ],
          benefits: ['Reduces anxiety', 'Improves sleep', 'Lowers stress hormones'],
          externalLink: 'https://www.healthline.com/health/4-7-8-breathing'
        },
        {
          id: 2,
          title: 'Box Breathing',
          duration: '5-15 minutes',
          difficulty: 'Beginner',
          description: 'Used by Navy SEALs to stay calm under pressure. Equal counts for inhale, hold, exhale, hold.',
          steps: [
            'Sit upright in a comfortable position',
            'Exhale slowly through your mouth',
            'Inhale through your nose for 4 counts',
            'Hold your breath for 4 counts',
            'Exhale through your mouth for 4 counts',
            'Hold empty for 4 counts',
            'Repeat for 5-10 cycles'
          ],
          benefits: ['Improves focus', 'Reduces stress', 'Enhances performance'],
          externalLink: 'https://www.webmd.com/balance/what-is-box-breathing'
        }
      ]
    },
    meditation: {
      title: 'Meditation & Mindfulness',
      icon: BookOpenIcon,
      color: 'purple',
      exercises: [
        {
          id: 3,
          title: 'Body Scan Meditation',
          duration: '10-20 minutes',
          difficulty: 'Beginner',
          description: 'Progressive relaxation technique that helps you become aware of tension in your body.',
          steps: [
            'Lie down comfortably on your back',
            'Close your eyes and take three deep breaths',
            'Start at the top of your head',
            'Slowly scan down through each part of your body',
            'Notice any tension or sensations without judgment',
            'Consciously relax each area as you scan',
            'End at your toes, then rest for a few minutes'
          ],
          benefits: ['Reduces muscle tension', 'Improves body awareness', 'Promotes deep relaxation'],
          externalLink: 'https://www.mindful.org/the-body-scan-practice/'
        },
        {
          id: 4,
          title: '5-4-3-2-1 Grounding Technique',
          duration: '3-5 minutes',
          difficulty: 'Beginner',
          description: 'A quick mindfulness exercise to bring you back to the present moment during anxiety.',
          steps: [
            'Name 5 things you can see around you',
            'Name 4 things you can touch',
            'Name 3 things you can hear',
            'Name 2 things you can smell',
            'Name 1 thing you can taste',
            'Take a deep breath and notice how you feel'
          ],
          benefits: ['Reduces anxiety', 'Grounds you in the present', 'Quick stress relief'],
          externalLink: 'https://www.urmc.rochester.edu/behavioral-health-partners/bhp-blog/april-2018/5-4-3-2-1-coping-technique-for-anxiety.aspx'
        }
      ]
    },
    movement: {
      title: 'Gentle Movement',
      icon: MusicalNoteIcon,
      color: 'green',
      exercises: [
        {
          id: 5,
          title: 'Desk Yoga Stretches',
          duration: '5-10 minutes',
          difficulty: 'Beginner',
          description: 'Simple stretches you can do at your desk to relieve tension and stress.',
          steps: [
            'Neck rolls: Slowly roll your head in circles',
            'Shoulder shrugs: Lift shoulders to ears, hold, release',
            'Seated spinal twist: Twist gently to each side',
            'Seated forward fold: Bend forward over your legs',
            'Ankle circles: Rotate ankles in both directions',
            'Deep breathing: Take 5 deep breaths'
          ],
          benefits: ['Relieves muscle tension', 'Improves circulation', 'Reduces workplace stress'],
          externalLink: 'https://www.yogajournal.com/poses/yoga-by-benefit/desk-yoga'
        },
        {
          id: 6,
          title: 'Progressive Muscle Relaxation',
          duration: '15-20 minutes',
          difficulty: 'Intermediate',
          description: 'Systematically tense and relax different muscle groups to achieve deep relaxation.',
          steps: [
            'Lie down in a comfortable position',
            'Start with your toes - tense for 5 seconds, then relax',
            'Move to your calves, thighs, abdomen',
            'Continue with hands, arms, shoulders',
            'Tense your face muscles, then relax',
            'Notice the contrast between tension and relaxation',
            'End with whole-body tension, then complete relaxation'
          ],
          benefits: ['Deep muscle relaxation', 'Reduces physical stress', 'Improves sleep quality'],
          externalLink: 'https://www.anxietycanada.com/articles/progressive-muscle-relaxation/'
        }
      ]
    }
  };

  const externalResources = [
    {
      title: 'Headspace',
      description: 'Guided meditation and mindfulness app',
      url: 'https://www.headspace.com',
      type: 'App'
    },
    {
      title: 'Calm',
      description: 'Sleep stories, meditation, and relaxation',
      url: 'https://www.calm.com',
      type: 'App'
    },
    {
      title: 'Yoga with Adriene',
      description: 'Free yoga videos for all levels',
      url: 'https://www.youtube.com/user/yogawithadriene',
      type: 'YouTube'
    },
    {
      title: 'Insight Timer',
      description: 'Free meditation app with thousands of guided sessions',
      url: 'https://insighttimer.com',
      type: 'App'
    },
    {
      title: 'Ten Percent Happier',
      description: 'Practical meditation for skeptics',
      url: 'https://www.tenpercent.com',
      type: 'App'
    },
    {
      title: 'Mindful.org',
      description: 'Articles and resources on mindfulness',
      url: 'https://www.mindful.org',
      type: 'Website'
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-purple-100 text-purple-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      red: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[color] || colors.blue;
  };

  const getActiveColor = (color) => {
    const colors = {
      blue: 'bg-blue-600 text-white',
      purple: 'bg-purple-600 text-white',
      red: 'bg-red-600 text-white'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mental Wellness Exercises
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover calming techniques and exercises to help manage stress, anxiety, and improve your overall mental wellbeing.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {Object.entries(exerciseCategories).map(([key, category]) => {
            const Icon = category.icon;
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
                  isActive 
                    ? getActiveColor(category.color)
                    : getCategoryColor(category.color)
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {category.title}
              </button>
            );
          })}
        </div>

        {/* Exercise Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {exerciseCategories[activeCategory].exercises.map((exercise) => (
            <div key={exercise.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{exercise.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                  {exercise.difficulty}
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-600 mb-4">
                <ClockIcon className="h-4 w-4 mr-1" />
                {exercise.duration}
              </div>

              <p className="text-gray-600 mb-6">{exercise.description}</p>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  {exercise.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Benefits:</h4>
                <div className="flex flex-wrap gap-2">
                  {exercise.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="btn-primary flex-1">
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Exercise
                </button>
                <a
                  href={exercise.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center"
                >
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  Learn More
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* External Resources */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Recommended Apps & Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {externalResources.map((resource, index) => (
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
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  Visit Resource
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-4">Quick Tips for Success</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2">
              <li>• Start with just 5 minutes a day</li>
              <li>• Practice at the same time each day</li>
              <li>• Find a quiet, comfortable space</li>
            </ul>
            <ul className="space-y-2">
              <li>• Be patient with yourself</li>
              <li>• Consistency is more important than duration</li>
              <li>• Try different techniques to find what works</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExercisePage;

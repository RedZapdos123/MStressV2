import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

const AssessmentForm = ({ 
  assessmentType = 'standard_stress',
  onComplete,
  onCancel,
  className = ''
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { user } = useAuth();

  // Get questions based on assessment type
  const getQuestions = () => {
    // Anxiety Screening (GAD-7 based - 15 questions)
    if (assessmentType === 'anxiety') {
      return [
        {
          id: 'anxiety_1',
          category: 'anxiety',
          text: 'Feeling nervous, anxious or on edge',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'anxiety_2',
          category: 'anxiety',
          text: 'Not being able to stop or control worrying',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'anxiety_3',
          category: 'anxiety',
          text: 'Worrying too much about different things',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'anxiety_4',
          category: 'anxiety',
          text: 'Trouble relaxing',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'anxiety_5',
          category: 'anxiety',
          text: 'Being so restless that it is hard to sit still',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'anxiety_6',
          category: 'anxiety',
          text: 'Becoming easily annoyed or irritable',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'anxiety_7',
          category: 'anxiety',
          text: 'Feeling afraid as if something awful might happen',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'anxiety_8',
          category: 'anxiety',
          text: 'How often do you experience panic attacks or sudden intense fear?',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Never' },
            { value: 1, label: 'Rarely' },
            { value: 2, label: 'Sometimes' },
            { value: 3, label: 'Often' }
          ]
        },
        {
          id: 'anxiety_9',
          category: 'anxiety',
          text: 'Do you avoid situations due to anxiety?',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Slightly' },
            { value: 2, label: 'Moderately' },
            { value: 3, label: 'Severely' }
          ]
        },
        {
          id: 'anxiety_10',
          category: 'anxiety',
          text: 'How much does anxiety interfere with your daily activities?',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Slightly' },
            { value: 2, label: 'Moderately' },
            { value: 3, label: 'Severely' }
          ]
        },
        {
          id: 'anxiety_11',
          category: 'anxiety',
          text: 'Do you have physical symptoms of anxiety (racing heart, sweating)?',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Never' },
            { value: 1, label: 'Rarely' },
            { value: 2, label: 'Sometimes' },
            { value: 3, label: 'Often' }
          ]
        },
        {
          id: 'anxiety_12',
          category: 'anxiety',
          text: 'How well do you sleep at night?',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Very well' },
            { value: 1, label: 'Fairly well' },
            { value: 2, label: 'Poorly' },
            { value: 3, label: 'Very poorly' }
          ]
        },
        {
          id: 'anxiety_13',
          category: 'anxiety',
          text: 'How would you rate your overall anxiety level?',
          type: 'scale',
          required: true,
          options: [
            { value: 0, label: 'Minimal' },
            { value: 1, label: 'Mild' },
            { value: 2, label: 'Moderate' },
            { value: 3, label: 'Severe' }
          ]
        },
        {
          id: 'anxiety_14',
          category: 'anxiety',
          text: 'Do you seek professional help for anxiety?',
          type: 'multiple_choice',
          required: true,
          options: [
            { value: 'no', label: 'No, not currently' },
            { value: 'considering', label: 'Considering it' },
            { value: 'yes', label: 'Yes, I am' },
            { value: 'previously', label: 'Previously did' }
          ]
        },
        {
          id: 'anxiety_15',
          category: 'anxiety',
          text: 'Please describe any specific triggers or situations that cause you anxiety:',
          type: 'text',
          required: false,
          placeholder: 'Share your anxiety triggers... (Optional)',
          maxLength: 500
        }
      ];
    }

    // Wellbeing Check (30 questions)
    if (assessmentType === 'wellbeing') {
      return [
        {
          id: 'wellbeing_1',
          category: 'general_wellbeing',
          text: 'How would you rate your overall life satisfaction?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Dissatisfied' },
            { value: 2, label: 'Dissatisfied' },
            { value: 3, label: 'Neutral' },
            { value: 4, label: 'Satisfied' },
            { value: 5, label: 'Very Satisfied' }
          ]
        },
        {
          id: 'wellbeing_2',
          category: 'physical_health',
          text: 'How is your physical health?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Poor' },
            { value: 2, label: 'Fair' },
            { value: 3, label: 'Good' },
            { value: 4, label: 'Very Good' },
            { value: 5, label: 'Excellent' }
          ]
        },
        {
          id: 'wellbeing_3',
          category: 'physical_health',
          text: 'How would you rate your sleep quality?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Poor' },
            { value: 2, label: 'Poor' },
            { value: 3, label: 'Fair' },
            { value: 4, label: 'Good' },
            { value: 5, label: 'Excellent' }
          ]
        },
        {
          id: 'wellbeing_4',
          category: 'physical_health',
          text: 'How often do you exercise or engage in physical activity?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Never' },
            { value: 2, label: 'Rarely' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Often' },
            { value: 5, label: 'Very Often' }
          ]
        },
        {
          id: 'wellbeing_5',
          category: 'physical_health',
          text: 'How would you rate your energy levels?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Low' },
            { value: 2, label: 'Low' },
            { value: 3, label: 'Moderate' },
            { value: 4, label: 'High' },
            { value: 5, label: 'Very High' }
          ]
        },
        {
          id: 'wellbeing_6',
          category: 'general_wellbeing',
          text: 'How would you describe your current mood?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Negative' },
            { value: 2, label: 'Negative' },
            { value: 3, label: 'Neutral' },
            { value: 4, label: 'Positive' },
            { value: 5, label: 'Very Positive' }
          ]
        },
        {
          id: 'wellbeing_7',
          category: 'general_wellbeing',
          text: 'How often do you feel happy or content?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Never' },
            { value: 2, label: 'Rarely' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Often' },
            { value: 5, label: 'Very Often' }
          ]
        },
        {
          id: 'wellbeing_8',
          category: 'general_wellbeing',
          text: 'How would you rate your stress level?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very High' },
            { value: 2, label: 'High' },
            { value: 3, label: 'Moderate' },
            { value: 4, label: 'Low' },
            { value: 5, label: 'Very Low' }
          ]
        },
        {
          id: 'wellbeing_9',
          category: 'social_relationships',
          text: 'How satisfied are you with your relationships?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Dissatisfied' },
            { value: 2, label: 'Dissatisfied' },
            { value: 3, label: 'Neutral' },
            { value: 4, label: 'Satisfied' },
            { value: 5, label: 'Very Satisfied' }
          ]
        },
        {
          id: 'wellbeing_10',
          category: 'social_relationships',
          text: 'How strong is your support network?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Weak' },
            { value: 2, label: 'Weak' },
            { value: 3, label: 'Moderate' },
            { value: 4, label: 'Strong' },
            { value: 5, label: 'Very Strong' }
          ]
        },
        {
          id: 'wellbeing_11',
          category: 'social_relationships',
          text: 'How often do you spend time with friends or family?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Never' },
            { value: 2, label: 'Rarely' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Often' },
            { value: 5, label: 'Very Often' }
          ]
        },
        {
          id: 'wellbeing_12',
          category: 'work_stress',
          text: 'How satisfied are you with your work/studies?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Dissatisfied' },
            { value: 2, label: 'Dissatisfied' },
            { value: 3, label: 'Neutral' },
            { value: 4, label: 'Satisfied' },
            { value: 5, label: 'Very Satisfied' }
          ]
        },
        {
          id: 'wellbeing_13',
          category: 'work_stress',
          text: 'How well do you balance work/studies with personal life?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Poorly' },
            { value: 2, label: 'Poorly' },
            { value: 3, label: 'Fairly' },
            { value: 4, label: 'Well' },
            { value: 5, label: 'Very Well' }
          ]
        },
        {
          id: 'wellbeing_14',
          category: 'general_wellbeing',
          text: 'How often do you engage in activities you enjoy?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Never' },
            { value: 2, label: 'Rarely' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Often' },
            { value: 5, label: 'Very Often' }
          ]
        },
        {
          id: 'wellbeing_15',
          category: 'general_wellbeing',
          text: 'How would you rate your sense of purpose in life?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Low' },
            { value: 2, label: 'Low' },
            { value: 3, label: 'Moderate' },
            { value: 4, label: 'High' },
            { value: 5, label: 'Very High' }
          ]
        },
        {
          id: 'wellbeing_16',
          category: 'general_wellbeing',
          text: 'How often do you feel anxious?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Often' },
            { value: 2, label: 'Often' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Rarely' },
            { value: 5, label: 'Never' }
          ]
        },
        {
          id: 'wellbeing_17',
          category: 'general_wellbeing',
          text: 'How often do you feel depressed?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Often' },
            { value: 2, label: 'Often' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Rarely' },
            { value: 5, label: 'Never' }
          ]
        },
        {
          id: 'wellbeing_18',
          category: 'general_wellbeing',
          text: 'How well do you cope with challenges?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Poorly' },
            { value: 2, label: 'Poorly' },
            { value: 3, label: 'Fairly' },
            { value: 4, label: 'Well' },
            { value: 5, label: 'Very Well' }
          ]
        },
        {
          id: 'wellbeing_19',
          category: 'general_wellbeing',
          text: 'How often do you practice self-care?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Never' },
            { value: 2, label: 'Rarely' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Often' },
            { value: 5, label: 'Very Often' }
          ]
        },
        {
          id: 'wellbeing_20',
          category: 'general_wellbeing',
          text: 'How satisfied are you with your personal growth?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Dissatisfied' },
            { value: 2, label: 'Dissatisfied' },
            { value: 3, label: 'Neutral' },
            { value: 4, label: 'Satisfied' },
            { value: 5, label: 'Very Satisfied' }
          ]
        },
        {
          id: 'wellbeing_21',
          category: 'general_wellbeing',
          text: 'How often do you feel lonely?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Often' },
            { value: 2, label: 'Often' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Rarely' },
            { value: 5, label: 'Never' }
          ]
        },
        {
          id: 'wellbeing_22',
          category: 'general_wellbeing',
          text: 'How would you rate your self-esteem?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Low' },
            { value: 2, label: 'Low' },
            { value: 3, label: 'Moderate' },
            { value: 4, label: 'High' },
            { value: 5, label: 'Very High' }
          ]
        },
        {
          id: 'wellbeing_23',
          category: 'general_wellbeing',
          text: 'How often do you feel motivated?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Never' },
            { value: 2, label: 'Rarely' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Often' },
            { value: 5, label: 'Very Often' }
          ]
        },
        {
          id: 'wellbeing_24',
          category: 'general_wellbeing',
          text: 'How would you rate your financial wellbeing?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Poor' },
            { value: 2, label: 'Poor' },
            { value: 3, label: 'Fair' },
            { value: 4, label: 'Good' },
            { value: 5, label: 'Excellent' }
          ]
        },
        {
          id: 'wellbeing_25',
          category: 'general_wellbeing',
          text: 'How often do you feel grateful?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Never' },
            { value: 2, label: 'Rarely' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Often' },
            { value: 5, label: 'Very Often' }
          ]
        },
        {
          id: 'wellbeing_26',
          category: 'general_wellbeing',
          text: 'How would you rate your spiritual or existential wellbeing?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Low' },
            { value: 2, label: 'Low' },
            { value: 3, label: 'Moderate' },
            { value: 4, label: 'High' },
            { value: 5, label: 'Very High' }
          ]
        },
        {
          id: 'wellbeing_27',
          category: 'general_wellbeing',
          text: 'How often do you practice mindfulness or meditation?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Never' },
            { value: 2, label: 'Rarely' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Often' },
            { value: 5, label: 'Very Often' }
          ]
        },
        {
          id: 'wellbeing_28',
          category: 'general_wellbeing',
          text: 'How would you rate your overall mental health?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Very Poor' },
            { value: 2, label: 'Poor' },
            { value: 3, label: 'Fair' },
            { value: 4, label: 'Good' },
            { value: 5, label: 'Excellent' }
          ]
        },
        {
          id: 'wellbeing_29',
          category: 'general_wellbeing',
          text: 'How often do you seek professional help when needed?',
          type: 'scale',
          required: true,
          options: [
            { value: 1, label: 'Never' },
            { value: 2, label: 'Rarely' },
            { value: 3, label: 'Sometimes' },
            { value: 4, label: 'Often' },
            { value: 5, label: 'Very Often' }
          ]
        },
        {
          id: 'wellbeing_30',
          category: 'general_wellbeing',
          text: 'Please share any additional thoughts about your wellbeing:',
          type: 'text',
          required: false,
          placeholder: 'Share your thoughts... (Optional)',
          maxLength: 500
        }
      ];
    }

    // Default: Standard/Advanced Assessment (8 questions)
    return [
      {
        id: 'stress_level',
        category: 'general_wellbeing',
        text: 'How would you rate your current stress level?',
        type: 'scale',
        required: true,
        options: [
          { value: 1, label: 'Very Low', description: 'Feeling calm and relaxed' },
          { value: 2, label: 'Low', description: 'Minimal stress, manageable' },
          { value: 3, label: 'Moderate', description: 'Some stress, but coping well' },
          { value: 4, label: 'High', description: 'Significant stress, affecting daily life' },
          { value: 5, label: 'Very High', description: 'Overwhelming stress, difficult to cope' }
        ]
      },
      {
        id: 'sleep_quality',
        category: 'physical_health',
        text: 'How would you describe your sleep quality over the past week?',
        type: 'scale',
        required: true,
        options: [
          { value: 1, label: 'Excellent', description: 'Restful sleep, wake up refreshed' },
          { value: 2, label: 'Good', description: 'Generally good sleep with minor issues' },
          { value: 3, label: 'Fair', description: 'Some sleep difficulties, occasional tiredness' },
          { value: 4, label: 'Poor', description: 'Frequent sleep problems, often tired' },
          { value: 5, label: 'Very Poor', description: 'Severe sleep issues, constantly exhausted' }
        ]
      },
      {
        id: 'energy_level',
        category: 'physical_health',
        text: 'How would you rate your energy levels recently?',
        type: 'scale',
        required: true,
        options: [
          { value: 1, label: 'Very High', description: 'Energetic and motivated' },
          { value: 2, label: 'High', description: 'Good energy for daily activities' },
          { value: 3, label: 'Moderate', description: 'Average energy, some fatigue' },
          { value: 4, label: 'Low', description: 'Often tired, low motivation' },
          { value: 5, label: 'Very Low', description: 'Constantly exhausted, no energy' }
        ]
      },
      {
        id: 'work_academic_stress',
        category: user?.userType === 'student' ? 'academic_stress' : 'work_stress',
        text: user?.userType === 'student'
          ? 'How stressed do you feel about your academic responsibilities?'
          : 'How stressed do you feel about your work responsibilities?',
        type: 'scale',
        required: true,
        options: [
          { value: 1, label: 'Not at all', description: 'No stress from responsibilities' },
          { value: 2, label: 'Slightly', description: 'Minor stress, easily manageable' },
          { value: 3, label: 'Moderately', description: 'Some stress, requires effort to manage' },
          { value: 4, label: 'Very much', description: 'High stress, significantly impacts life' },
          { value: 5, label: 'Extremely', description: 'Overwhelming stress, major life impact' }
        ]
      },
      {
        id: 'social_relationships',
        category: 'social_relationships',
        text: 'How satisfied are you with your social relationships and support system?',
        type: 'scale',
        required: true,
        options: [
          { value: 1, label: 'Very Satisfied', description: 'Strong support network, fulfilling relationships' },
          { value: 2, label: 'Satisfied', description: 'Good relationships, adequate support' },
          { value: 3, label: 'Neutral', description: 'Average relationships, some support' },
          { value: 4, label: 'Dissatisfied', description: 'Limited support, relationship issues' },
          { value: 5, label: 'Very Dissatisfied', description: 'Poor relationships, little to no support' }
        ]
      },
      {
        id: 'coping_strategies',
        category: 'general_wellbeing',
        text: 'How well do you feel you cope with daily challenges and stress?',
        type: 'scale',
        required: true,
        options: [
          { value: 1, label: 'Very Well', description: 'Excellent coping skills, handle stress effectively' },
          { value: 2, label: 'Well', description: 'Good coping strategies, manage most situations' },
          { value: 3, label: 'Moderately', description: 'Some coping skills, struggle occasionally' },
          { value: 4, label: 'Poorly', description: 'Limited coping skills, often overwhelmed' },
          { value: 5, label: 'Very Poorly', description: 'Poor coping, frequently unable to manage stress' }
        ]
      },
      {
        id: 'mood_changes',
        category: 'general_wellbeing',
        text: 'Have you noticed any significant changes in your mood recently?',
        type: 'multiple_choice',
        required: true,
        options: [
          { value: 'no_changes', label: 'No significant changes', description: 'Mood has been stable' },
          { value: 'more_positive', label: 'More positive than usual', description: 'Feeling happier or more optimistic' },
          { value: 'more_negative', label: 'More negative than usual', description: 'Feeling sadder or more pessimistic' },
          { value: 'mood_swings', label: 'Frequent mood swings', description: 'Emotions changing rapidly' },
          { value: 'emotional_numbness', label: 'Feeling emotionally numb', description: 'Difficulty feeling emotions' }
        ]
      },
      {
        id: 'specific_stressors',
        category: 'general_wellbeing',
        text: 'Please describe any specific stressors or challenges you\'re currently facing:',
        type: 'text',
        required: false,
        placeholder: 'Share what\'s been causing you stress lately... (Optional)',
        maxLength: 500
      }
    ];
  };

  const questions = getQuestions();

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear validation error for this question
    if (validationErrors[questionId]) {
      setValidationErrors(prev => ({
        ...prev,
        [questionId]: null
      }));
    }
  };

  const validateCurrentQuestion = () => {
    const question = currentQuestion;
    const response = responses[question.id];
    
    if (question.required && (!response || response === '')) {
      setValidationErrors(prev => ({
        ...prev,
        [question.id]: 'This question is required'
      }));
      return false;
    }
    
    if (question.type === 'text' && response && question.maxLength && response.length > question.maxLength) {
      setValidationErrors(prev => ({
        ...prev,
        [question.id]: `Response must be ${question.maxLength} characters or less`
      }));
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateCurrentQuestion()) {
      if (isLastQuestion) {
        handleSubmit();
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateAssessmentScore = () => {
    let totalScore = 0;
    let maxScore = 0;
    const categoryScores = {};

    questions.forEach(question => {
      const response = responses[question.id];
      if (response && question.type === 'scale') {
        const score = parseInt(response);
        totalScore += score;
        maxScore += 5; // Max score per scale question
        
        // Category scoring
        if (!categoryScores[question.category]) {
          categoryScores[question.category] = { score: 0, count: 0 };
        }
        categoryScores[question.category].score += score;
        categoryScores[question.category].count += 1;
      }
    });

    // Calculate percentage score (higher score = higher stress)
    const percentageScore = Math.round((totalScore / maxScore) * 100);
    
    // Calculate category averages
    Object.keys(categoryScores).forEach(category => {
      categoryScores[category] = Math.round(
        (categoryScores[category].score / categoryScores[category].count / 5) * 100
      );
    });

    // Determine stress level
    let stressLevel = 'low';
    if (percentageScore >= 70) stressLevel = 'high';
    else if (percentageScore >= 50) stressLevel = 'moderate';

    return {
      overallScore: percentageScore,
      stressLevel,
      categoryScores,
      totalQuestions: questions.length,
      answeredQuestions: Object.keys(responses).length
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const assessmentResults = calculateAssessmentScore();
      
      const assessmentData = {
        type: assessmentType,
        responses: responses,
        results: assessmentResults,
        completedAt: new Date().toISOString(),
        userId: user?.id
      };

      // Call the completion callback
      if (onComplete) {
        await onComplete(assessmentData);
      }
      
      toast.success('Assessment completed successfully!');
      
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    const question = currentQuestion;
    const response = responses[question.id];
    const error = validationErrors[question.id];

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {question.text}
          </h4>

          {question.type === 'scale' && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={response === option.value.toString()}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {question.type === 'multiple_choice' && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={response === option.value}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {question.type === 'text' && (
            <div>
              <textarea
                value={response || ''}
                onChange={(e) => handleResponse(question.id, e.target.value)}
                placeholder={question.placeholder}
                maxLength={question.maxLength}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
              />
              {question.maxLength && (
                <div className="text-sm text-gray-500 mt-1">
                  {(response || '').length} / {question.maxLength} characters
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isFirstQuestion 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : isLastQuestion ? (
              <>
                Complete Assessment
                <CheckCircleIcon className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Assessment Guidelines</p>
            <p>Please answer all questions honestly. There are no right or wrong answers. 
            Your responses will help us provide personalized insights and recommendations.</p>
          </div>
        </div>
      </div>

      {renderQuestion()}

      {onCancel && (
        <div className="mt-6 text-center">
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Cancel Assessment
          </button>
        </div>
      )}
    </div>
  );
};

export default AssessmentForm;

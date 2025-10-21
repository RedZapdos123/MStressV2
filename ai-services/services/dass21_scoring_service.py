"""
DASS-21 Scoring Service
Implements the Depression Anxiety Stress Scale (DASS-21) scoring algorithm
for 20 MCQ questions based on the standard DASS-21 assessment.
"""

from typing import List, Dict, Tuple
import numpy as np


class DASS21ScoringService:
    """
    Implements DASS-21 scoring for questionnaire responses.
    Calculates Depression, Anxiety, and Stress subscales with severity ratings.
    """
    
    # DASS-21 question mapping (20 questions)
    # Format: (question_index, subscale, weight)
    QUESTION_MAPPING = {
        0: ('depression', 1),      # Q1: I found it hard to wind down
        1: ('anxiety', 1),         # Q2: I was aware of dryness of my mouth
        2: ('stress', 1),          # Q3: I couldn't seem to experience any positive feeling
        3: ('depression', 1),      # Q4: I experienced breathing difficulty
        4: ('anxiety', 1),         # Q5: I found it difficult to work up the initiative
        5: ('stress', 1),          # Q6: I tended to over-react to situations
        6: ('depression', 1),      # Q7: I experienced trembling
        7: ('anxiety', 1),         # Q8: I was worried about situations
        8: ('stress', 1),          # Q9: I found it hard to calm down after something upset me
        9: ('depression', 1),      # Q10: I felt that I was using a lot of nervous energy
        10: ('anxiety', 1),        # Q11: I was sad and depressed
        11: ('stress', 1),         # Q12: I was intolerant of anything that kept me from my task
        12: ('depression', 1),     # Q13: I felt I was close to panic
        13: ('anxiety', 1),        # Q14: I was unable to become enthusiastic about anything
        14: ('stress', 1),         # Q15: I felt I wasn't worth much as a person
        15: ('depression', 1),     # Q16: I felt that I was rather touchy
        16: ('anxiety', 1),        # Q17: I was aware of the action of my heart
        17: ('stress', 1),         # Q18: I felt scared without any good reason
        18: ('depression', 1),     # Q19: I felt that life was meaningless
        19: ('anxiety', 1),        # Q20: I found it hard to wind down
    }
    
    # DASS-21 Severity Thresholds (for 20-item version)
    SEVERITY_THRESHOLDS = {
        'depression': {
            'normal': (0, 9),
            'mild': (10, 13),
            'moderate': (14, 20),
            'severe': (21, 27),
            'extremely_severe': (28, 42)
        },
        'anxiety': {
            'normal': (0, 7),
            'mild': (8, 9),
            'moderate': (10, 14),
            'severe': (15, 19),
            'extremely_severe': (20, 42)
        },
        'stress': {
            'normal': (0, 14),
            'mild': (15, 18),
            'moderate': (19, 25),
            'severe': (26, 33),
            'extremely_severe': (34, 42)
        }
    }
    
    def __init__(self):
        """Initialize the DASS-21 scoring service"""
        self.total_questions = 20
    
    def score_assessment(self, responses: List[int]) -> Dict:
        """
        Score a DASS-21 assessment based on questionnaire responses.
        
        Args:
            responses: List of 20 integer responses (0-3 scale)
                      0 = Did not apply, 1 = Applied sometimes, 
                      2 = Applied often, 3 = Applied very much
        
        Returns:
            Dictionary with depression, anxiety, stress scores and severity ratings
        """
        if len(responses) != self.total_questions:
            raise ValueError(f"Expected {self.total_questions} responses, got {len(responses)}")
        
        # Validate response values
        for i, response in enumerate(responses):
            if not isinstance(response, (int, float)) or response < 0 or response > 3:
                raise ValueError(f"Response {i} must be between 0-3, got {response}")
        
        # Calculate subscale scores
        depression_score = self._calculate_subscale_score(responses, 'depression')
        anxiety_score = self._calculate_subscale_score(responses, 'anxiety')
        stress_score = self._calculate_subscale_score(responses, 'stress')
        
        # Get severity ratings
        depression_severity = self._get_severity(depression_score, 'depression')
        anxiety_severity = self._get_severity(anxiety_score, 'anxiety')
        stress_severity = self._get_severity(stress_score, 'stress')
        
        # Calculate overall stress level
        overall_score = (depression_score + anxiety_score + stress_score) / 3
        overall_severity = self._get_overall_severity(overall_score)
        
        return {
            'depression': {
                'score': int(depression_score),
                'severity': depression_severity,
                'percentage': round((depression_score / 42) * 100, 1)
            },
            'anxiety': {
                'score': int(anxiety_score),
                'severity': anxiety_severity,
                'percentage': round((anxiety_score / 42) * 100, 1)
            },
            'stress': {
                'score': int(stress_score),
                'severity': stress_severity,
                'percentage': round((stress_score / 42) * 100, 1)
            },
            'overall': {
                'score': round(overall_score, 1),
                'severity': overall_severity,
                'percentage': round((overall_score / 42) * 100, 1)
            },
            'interpretation': self._get_interpretation(depression_score, anxiety_score, stress_score),
            'recommendations': self._get_recommendations(depression_score, anxiety_score, stress_score)
        }
    
    def _calculate_subscale_score(self, responses: List[int], subscale: str) -> float:
        """Calculate score for a specific subscale (depression, anxiety, or stress)"""
        score = 0
        count = 0
        
        for question_idx, (sub, weight) in self.QUESTION_MAPPING.items():
            if sub == subscale:
                score += responses[question_idx] * weight
                count += 1
        
        # DASS-21 uses a multiplier of 2 for the 21-item version
        # For 20-item version, we scale appropriately
        return score * 2 if count > 0 else 0
    
    def _get_severity(self, score: float, subscale: str) -> str:
        """Get severity rating for a subscale score"""
        thresholds = self.SEVERITY_THRESHOLDS[subscale]
        
        for severity, (min_val, max_val) in thresholds.items():
            if min_val <= score <= max_val:
                return severity
        
        return 'extremely_severe'
    
    def _get_overall_severity(self, overall_score: float) -> str:
        """Get overall severity rating"""
        if overall_score <= 10:
            return 'normal'
        elif overall_score <= 13:
            return 'mild'
        elif overall_score <= 20:
            return 'moderate'
        elif overall_score <= 27:
            return 'severe'
        else:
            return 'extremely_severe'
    
    def _get_interpretation(self, depression: float, anxiety: float, stress: float) -> str:
        """Get interpretation of the assessment results"""
        highest = max(depression, anxiety, stress)
        
        if highest <= 9:
            return "Your mental health appears to be within normal range. Continue maintaining healthy habits."
        elif highest <= 13:
            return "You may be experiencing mild symptoms. Consider stress management techniques."
        elif highest <= 20:
            return "You may be experiencing moderate symptoms. Professional support is recommended."
        elif highest <= 27:
            return "You may be experiencing severe symptoms. Please seek professional help."
        else:
            return "You may be experiencing extremely severe symptoms. Immediate professional support is strongly recommended."
    
    def _get_recommendations(self, depression: float, anxiety: float, stress: float) -> List[str]:
        """Get personalized recommendations based on scores"""
        recommendations = []
        
        if depression > 13:
            recommendations.append("Consider speaking with a mental health professional about depression symptoms")
            recommendations.append("Engage in regular physical activity and maintain social connections")
        
        if anxiety > 9:
            recommendations.append("Practice relaxation techniques such as deep breathing or meditation")
            recommendations.append("Limit caffeine intake and maintain regular sleep schedule")
        
        if stress > 18:
            recommendations.append("Identify and address major sources of stress in your life")
            recommendations.append("Practice time management and set realistic goals")
        
        if not recommendations:
            recommendations.append("Maintain your current healthy lifestyle and coping strategies")
            recommendations.append("Continue regular self-care and stress management practices")
        
        return recommendations


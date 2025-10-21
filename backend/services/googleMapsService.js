const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Search for nearby mental health resources using Google Maps Places API
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @returns {Promise<Object>} Array of nearby mental health resources
 */
async function getNearbyMentalHealthResources(latitude, longitude) {
  try {
    if (!latitude || !longitude) {
      return getFallbackResources();
    }

    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key') {
      return getFallbackResources();
    }

    const searchQueries = [
      'mental health clinic',
      'therapist',
      'counseling center',
      'psychiatric hospital',
      'psychologist'
    ];

    const allResources = [];
    const seenPlaces = new Set();

    // Search for each type of mental health resource
    for (const query of searchQueries) {
      try {
        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
          {
            params: {
              location: `${latitude},${longitude}`,
              radius: 5000, // 5km radius
              keyword: query,
              key: GOOGLE_MAPS_API_KEY,
              type: 'health'
            }
          }
        );

        if (response.data.results) {
          for (const place of response.data.results) {
            if (!seenPlaces.has(place.place_id)) {
              seenPlaces.add(place.place_id);
              allResources.push({
                placeId: place.place_id,
                name: place.name,
                address: place.vicinity,
                rating: place.rating || null,
                userRatingsTotal: place.user_ratings_total || 0,
                distance: calculateDistance(
                  latitude,
                  longitude,
                  place.geometry.location.lat,
                  place.geometry.location.lng
                ),
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
                openNow: place.opening_hours?.open_now || null,
                types: place.types || [],
                icon: place.icon || null
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Error searching for "${query}":`, error.message);
      }
    }

    // Sort by distance and return top 10
    const sortedResources = allResources
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
      .slice(0, 10);

    return {
      success: true,
      resources: sortedResources,
      emergencyHotlines: getEmergencyHotlines(),
      source: 'google_maps'
    };
  } catch (error) {
    console.error('Error in getNearbyMentalHealthResources:', error.message);
    return getFallbackResources();
  }
}

/**
 * Get emergency mental health hotlines
 */
function getEmergencyHotlines() {
  return [
    {
      name: 'National Suicide Prevention Lifeline',
      number: '988',
      description: 'Free, confidential support 24/7',
      available: '24/7'
    },
    {
      name: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      description: 'Text-based crisis support',
      available: '24/7'
    },
    {
      name: 'SAMHSA National Helpline',
      number: '1-800-662-4357',
      description: 'Free, confidential, 24/7 treatment referral and information service',
      available: '24/7'
    },
    {
      name: 'International Association for Suicide Prevention',
      number: 'https://www.iasp.info/resources/Crisis_Centres/',
      description: 'Global crisis center directory',
      available: '24/7'
    }
  ];
}

/**
 * Fallback resources when Google Maps API is unavailable
 */
function getFallbackResources() {
  return {
    success: true,
    resources: [
      {
        name: 'Local Mental Health Clinic',
        address: 'Contact your local healthcare provider',
        rating: null,
        distance: null,
        openNow: null,
        types: ['health', 'mental_health_clinic']
      },
      {
        name: 'Community Counseling Center',
        address: 'Check your local community resources',
        rating: null,
        distance: null,
        openNow: null,
        types: ['health', 'counseling']
      }
    ],
    emergencyHotlines: getEmergencyHotlines(),
    source: 'fallback'
  };
}

/**
 * Calculate distance between two coordinates (in km)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

module.exports = {
  getNearbyMentalHealthResources,
  getEmergencyHotlines
};


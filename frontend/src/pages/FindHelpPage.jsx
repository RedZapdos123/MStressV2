import React, { useState, useEffect } from 'react';
import { MapPinIcon, PhoneIcon, StarIcon, ClockIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../App';
import axios from 'axios';
import toast from 'react-hot-toast';

const FindHelpPage = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5000); // 5km default

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        fetchNearbyClinics(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Unable to retrieve your location. Please enable location services.');
        setLoading(false);
        // Use default location (Delhi, India) as fallback.
        const defaultLocation = { latitude: 28.6139, longitude: 77.2090 };
        setLocation(defaultLocation);
        fetchNearbyClinics(defaultLocation.latitude, defaultLocation.longitude);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const fetchNearbyClinics = async (latitude, longitude) => {
    try {
      const response = await axios.get('/api/maps/nearby-clinics', {
        params: {
          latitude,
          longitude,
          radius: searchRadius
        }
      });

      if (response.data.success) {
        setClinics(response.data.clinics || []);
      } else {
        toast.error('Failed to fetch nearby clinics');
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
      toast.error('Unable to load nearby mental health facilities');
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius);
    if (location) {
      setLoading(true);
      fetchNearbyClinics(location.latitude, location.longitude);
    }
  };

  const openInMaps = (clinic) => {
    const query = encodeURIComponent(`${clinic.name} ${clinic.address}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapsUrl, '_blank');
  };

  const callClinic = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<StarIcon key="half" className="h-4 w-4 text-yellow-400 fill-current opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        /* Header. */
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Mental Health Support
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Locate nearby mental health clinics, hospitals, and therapists in your area. 
            Professional help is available when you need it.
          </p>
        </div>

        /* Location Status. */
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Location</h2>
            <button
              onClick={getCurrentLocation}
              className="btn-secondary text-sm"
              disabled={loading}
            >
              {loading ? 'Locating...' : 'Refresh Location'}
            </button>
          </div>

          {locationError ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800">{locationError}</p>
              </div>
              <p className="text-yellow-700 text-sm mt-2">
                Showing results for Delhi, India as default location.
              </p>
            </div>
          ) : location ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-800">
                  Location found: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-blue-800">Getting your location...</p>
              </div>
            </div>
          )}

          /* Search Radius Selector. */
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Radius
            </label>
            <select
              value={searchRadius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value={2000}>2 km</option>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
              <option value={20000}>20 km</option>
              <option value={50000}>50 km</option>
            </select>
          </div>
        </div>

        /* Emergency Contacts. */
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-red-900 mb-4">Emergency Mental Health Support</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-red-900">KIRAN National Helpline</h4>
              <p className="text-red-700 text-sm">24/7 Mental Health Support</p>
              <button
                onClick={() => callClinic('1800-599-0019')}
                className="mt-2 inline-flex items-center text-red-600 hover:text-red-700"
              >
                <PhoneIcon className="h-4 w-4 mr-1" />
                1800-599-0019
              </button>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-red-900">Vandrevala Foundation</h4>
              <p className="text-red-700 text-sm">24/7 Confidential Support</p>
              <button
                onClick={() => callClinic('9999666555')}
                className="mt-2 inline-flex items-center text-red-600 hover:text-red-700"
              >
                <PhoneIcon className="h-4 w-4 mr-1" />
                9999 666 555
              </button>
            </div>
          </div>
        </div>

        /* Nearby Clinics. */
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Nearby Mental Health Facilities
            </h2>
            <span className="text-sm text-gray-500">
              {clinics.length} facilities found
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Finding nearby mental health facilities...</p>
            </div>
          ) : clinics.length > 0 ? (
            <div className="space-y-6">
              {clinics.map((clinic) => (
                <div key={clinic.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{clinic.name}</h3>
                      <div className="flex items-center mt-1">
                        {getRatingStars(clinic.rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          {clinic.rating} ({clinic.userRatingsTotal || 0} reviews) • {clinic.distance}
                        </span>
                      </div>
                      {clinic.isOpen !== undefined && (
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            clinic.isOpen
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {clinic.isOpen ? 'Open Now' : 'Closed'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {clinic.distance}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-600 flex items-start">
                      <MapPinIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                      {clinic.address}
                    </p>
                  </div>

                  {clinic.specialties && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Specialties:</p>
                      <div className="flex flex-wrap gap-2">
                        {clinic.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => openInMaps(clinic)}
                      className="btn-primary flex items-center justify-center"
                    >
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Get Directions
                    </button>
                    {clinic.phone && (
                      <button
                        onClick={() => callClinic(clinic.phone)}
                        className="btn-secondary flex items-center justify-center"
                      >
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        Call Now
                      </button>
                    )}
                    {clinic.website && (
                      <button
                        onClick={() => window.open(clinic.website, '_blank')}
                        className="btn-secondary flex items-center justify-center"
                      >
                        <GlobeAltIcon className="h-4 w-4 mr-2" />
                        Website
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPinIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No mental health facilities found in your area.</p>
              <p className="text-sm text-gray-400 mt-2">
                Try increasing the search radius or contact the emergency helplines above.
              </p>
            </div>
          )}
        </div>

        /* Additional Resources. */
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Online Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="https://www.nimhans.ac.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center">
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    NIMHANS - National Institute of Mental Health
                  </a>
                </li>
                <li>
                  <a href="https://www.thelivelovelaughfoundation.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center">
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    Live Love Laugh Foundation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Crisis Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>iCall Psychosocial Helpline: 9152987821</li>
                <li>Sneha India: 044-24640050</li>
                <li>Sumaitri: 011-23389090</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindHelpPage;

import React, { useState, useEffect, useRef } from 'react';
import { MapPinIcon, PhoneIcon, StarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const NearbyResourcesMap = ({ latitude, longitude, resources = [] }) => {
  const [selectedResource, setSelectedResource] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: latitude, lng: longitude });
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Request user's geolocation if not provided
  useEffect(() => {
    if (!latitude || !longitude) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.warn('Geolocation error:', error);
            toast.error('Unable to get your location. Using default location.');
          }
        );
      }
    }
  }, [latitude, longitude]);

  // Initialize Google Map (only once)
  useEffect(() => {
    if (!window.google || !userLocation.lat || !userLocation.lng) {
      return;
    }

    if (!mapRef.current) return;

    // Only create map if it doesn't exist
    if (mapInstanceRef.current) {
      setMapLoaded(true);
      return;
    }

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: userLocation.lat, lng: userLocation.lng },
        styles: [
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#616161' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
          }
        ]
      });

      mapInstanceRef.current = map;
      setMapLoaded(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    // Cleanup function
    return () => {
      // Don't destroy the map, just leave it as is
      // Destroying it can cause issues with Google Maps library
    };
  }, [userLocation]);

  // Add markers when resources change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) {
      console.log('Map not ready for markers');
      return;
    }

    const map = mapInstanceRef.current;
    console.log('Adding markers to map, resources count:', resources.length);

    try {
      // Add user location marker
      if (userLocation.lat && userLocation.lng) {
        new window.google.maps.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map: map,
          title: 'Your Location',
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });
      }

      // Add resource markers
      resources.forEach((resource, index) => {
        if (resource.lat && resource.lng) {
          const marker = new window.google.maps.Marker({
            position: { lat: resource.lat, lng: resource.lng },
            map: map,
            title: resource.name,
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          });

          // Create info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${resource.name}</h3>
                <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">${resource.address}</p>
                ${resource.distance ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280;"><strong>Distance:</strong> ${resource.distance} km</p>` : ''}
                ${resource.rating ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280;"><strong>Rating:</strong> ${resource.rating} ⭐</p>` : ''}
                ${resource.openNow !== null ? `<p style="margin: 4px 0; font-size: 12px; color: ${resource.openNow ? '#10b981' : '#ef4444'};"><strong>${resource.openNow ? 'Open Now' : 'Closed'}</strong></p>` : ''}
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
            setSelectedResource(resource);
          });
        }
      });
      console.log('Markers added successfully');
    } catch (error) {
      console.error('Error adding markers:', error);
    }
  }, [resources, userLocation]);

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="rounded-lg overflow-hidden shadow-md border border-gray-200">
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '400px',
            backgroundColor: '#f3f4f6',
            position: 'relative'
          }}
        >
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resources List */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Nearby Mental Health Resources</h4>
        {resources && resources.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {resources.map((resource, index) => (
              <div
                key={index}
                onClick={() => setSelectedResource(resource)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedResource?.placeId === resource.placeId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm">{resource.name}</h5>
                    <div className="flex items-center text-gray-600 text-xs mt-1">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      <span>{resource.address}</span>
                    </div>
                    {resource.distance && (
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Distance:</strong> {resource.distance} km
                      </p>
                    )}
                  </div>
                  {resource.rating && (
                    <div className="flex items-center ml-2">
                      <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-medium text-gray-700 ml-1">
                        {resource.rating}
                      </span>
                    </div>
                  )}
                </div>
                {resource.openNow !== null && (
                  <div className="mt-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        resource.openNow
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {resource.openNow ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No nearby resources found. Please check emergency hotlines below.</p>
        )}
      </div>
    </div>
  );
};

export default NearbyResourcesMap;


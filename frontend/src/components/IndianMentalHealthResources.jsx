import React, { useState } from 'react';
import {
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const IndianMentalHealthResources = ({ variant = 'full', className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const emergencyHelplines = [
    {
      name: 'KIRAN Mental Health Helpline',
      phone: '1800-599-0019',
      description: '24/7 toll-free mental health rehabilitation helpline',
      availability: '24/7',
      languages: 'Hindi, English, and 13 regional languages'
    },
    {
      name: 'Vandrevala Foundation',
      phone: '9999 666 555',
      email: 'help@vandrevalafoundation.com',
      description: 'Crisis intervention and emotional support',
      availability: '24/7',
      languages: 'Hindi, English, Tamil, Telugu'
    },
    {
      name: 'Aasra Suicide Prevention',
      phone: '91-22-27546669',
      email: 'aasrahelpline@yahoo.com',
      description: 'Suicide prevention and crisis intervention',
      availability: '24/7',
      languages: 'Hindi, English, Marathi'
    },
    {
      name: 'Connecting Trust',
      phone: '022-25521111',
      description: 'Emotional support and counseling',
      availability: '12 PM - 8 PM',
      languages: 'English, Hindi'
    }
  ];

  const mentalHealthOrganizations = [
    {
      name: 'NIMHANS (National Institute of Mental Health and Neurosciences)',
      website: 'https://nimhans.ac.in',
      description: 'Premier mental health institute in India',
      services: 'Treatment, research, training in mental health'
    },
    {
      name: 'Indian Psychiatric Society',
      website: 'https://indianpsychiatricsociety.org',
      description: 'Professional body of psychiatrists in India',
      services: 'Professional resources, mental health awareness'
    },
    {
      name: 'Mental Health Foundation of India',
      website: 'https://mentalhealthfoundationindia.com',
      description: 'Mental health advocacy and support',
      services: 'Awareness programs, support groups'
    },
    {
      name: 'The Live Love Laugh Foundation',
      website: 'https://www.thelivelovelaughfoundation.org',
      description: 'Mental health awareness and support',
      services: 'Awareness, support, research funding'
    }
  ];

  const additionalResources = [
    {
      name: 'iCall Psychosocial Helpline',
      phone: '9152987821',
      description: 'Psychosocial support and counseling',
      availability: '8 AM - 10 PM'
    },
    {
      name: 'Sneha India',
      phone: '044-24640050',
      description: 'Suicide prevention and emotional support',
      availability: '24/7'
    },
    {
      name: 'Sumaitri',
      phone: '011-23389090',
      description: 'Emotional support and befriending',
      availability: '3 PM - 9 PM'
    }
  ];

  if (variant === 'compact') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-800 mb-2">Emergency Mental Health Support</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 text-red-600 mr-2" />
                <span className="font-medium">KIRAN:</span>
                <a href="tel:18005990019" className="ml-1 text-red-700 hover:text-red-900 font-semibold">
                  1800-599-0019
                </a>
                <span className="ml-2 text-red-600">(24/7)</span>
              </div>
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 text-red-600 mr-2" />
                <span className="font-medium">Vandrevala:</span>
                <a href="tel:9999666555" className="ml-1 text-red-700 hover:text-red-900 font-semibold">
                  9999 666 555
                </a>
                <span className="ml-2 text-red-600">(24/7)</span>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-sm text-red-700 hover:text-red-900 flex items-center"
            >
              {isExpanded ? 'Show less' : 'View all resources'}
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              )}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-red-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyHelplines.slice(2).map((helpline, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-red-800">{helpline.name}</div>
                  <div className="flex items-center mt-1">
                    <PhoneIcon className="h-3 w-3 text-red-600 mr-1" />
                    <a href={`tel:${helpline.phone.replace(/\s/g, '')}`} className="text-red-700 hover:text-red-900">
                      {helpline.phone}
                    </a>
                  </div>
                  {helpline.email && (
                    <div className="flex items-center mt-1">
                      <EnvelopeIcon className="h-3 w-3 text-red-600 mr-1" />
                      <a href={`mailto:${helpline.email}`} className="text-red-700 hover:text-red-900 text-xs">
                        {helpline.email}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
        <h3 className="text-lg font-semibold text-red-800">Indian Mental Health Emergency Resources</h3>
      </div>

      {/* Emergency Helplines */}
      <div className="mb-6">
        <h4 className="font-semibold text-red-700 mb-3 flex items-center">
          <PhoneIcon className="h-5 w-5 mr-2" />
          24/7 Emergency Helplines
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyHelplines.map((helpline, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-red-100">
              <div className="font-medium text-gray-900 mb-1">{helpline.name}</div>
              <div className="flex items-center mb-2">
                <PhoneIcon className="h-4 w-4 text-red-600 mr-2" />
                <a 
                  href={`tel:${helpline.phone.replace(/\s/g, '')}`} 
                  className="text-red-700 hover:text-red-900 font-semibold text-lg"
                >
                  {helpline.phone}
                </a>
              </div>
              {helpline.email && (
                <div className="flex items-center mb-2">
                  <EnvelopeIcon className="h-4 w-4 text-red-600 mr-2" />
                  <a 
                    href={`mailto:${helpline.email}`} 
                    className="text-red-700 hover:text-red-900 text-sm"
                  >
                    {helpline.email}
                  </a>
                </div>
              )}
              <div className="text-sm text-gray-600 mb-1">{helpline.description}</div>
              <div className="text-xs text-gray-500">
                <span className="font-medium">Available:</span> {helpline.availability}
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-medium">Languages:</span> {helpline.languages}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mental Health Organizations */}
      <div className="mb-6">
        <h4 className="font-semibold text-red-700 mb-3 flex items-center">
          <GlobeAltIcon className="h-5 w-5 mr-2" />
          Mental Health Organizations
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentalHealthOrganizations.map((org, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-red-100">
              <div className="font-medium text-gray-900 mb-1">{org.name}</div>
              <div className="flex items-center mb-2">
                <GlobeAltIcon className="h-4 w-4 text-blue-600 mr-2" />
                <a 
                  href={org.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-900 text-sm"
                >
                  Visit Website
                </a>
              </div>
              <div className="text-sm text-gray-600 mb-1">{org.description}</div>
              <div className="text-xs text-gray-500">
                <span className="font-medium">Services:</span> {org.services}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div>
        <h4 className="font-semibold text-red-700 mb-3 flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-2" />
          Additional Support Services
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {additionalResources.map((resource, index) => (
            <div key={index} className="bg-white rounded-lg p-3 border border-red-100">
              <div className="font-medium text-gray-900 text-sm mb-1">{resource.name}</div>
              <div className="flex items-center mb-1">
                <PhoneIcon className="h-3 w-3 text-red-600 mr-1" />
                <a 
                  href={`tel:${resource.phone.replace(/\s/g, '')}`} 
                  className="text-red-700 hover:text-red-900 text-sm font-medium"
                >
                  {resource.phone}
                </a>
              </div>
              <div className="text-xs text-gray-600 mb-1">{resource.description}</div>
              <div className="text-xs text-gray-500">
                <span className="font-medium">Available:</span> {resource.availability}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <span className="font-medium">Important:</span> If you're experiencing a mental health emergency, 
            please call one of the helplines above immediately or visit your nearest hospital emergency department. 
            These resources are available 24/7 and provide confidential support.
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndianMentalHealthResources;

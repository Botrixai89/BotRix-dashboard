'use client';

import { useState, useEffect } from 'react';

interface EnvStatus {
  status: 'success' | 'warning' | 'error';
  missingCritical: string[];
  missingGoogle: string[];
  message: string;
}

export default function EnvironmentStatus() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        const response = await fetch('/api/env-check');
        const data = await response.json();
        setEnvStatus(data);
      } catch (error) {
        console.error('Failed to check environment:', error);
        setEnvStatus({
          status: 'error',
          missingCritical: ['API_ENDPOINT'],
          missingGoogle: [],
          message: 'Failed to check environment configuration'
        });
      } finally {
        setLoading(false);
      }
    };

    checkEnvironment();
  }, []);

  if (loading) {
    return (
      <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
        Checking environment configuration...
      </div>
    );
  }

  if (!envStatus || envStatus.status === 'success') {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'error':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      default:
        return 'bg-blue-100 border-blue-400 text-blue-700';
    }
  };

  return (
    <div className={`fixed top-4 right-4 border px-4 py-3 rounded max-w-md ${getStatusColor(envStatus.status)}`}>
      <div className="font-bold mb-2">
        {envStatus.status === 'error' ? '⚠️ Configuration Error' : '⚠️ Configuration Warning'}
      </div>
      <div className="text-sm mb-2">{envStatus.message}</div>
      
      {envStatus.missingCritical.length > 0 && (
        <div className="mb-2">
          <div className="font-semibold text-sm">Critical Missing:</div>
          <ul className="text-xs list-disc list-inside">
            {envStatus.missingCritical.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {envStatus.missingGoogle.length > 0 && (
        <div>
          <div className="font-semibold text-sm">Google OAuth Missing:</div>
          <ul className="text-xs list-disc list-inside">
            {envStatus.missingGoogle.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-3 text-xs">
        <a 
          href="/SETUP.md" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          View Setup Guide
        </a>
      </div>
    </div>
  );
}

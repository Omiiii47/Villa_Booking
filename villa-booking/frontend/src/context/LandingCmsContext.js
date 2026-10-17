'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getLanding } from '../services/cmsService';

const CACHE_KEY = 'solscapeLandingCms';

const LandingCmsContext = createContext(null);

export const useLandingCms = () => useContext(LandingCmsContext);

export const LandingCmsProvider = ({ children }) => {
  const [landing, setLanding] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    getLanding()
      .then((d) => {
        setLanding(d);
        setLoading(false);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => { setLoading(false); });
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setLanding(JSON.parse(cached));
        setLoading(false);
      }
    } catch {}
    refetch();
  }, [refetch]);

  return (
    <LandingCmsContext.Provider value={{ landing, loading, refetch }}>
      {children}
    </LandingCmsContext.Provider>
  );
};

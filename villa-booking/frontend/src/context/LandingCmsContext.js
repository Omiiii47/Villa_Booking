'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getLanding } from '../services/cmsService';

const LandingCmsContext = createContext(null);

export const useLandingCms = () => useContext(LandingCmsContext);

export const LandingCmsProvider = ({ children }) => {
  const [landing, setLanding] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    getLanding()
      .then((d) => { setLanding(d); setLoading(false); })
      .catch(() => { setLanding(null); setLoading(false); });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <LandingCmsContext.Provider value={{ landing, loading, refetch }}>
      {children}
    </LandingCmsContext.Provider>
  );
};

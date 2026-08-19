'use client';
import React, { useState, useEffect } from 'react';
import { usePOSTerminal } from './hooks/usePOSTerminal';
import POSTerminalLandscape from './POSTerminalLandscape';
import POSTerminalPortrait from './POSTerminalPortrait';
// Keep types and context imports

export default function POSTerminal(props: POSTerminalProps) {
  const state = usePOSTerminal(props);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    setIsPortrait(mediaQuery.matches);

    const handleOrientationChange = (e: MediaQueryListEvent) => {
      setIsPortrait(e.matches);
    };

    mediaQuery.addEventListener('change', handleOrientationChange);
    return () => mediaQuery.removeEventListener('change', handleOrientationChange);
  }, []);

  if (isPortrait) {
    return <POSTerminalPortrait state={state} props={props} />;
  }

  return <POSTerminalLandscape state={state} props={props} />;
}

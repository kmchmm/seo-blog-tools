import { useContext } from 'react';
import { Context as SB37ProgressContext } from '../context/SB37ProgressContext';

const useSB37AnalysisContext = () => {
  const context = useContext(SB37ProgressContext);
  if (!context) {
    throw new Error('useSB37AnalysisContext must be used within a BatchProgressProvider');
  }
  return context;
};

export default useSB37AnalysisContext;

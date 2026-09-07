import useExploreParallax from '../hooks/useExploreParallax.js';
import useReportRoot from '../hooks/useReportRoot.js';

const ExploreSection = ({ children }) => {
  const rootRef = useReportRoot();
  useExploreParallax(rootRef);
  return children;
};

export default ExploreSection;

import useHeroVideo from '../hooks/useHeroVideo.js';
import useReportRoot from '../hooks/useReportRoot.js';

const HeroSection = ({ children }) => {
  const rootRef = useReportRoot();
  useHeroVideo(rootRef);
  return children;
};

export default HeroSection;

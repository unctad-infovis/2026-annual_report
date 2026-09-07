import useDonorChart from '../hooks/useDonorChart.js';
import useImpactAnimations from '../hooks/useImpactAnimations.js';
import useReportRoot from '../hooks/useReportRoot.js';

export const ProjectsSection = ({ children }) => {
  const rootRef = useReportRoot();
  useImpactAnimations(rootRef);
  return children;
};
export const DonorsSection = ({ children, groups, total }) => {
  const rootRef = useReportRoot();
  useDonorChart(groups, total, rootRef);
  return children;
};
export const CommunicationsSection = ({ children }) => children;

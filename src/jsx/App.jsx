import BackToTop from '@unctad-infovis/general-tools/components/BackToTop.jsx';
import '@unctad-infovis/general-tools/styles/colors.css';
import { useEffect, useRef } from 'react';

import Article from '../Article.mdx';
import '../styles/index.css';
import ExploreSection from './components/ExploreSection.jsx';
import HeroSection from './components/HeroSection.jsx';
import { CommunicationsSection, DonorsSection, ProjectsSection } from './components/ImpactSections.jsx';
import { AtAGlanceSection, KeyMomentsSection, Unctad16Section } from './components/InstitutionalSections.jsx';
import OverviewSection from './components/OverviewSection.jsx';
import useAnnualReportInteractions from './hooks/useAnnualReportInteractions.js';
import { ReportRootContext } from './hooks/useReportRoot.js';

const components = {
  BackToTop,
  AtAGlanceSection,
  CommunicationsSection,
  DonorsSection,
  ExploreSection,
  HeroSection,
  KeyMomentsSection,
  OverviewSection,
  ProjectsSection,
  Unctad16Section,
};

const App = () => {
  const appRef = useRef(null);
  useAnnualReportInteractions(appRef);

  useEffect(() => {
    const previousRef = window.appRef;
    const hadRef = Object.hasOwn(window, 'appRef');
    window.appRef = appRef;
    return () => {
      if (window.appRef === appRef) {
        if (hadRef) window.appRef = previousRef;
        else delete window.appRef;
      }
    };
  }, []);

  return (
    <div className="annual-report-app app" ref={appRef}>
      <ReportRootContext.Provider value={appRef}>
        <Article components={components} />
      </ReportRootContext.Provider>
    </div>
  );
};

export default App;

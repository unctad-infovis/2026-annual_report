import UNCTADSiteHeader from '@unctad-infovis/general-tools/components/UNCTADSiteHeader.jsx';
import { createRoot } from 'react-dom/client';

import meta from './../meta.json';
import App from './App.jsx';

const showSiteHeader = meta.show_site_header && !window.location.hostname.includes('unctad.org');
const container = document.getElementById(`app-root-${__PROJECT_NAME__}`);
const root = createRoot(container);
root.render(
  showSiteHeader ? (
    <UNCTADSiteHeader>
      <App />
    </UNCTADSiteHeader>
  ) : (
    <App />
  ),
);

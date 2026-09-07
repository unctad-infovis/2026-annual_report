import { getIconUrl } from '@unctad-infovis/unctad-icons';

const SectionLabel = ({ children }) => (
  <div className="ar-eyebrow">
    <span
      aria-hidden="true"
      className="ar-icon-arrow ar-icon-arrow--text"
      style={{ '--ar-shared-arrow': `url(${getIconUrl('arrow_yellow.png')})` }}
    />
    {children}
  </div>
);

export default SectionLabel;

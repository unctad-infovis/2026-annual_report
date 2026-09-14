import { getIconUrl } from '@unctad-infovis/unctad-icons';

const ChevronIcon = ({ className = '' }) => (
  <span
    aria-hidden="true"
    className={`ar-icon-arrow ar-icon-arrow--text ${className}`.trim()}
    style={{ '--ar-shared-arrow': `url(${getIconUrl('arrow_yellow.png')})` }}
  />
);

export default ChevronIcon;

import SectionLabel from './SectionLabel.jsx';

const SectionHeading = ({ id, label, title }) => (
  <div className="ar-section-head">
    <SectionLabel>{label}</SectionLabel>
    <h2 id={id}>{title}</h2>
  </div>
);

export default SectionHeading;

const ReportSection = ({ id, className, children, tabIndex, 'aria-labelledby': labelledBy }) => (
  <section id={id} className={className} tabIndex={tabIndex} aria-labelledby={labelledBy}>
    <div className="ar-container">{children}</div>
  </section>
);

export default ReportSection;

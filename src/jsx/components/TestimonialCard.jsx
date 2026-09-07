const TestimonialCard = ({ name, image, imageAlt = name, role, date, accent, quoteLanguage, translation, children }) => (
  <figure className="ar-tsm" style={{ '--ac': accent }}>
    <div className="ar-tsm-who">
      <span className="ar-tsm-av">
        <img src={image} alt={imageAlt} loading="lazy" />
      </span>
      <span className="ar-tsm-id">
        <b>{name}</b>
        <span>{role}</span>
      </span>
    </div>
    <blockquote lang={quoteLanguage}>{children}</blockquote>
    {translation}
    <div className="ar-tsm-date">{date}</div>
  </figure>
);

export default TestimonialCard;

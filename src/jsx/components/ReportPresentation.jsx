import { useId } from 'react';

/** Presentation only: all editorial values and rich text are supplied by Article.mdx. */
export const ResultCard = ({ style, image, value, country, children }) => (
  <figure className="ar-imp-card" style={style}>
    <div className="ar-imp-ph">
      <img {...image} alt={image.alt} />
      <div className="ar-imp-num">{value}</div>
    </div>
    <figcaption className="ar-imp-body">
      <div className="ar-ic-c">{country}</div>
      <div className="ar-ic-l">{children}</div>
    </figcaption>
  </figure>
);

export const PublicationCard = ({ link, coverProps, cover, title, subtitle }) => (
  <a {...link}>
    <span {...coverProps}>{cover}</span>
    <div className="ar-pc-t">
      {title}
      {link.target === '_blank' && <span className="ar-sr-only"> (opens in a new tab)</span>}
      <span className="ar-pc-cue" aria-hidden="true">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </span>
    </div>
    {subtitle !== undefined && <div className="ar-pc-s">{subtitle}</div>}
  </a>
);

export const TimelineItem = ({ link, dateProps, date, title, children }) => {
  const titleId = useId();
  const Tag = link.href ? 'a' : 'div';
  return (
    <Tag
      {...link}
      tabIndex={link.href ? undefined : 0}
      role={link.href ? undefined : 'group'}
      aria-labelledby={link.href ? undefined : titleId}
    >
      <span {...dateProps}>{date}</span>
      <div className="ar-m-a-t" id={titleId}>
        {title}
      </div>
      <div className="ar-m-a-n">{children}</div>
      {link.href && (
        <span className="ar-m-a-cue" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </span>
      )}
      {link.target === '_blank' && <span className="ar-sr-only"> (opens in a new tab)</span>}
    </Tag>
  );
};

export const Statistic = ({ variant = 'cooperation', className, valueProps, value, children }) => (
  <div className={className}>
    {variant === 'conference' ? <span {...valueProps}>{value}</span> : <div className="ar-k">{value}</div>}
    <div className={variant === 'conference' ? 'ar-lb' : 'ar-l'}>{children}</div>
  </div>
);

export const FundingBar = ({ label, fillProps, children }) => (
  <div className="ar-dn-bar">
    <span className="ar-bnm">{label}</span>
    <div className="ar-btrack">
      <div {...fillProps} />
    </div>
    <span className="ar-bpct">{children}</span>
  </div>
);

export const ContributorBubble = ({ className, style, value, children }) => (
  <div className={className} style={style}>
    <div className="ar-circ-area">
      <div className="ar-circle">{value}</div>
    </div>
    <div className="ar-bnm">{children}</div>
  </div>
);

export const ExploreTile = ({ link, number, title, children }) => (
  <a {...link}>
    <span className="ar-xp-img" aria-hidden="true" />
    <span className="ar-xp-tint" aria-hidden="true" />
    <span className="ar-xp-n">{number}</span>
    <span className="ar-xp-body">
      <span className="ar-xp-t">{title}</span>
      <span className="ar-xp-go">{children}</span>
    </span>
  </a>
);

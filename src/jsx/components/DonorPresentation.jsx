export const DonorLegend = ({ groups }) => (
  <div className="ar-dn-legend2" id="dnLegend">
    {groups.map((group, index) => (
      <button className="ar-dn-leg" type="button" aria-controls="dnCenter" data-i={index} key={group.name}>
        <span className="ar-sw" style={{ background: group.colour }} aria-hidden="true" />
        <span className="ar-nm">
          {group.name}
          {group.note && <small>{group.note}</small>}
        </span>
        <span className="ar-vv">
          {group.amount}
          <small>{group.percentage}%</small>
        </span>
      </button>
    ))}
  </div>
);

export const DonorTotal = ({ total }) => (
  <div className="ar-dn-center" id="dnCenter" role="status" aria-live="polite" aria-atomic="true">
    <div className="ar-cnum">
      <span className="ar-u">{total.prefix}</span>
      {total.value}
      <span className="ar-u">{total.suffix}</span>
    </div>
    <div className="ar-clab">{total.label}</div>
  </div>
);

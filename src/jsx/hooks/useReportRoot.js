import { createContext, useContext } from 'react';

export const ReportRootContext = createContext(null);

export default function useReportRoot() {
  const rootRef = useContext(ReportRootContext);
  if (!rootRef) throw new Error('Report components must be inside ReportRootContext');
  return rootRef;
}

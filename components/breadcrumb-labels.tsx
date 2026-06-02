'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type Labels = Record<string, string>;
type Ctx = { labels: Labels; setLabel: (id: string, name: string) => void };

const BreadcrumbLabelsContext = createContext<Ctx>({ labels: {}, setLabel: () => {} });

export function BreadcrumbLabelsProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<Labels>({});
  function setLabel(id: string, name: string) {
    setLabels((prev) => (prev[id] === name ? prev : { ...prev, [id]: name }));
  }
  return (
    <BreadcrumbLabelsContext.Provider value={{ labels, setLabel }}>
      {children}
    </BreadcrumbLabelsContext.Provider>
  );
}

export function useBreadcrumbLabels() {
  return useContext(BreadcrumbLabelsContext);
}

/** Drop this in any client component to register a label for a URL segment. */
export function BreadcrumbLabel({ id, name }: { id: string; name: string }) {
  const { setLabel } = useBreadcrumbLabels();
  useEffect(() => { setLabel(id, name); }, [id, name]);
  return null;
}

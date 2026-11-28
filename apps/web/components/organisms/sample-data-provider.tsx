'use client';

import { createContext, useContext } from 'react';
import { toast } from 'sonner';

/**
 * Whether what is drawn is sample data, as in the UI showcase: its Workspace is made up, so nothing
 * done there may reach the server, which would take it for a page of another Workspace and send the
 * person home. The app never provides it, so everywhere else it is `false`.
 */
const SampleDataContext = createContext(false);

export type SampleDataProviderProps = {
  children: React.ReactNode;
};

/** Marks everything under it as sample data, so its writes and reads stay in the browser. */
export function SampleDataProvider({ children }: SampleDataProviderProps) {
  return (
    <SampleDataContext.Provider value={true}>
      {children}
    </SampleDataContext.Provider>
  );
}

/** Whether what is drawn is sample data, whose actions must not reach the server. */
export function useIsSampleData(): boolean {
  return useContext(SampleDataContext);
}

/** Says, once at a time, that a press on sample data sends nothing. */
export function sayNothingIsSent(): void {
  toast.info('In the showcase, nothing is sent.', {
    id: 'sample-data-nothing-sent',
  });
}

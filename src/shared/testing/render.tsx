// render.tsx — render dei componenti nei test con un QueryClient senza retry di default. Il QueryClient di produzione
// (createQueryClient) sta in app/ e shared/ non puo' importarlo (FSD): i test sotto tests/ che lo vogliono lo passano.
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function clientDiTest(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export function renderConQuery(ui: ReactElement, client: QueryClient = clientDiTest()) {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

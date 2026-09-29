import type { QueryClient } from '@tanstack/react-query';

let client: QueryClient | null = null;

export const setQueryClient = (c: QueryClient): void => {
  client = c;
};

export const queryClient = {
  invalidateQueries: (opts: { queryKey: readonly unknown[] }): Promise<void> =>
    client ? client.invalidateQueries(opts).then(() => undefined) : Promise.resolve(),
};

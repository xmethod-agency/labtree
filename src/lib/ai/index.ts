import { mockProvider } from '@/lib/ai/mockProvider';
import { openrouterProvider } from '@/lib/ai/openrouterProvider';
import { hasOpenRouterKey, type AiMode, type AiProvider } from '@/lib/ai/provider';

export function getProvider(mode: AiMode): AiProvider {
  if (mode === 'mock') return mockProvider;
  if (mode === 'live') return openrouterProvider;
  return hasOpenRouterKey ? openrouterProvider : mockProvider;
}

export { hasOpenRouterKey };
export type { AiMode, AiProvider };

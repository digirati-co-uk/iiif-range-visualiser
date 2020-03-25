import { useManifest } from '@hyperion-framework/react-vault';
import { useMemo } from 'react';

export const useCanvasIndex = (canvasId: string) => {
  const manifest = useManifest();

  return useMemo(() => {
    for (let x = 0; x < manifest.items.length; x++) {
      if (manifest.items[x].id === canvasId) {
        return x;
      }
    }
    return undefined;
  }, [canvasId, manifest.items]);
};

import { useManifest, useVaultEffect } from '@hyperion-framework/react-vault';
import { useState } from 'react';
import { CanvasNormalized } from '@hyperion-framework/types';

export const useDuration = (canvasId?: string) => {
  const manifest = useManifest();
  const [duration, setDuration] = useState(0);

  useVaultEffect(
    vault => {
      let runningDuration = 0;
      for (const canvasRef of manifest.items) {
        const canvas = vault.fromRef<CanvasNormalized>(canvasRef);
        if (canvasId && canvasId === canvas.id) {
          break;
        }
        runningDuration += canvas.duration;
      }
      setDuration(runningDuration);
    },
    [manifest]
  );

  return duration;
};

import React, { useEffect, useState } from 'react';
import { Manifest, Range } from '@hyperion-framework/types';
import { Traverse } from '@hyperion-framework/vault';

export const Test: React.FC<{ id: string }> = ({ id }) => {
  const [manifest, setManifest] = useState<Manifest>();
  const [ranges, setRanges] = useState<Range[]>([]);
  const [canvasMap, setCanvasMap] = useState<{
    [id: string]: Array<[number, number]>;
  }>({});
  const [rangeCanvases, setRangeCanvases] = useState<
    Array<{ id: string; start: number; end: number }>
  >([]);

  useEffect(() => {
    fetch(id)
      .then(r => r.json())
      .then(setManifest);
  }, [id]);

  useEffect(() => {
    if (manifest) {
      const _ranges: Range[] = [];
      const canvases: Array<{ id: string; start: number; end: number }> = [];
      const traverse = new Traverse({
        range: [
          jsonLd => {
            if (jsonLd.type === 'Range') {
              _ranges.push(jsonLd);
            }
            if (jsonLd.type === 'Canvas') {
              // @ts-ignore
              const [, canvasId, start, end] = jsonLd.id.match(
                /(.*)#t=([0-9.]+),?([0-9.]+)?/
              );
              canvases.push({
                id: canvasId,
                start: parseFloat(start),
                end: parseFloat(end),
              });
            }
          },
        ],
      });

      traverse.traverseManifest(manifest);
      setRanges(_ranges);
      setRangeCanvases(canvases);

      setCanvasMap(
        canvases.reduce((acc, next) => {
          acc[next.id] = acc[next.id] ? acc[next.id] : [];
          acc[next.id].push([next.start, next.end]);
          return acc;
        }, {} as { [id: string]: Array<[number, number]> })
      );
    }
  }, [manifest]);

  // Or
  // - Full track + all ranges
  // - Each canvas with ranges
  // - Each range with child ranges
  // in a big long list button to view.
  // Button show/hide gaps

  return null;
};

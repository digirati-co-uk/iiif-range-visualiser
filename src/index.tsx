import React, { useEffect, useState, useMemo } from 'react';
import { render } from 'react-dom';
import queryString from 'query-string';
import {
  Context,
  useCanvas,
  useExternalManifest,
  useManifest,
  useVaultEffect,
  VaultProvider,
} from '@hyperion-framework/react-vault';
import {
  combineContext,
  manifestContext,
  thumbnailSizeContext,
  canvasContext,
  Traverse,
} from '@hyperion-framework/vault';
import {
  Canvas,
  CanvasNormalized,
  Manifest,
  Range,
  RangeNormalized,
} from '@hyperion-framework/types';

const CanvasLabel: React.FC<{ start: number; end: number }> = ({
  start,
  end,
}) => {
  const manifestDuration = useDuration();
  const canvas = useCanvas();
  const index = useCanvasIndex(canvas.id);
  const canvasOffsetDuration = useDuration(canvas.id);

  const durationStart = (canvasOffsetDuration + start) / manifestDuration;
  const durationWidth = (end - start) / manifestDuration;

  return (
    <div>
      <strong>Canvas (index: {index})</strong> -{' '}
      {canvas.label!.en ? canvas.label!.en[0] : 'Untitled canvas'} ({start} –{' '}
      {end})
      <div
        style={{
          width: '100%',
          position: 'absolute',
          left: 0,
          right: 0,
          background: '#ddd',
          height: 20,
        }}
      >
        <div
          style={{
            height: 20,
            background: 'blue',
            position: 'absolute',
            left: `${(canvasOffsetDuration / manifestDuration) * 100}%`,
            width: `${(canvas.duration / manifestDuration) * 100}%`,
          }}
        />
        <div
          style={{
            height: 20,
            background: 'red',
            position: 'absolute',
            left: `${durationStart * 100}%`,
            width: `${durationWidth * 100}%`,
          }}
        />
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
};

const useCanvasIndex = (canvasId: string) => {
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

const useDuration = (canvasId?: string) => {
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

const RangeLabel: React.FC<{ id: string }> = ({ id }) => {
  const [range, setRange] = useState<RangeNormalized>();

  useVaultEffect(vault => {
    setRange(vault.fromRef({ type: 'Range', id }) as RangeNormalized);
  }, []);

  if (!range) return null;

  // @ts-ignore
  if (range.type === 'Canvas') {
    // @ts-ignore
    const [, canvasId, start, end] = range.id.match(
      /(.*)#t=([0-9.]+),?([0-9.]+)?/
    );
    return (
      <Context context={canvasContext(canvasId)}>
        <CanvasLabel start={parseFloat(start)} end={parseFloat(end)} />
      </Context>
    );
  }

  if (range?.behavior.indexOf('no-nav') !== -1) {
    return 'No nav';
  }

  return (
    <div>
      {range?.behavior.indexOf('no-nav') !== -1
        ? null
        : range.label
        ? range.label.en[0]
        : 'Untitled range'}
      <ul style={{ marginBottom: 10 }}>
        {(range.items || []).map(rangeItem => (
          <li>
            <RangeLabel key={rangeItem.id} id={rangeItem.id} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const Test: React.FC<{ id: string }> = ({ id }) => {
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

              // canvases.push();
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

  if (!manifest) {
    return <div>loading...</div>;
  }

  return <div>Loaded!</div>;
};

const RangeView: React.FC<{ id: string }> = ({ id }) => {
  const manifest = useManifest();
  const duration = useDuration();

  return (
    <div>
      <div>
        Duration:
        <strong>{duration}</strong>
      </div>
      <Test id={id} />
      Test range view. {manifest.label!.en[0]}
      {manifest.structures.map(s => (
        <RangeLabel key={s.id} id={s.id} />
      ))}
    </div>
  );
};

const useManifestFromUrl = () => {
  const [id, setId] = useState<string>(
    () => queryString.parse(location.hash).manifest as string
  );

  useEffect(() => {
    const hashChange = () => {
      setId(queryString.parse(location.hash).manifest as string);
    };
    window.addEventListener('hashchange', hashChange);

    return () => window.removeEventListener('hashchange', hashChange);
  });

  return id;
};

export const Ranges: React.FC = () => {
  const inputId = useManifestFromUrl();
  const { id, isLoaded } = useExternalManifest(inputId);

  if (!isLoaded) {
    return <div>loading...</div>;
  }

  return (
    <Context
      context={combineContext(manifestContext(id), thumbnailSizeContext({}))}
    >
      <RangeView id={inputId} />
    </Context>
  );
};

render(
  <VaultProvider>
    <Ranges />
  </VaultProvider>,
  document.getElementById('root')
);

import React, { useState } from 'react';
import { render } from 'react-dom';
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
} from '@hyperion-framework/vault';
import { useFromRef } from './hooks/use-from-ref';
import { useCanvasIndex } from './hooks/use-canvas-index';
import { useDuration } from './hooks/use-duration';
import { useManifestFromUrl } from './hooks/use-manifest-from-url';
import { Test } from './components/test';
import {
  CanvasNormalized,
  Range,
  RangeNormalized,
} from '@hyperion-framework/types';

const CanvasLabel: React.FC<{
  start: number;
  end: number;
  noNav?: boolean;
}> = ({ start, end, noNav }) => {
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
            background: '#999',
            position: 'absolute',
            left: `${(canvasOffsetDuration / manifestDuration) * 100}%`,
            width: `${(canvas.duration / manifestDuration) * 100}%`,
          }}
        />
        <div
          style={{
            height: 20,
            background: noNav ? 'orange' : 'green',
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

const ParentRangeTest: React.FC<{ id: string }> = ({ id }) => {
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  const manifestDuration = useDuration();
  const manifest = useManifest();

  const durationStart = startTime / manifestDuration;
  const durationWidth = (endTime - startTime) / manifestDuration;

  useVaultEffect(vault => {
    const range = vault.fromRef<RangeNormalized>({ type: 'Range', id });
    const _startTimes: number[] = [];
    const _endTimes: number[] = [];

    const parseRange = (inputRange: RangeNormalized) => {
      for (const r of inputRange.items || []) {
        const ro = vault.fromRef<RangeNormalized>({ type: 'Range', id: r.id });
        if (ro && (ro.type as string) === 'Canvas') {
          const [, canvasId, start, end] = ro.id.match(
            /(.*)#t=([0-9.]+),?([0-9.]+)?/
          );

          let runningDuration = 0;
          for (const canvasRef of manifest.items) {
            const canvas = vault.fromRef<CanvasNormalized>(canvasRef);
            if (canvasId && canvasId === canvas.id) {
              break;
            }
            runningDuration += canvas.duration;
          }

          _startTimes.push(runningDuration + parseFloat(start));
          _endTimes.push(runningDuration + parseFloat(end));
        } else {
          parseRange(ro);
        }
      }
    };

    parseRange(range);

    setStartTime(Math.min(..._startTimes));
    setEndTime(Math.max(..._endTimes));
  });

  return (
    <div>
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
            left: `${durationStart * 100}%`,
            width: `${durationWidth * 100}%`,
          }}
        />
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
};

const RangeLabel: React.FC<{ id: string; noNav?: boolean }> = ({
  id,
  noNav: parentNoNav,
}) => {
  const range = useFromRef({ type: 'Range', id });

  if (!range) return null;

  const noNav = parentNoNav || range.behavior.indexOf('no-nav') !== -1;

  // @ts-ignore
  if (range.type === 'Canvas') {
    // @ts-ignore
    const [, canvasId, start, end] = range.id.match(
      /(.*)#t=([0-9.]+),?([0-9.]+)?/
    );
    console.log('ctx', range);
    return (
      <Context context={canvasContext(canvasId ? canvasId : range.id)}>
        <CanvasLabel
          start={parseFloat(start)}
          end={parseFloat(end)}
          noNav={noNav}
        />
      </Context>
    );
  }

  // if (range?.behavior.indexOf('no-nav') !== -1) {
  //   return <div>
  //     No nav
  //     <CanvasLabel start={parseFloat(start)} end={parseFloat(end)} />
  //   </div>;
  // }

  return (
    <div>
      {range?.behavior.indexOf('no-nav') !== -1
        ? null
        : range.label
        ? range.label.en[0]
        : 'Untitled range'}
      <ul style={{ marginBottom: 10 }}>
        {range.items && range.items.length > 1 && (
          <ParentRangeTest id={range.id} />
        )}
        {(range.items || []).map(rangeItem => (
          <li>
            {rangeItem.id ===
            'http://api.bl.uk/metadata/iiif/#t=378.72,1520.04' ? (
              'ERROR'
            ) : (
              <RangeLabel key={rangeItem.id} id={rangeItem.id} noNav={noNav} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const RangeView: React.FC<{ id: string }> = ({ id }) => {
  const manifest = useManifest();
  const duration = useDuration();

  return (
    <div>
      <h1>{manifest.label!.en[0]}</h1>
      <Test id={id} />
      <div>
        Duration:
        <strong>{duration}</strong>
      </div>
      {manifest.structures.map(s => (
        <RangeLabel key={s.id} id={s.id} />
      ))}
    </div>
  );
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

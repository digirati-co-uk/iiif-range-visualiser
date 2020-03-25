import { useState } from 'react';
import { Reference } from '@hyperion-framework/types';
import { useVaultEffect } from '@hyperion-framework/react-vault';
import { NormalizedEntity } from '@hyperion-framework/vault';
import { TraversableEntityTypes } from '@hyperion-framework/vault/dist/@types/processing/traverse';

type FromNormalized<Type, T = NormalizedEntity> = T extends { type: Type }
  ? T
  : never;

export function useFromRef<
  Type extends TraversableEntityTypes,
  Return extends FromNormalized<Type>
>(ref: { type: Type; id: string }): Return | undefined {
  const [range, setRange] = useState<Return>();

  useVaultEffect(
    vault => {
      setRange(vault.fromRef(ref) as Return);
    },
    [ref.id, ref.type]
  );

  return range;
}

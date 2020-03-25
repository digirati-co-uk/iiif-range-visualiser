import { useEffect, useState } from 'react';
import queryString from 'query-string';

export const useManifestFromUrl = () => {
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

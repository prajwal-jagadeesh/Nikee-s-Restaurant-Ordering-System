'use client';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useDoc<T>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    const docRef = doc(firestore, path);
    const unsubscribe = onSnapshot(
      docRef,
      docSnapshot => {
        if (docSnapshot.exists()) {
          setData({ id: docSnapshot.id, ...docSnapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      err => {
        console.error(`Error fetching doc from ${path}:`, err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [firestore, path]);

  return { data, loading, error };
}

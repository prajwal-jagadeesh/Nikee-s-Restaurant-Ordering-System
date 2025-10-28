'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
  query,
  where,
  WhereFilterOp,
  orderBy,
  OrderByDirection,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

interface QueryOptions {
  where?: [string, WhereFilterOp, any][];
  orderBy?: [string, OrderByDirection?][];
}

export function useCollection<T>(path: string, opts?: QueryOptions) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const memoizedOpts = useMemo(() => opts, [JSON.stringify(opts)]);

  useEffect(() => {
    let q: Query<DocumentData> = collection(firestore, path);

    if (memoizedOpts?.where) {
      memoizedOpts.where.forEach(w => {
        q = query(q, where(w[0], w[1], w[2]));
      });
    }

    if (memoizedOpts?.orderBy) {
      memoizedOpts.orderBy.forEach(o => {
        q = query(q, orderBy(o[0], o[1]));
      });
    }

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      err => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path, memoizedOpts]);

  return { data, loading, error };
}

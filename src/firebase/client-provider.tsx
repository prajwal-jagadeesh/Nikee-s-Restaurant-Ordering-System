'use client';
import React from 'react';
import { FirebaseProvider, FirebaseProviderProps } from './provider';
import { initializeFirebase } from './';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = initializeFirebase();
  return <FirebaseProvider value={value}>{children}</FirebaseProvider>;
}

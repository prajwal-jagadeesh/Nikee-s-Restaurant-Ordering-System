'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
  doc,
  getDocs,
  writeBatch,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useFirestore } from './provider';
import type { MenuItem, Table, Order, MenuCategory, AppSettings } from '@/lib/types';
import { menuItems as initialMenuItems, menuCategories as initialMenuCategories } from '@/lib/data';

// --- Generic Hooks ---

export function useCollection<T>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, path),
      snapshot => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
        setData(docs);
        setLoading(false);
      },
      err => {
        console.error(`Error fetching collection from ${path}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, loading, error };
}

export function useDoc<T>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setData(null);
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


// --- App-specific Hooks ---

export function useMenuItems() {
  return useCollection<MenuItem>('menuItems');
}

export function useMenuCategories() {
  return useCollection<MenuCategory>('menuCategories');
}

export function useTables() {
  return useCollection<Table>('tables');
}

export function useOrders() {
  return useCollection<Order>('orders');
}

export function useSettings() {
    const { data, loading, error } = useDoc<AppSettings>('settings/global');
    return { settings: data, loading, error };
}


// --- Database Seeding Hook ---

const initialTables = Array.from({ length: 25 }, (_, i) => ({
  name: `Table ${i + 1}`,
}));

export function useDatabaseSeeder() {
  const firestore = useFirestore();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDataPresent, setIsDataPresent] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkDataPresence = useCallback(async () => {
    try {
      setLoading(true);
      const menuItemsRef = collection(firestore, 'menuItems');
      const menuSnapshot = await getDocs(menuItemsRef);
      if (!menuSnapshot.empty) {
        setIsDataPresent(true);
      }
    } catch (e) {
      console.error("Error checking for data", e);
    } finally {
      setLoading(false);
    }
  }, [firestore]);
  
  useEffect(() => {
    checkDataPresence();
  }, [checkDataPresence]);

  const seedDatabase = async () => {
    setIsSeeding(true);
    try {
        const batch = writeBatch(firestore);
        
        // Seed Menu Items
        const menuItemsRef = collection(firestore, 'menuItems');
        initialMenuItems.forEach(item => {
            const docRef = doc(menuItemsRef, item.id);
            batch.set(docRef, item);
        });

        // Seed Menu Categories
        const menuCategoriesRef = collection(firestore, 'menuCategories');
        initialMenuCategories.forEach((categoryName, index) => {
             const docRef = doc(menuCategoriesRef);
             batch.set(docRef, { name: categoryName, id: docRef.id });
        });

        // Seed Tables
        const tablesRef = collection(firestore, 'tables');
        initialTables.forEach(table => {
            const docRef = doc(tablesRef);
            batch.set(docRef, { ...table, id: docRef.id });
        });
        
        await batch.commit();
        setIsDataPresent(true); // Set data as present after seeding
        alert('Database seeded successfully!');

    } catch (error) {
        console.error("Error seeding database:", error);
        alert('Error seeding database. Check the console for details.');
    } finally {
        setIsSeeding(false);
    }
  };

  return { seedDatabase, isSeeding, isDataPresent, loading };
}

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
import { menuItems as initialMenuItems, menuCategories as initialMenuCategoriesData } from '@/lib/data';

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
        const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
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
          setData({ ...docSnapshot.data(), id: docSnapshot.id } as T);
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
      } else {
        setIsDataPresent(false);
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
        const menuItemsCollectionRef = collection(firestore, 'menuItems');
        initialMenuItems.forEach(item => {
            const docRef = doc(menuItemsCollectionRef, item.id);
            batch.set(docRef, item);
        });

        // Seed Menu Categories
        const menuCategoriesCollectionRef = collection(firestore, 'menuCategories');
        const existingCategoriesSnapshot = await getDocs(menuCategoriesCollectionRef);
        if (existingCategoriesSnapshot.empty) {
            initialMenuCategoriesData.forEach((categoryName) => {
                 const docRef = doc(menuCategoriesCollectionRef);
                 batch.set(docRef, { name: categoryName, id: docRef.id });
            });
        }


        // Seed Tables
        const tablesCollectionRef = collection(firestore, 'tables');
        const existingTablesSnapshot = await getDocs(tablesCollectionRef);
        if (existingTablesSnapshot.empty) {
          initialTables.forEach(table => {
              const docRef = doc(tablesCollectionRef);
              batch.set(docRef, { ...table, id: docRef.id });
          });
        }
        
        await batch.commit();
        await checkDataPresence(); // Re-check after seeding
        alert('Database seeded successfully!');

    } catch (error) {
        console.error("Error seeding database:", error);
        alert('Error seeding database. Check the console for details.');
    } finally {
        setIsSeeding(false);
    }
  };

  return { seedDatabase, isSeeding, isDataPresent, loading, checkDataPresence };
}

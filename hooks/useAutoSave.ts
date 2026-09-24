import { useState, useEffect } from 'react';

export function useAutoSave<T>(storageKey: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // পেজ লোড হওয়ার পর লোকাল স্টোরেজ থেকে ডেটা আনা
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      setData(JSON.parse(savedData));
    }
    setIsLoaded(true);
  }, [storageKey]);

  // ডেটা পরিবর্তন হলে তা লোকাল স্টোরেজে সেভ করা
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [data, isLoaded, storageKey]);

  // ফর্ম সাবমিট হওয়ার পর স্টোরেজ ক্লিয়ার করার ফাংশন
  const clearData = () => {
    localStorage.removeItem(storageKey);
    setData(initialValue);
  };

  return { data, setData, clearData, isLoaded };
}
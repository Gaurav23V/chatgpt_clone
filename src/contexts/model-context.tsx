"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

import { defaultModel } from '@/lib/ai/models';

// Context type
interface ModelContextState {
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
}

// Create Context
const ModelContext = createContext<ModelContextState | undefined>(undefined);

// LocalStorage key
const STORAGE_KEY = 'chatgpt-clone-selected-model';

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModelState] = useState<string>(defaultModel.id);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSelectedModelState(stored);
      }
    } catch (err) {
      console.error('Error loading stored model', err);
    }
  }, []);

  // Persist whenever changes
  const setSelectedModel = (modelId: string) => {
    setSelectedModelState(modelId);
    try {
      localStorage.setItem(STORAGE_KEY, modelId);
    } catch (err) {
      console.error('Error saving selected model', err);
    }
  };

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
}

// Hook for consuming context
export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return ctx;
} 
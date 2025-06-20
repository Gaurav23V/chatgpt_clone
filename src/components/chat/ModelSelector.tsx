'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useModel } from '@/contexts/model-context';
import { UI_MODEL_GROUPS } from '@/lib/ai/models';

/**
 * ModelSelector Component
 *
 * Renders a dropdown similar to ChatGPT's model selector.
 * Shows current model name with a chevron. Clicking toggles list.
 */
export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useModel();
  const [open, setOpen] = useState(false);

  const current = UI_MODEL_GROUPS.flatMap((g) => g.models).find(
    (m) => m.id === selectedModel
  );

  const ChevronIcon = open ? ChevronUp : ChevronDown;

  return (
    <div className='relative inline-block text-left'>
      <Button
        type='button'
        size='sm'
        variant='ghost'
        aria-haspopup='listbox'
        aria-expanded={open}
        className='flex items-center space-x-1 rounded-lg border border-[#333] bg-[#2a2a2a] px-3 py-1 text-xs text-gray-200 hover:bg-[#3a3a3a]'
        onClick={() => setOpen((v) => !v)}
      >
        <span>{current?.name || 'Select model'}</span>
        <ChevronIcon className='h-3 w-3 opacity-70' />
      </Button>

      {open && (
        <div
          className='animate-in fade-in-0 zoom-in-95 absolute bottom-full z-50 mb-2 max-h-80 w-56 overflow-y-auto rounded-lg border border-[#333] bg-[#1e1e1e] shadow-xl'
          role='listbox'
        >
          {UI_MODEL_GROUPS.map((group) => (
            <div key={group.title} className='px-3 py-2'>
              <p className='mb-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase'>
                {group.title}
              </p>
              {group.models.map((model) => {
                const active = model.id === selectedModel;
                return (
                  <button
                    key={model.id}
                    type='button'
                    onClick={() => {
                      setSelectedModel(model.id);
                      setOpen(false);
                    }}
                    className={`group mb-1 flex w-full flex-col rounded-md px-2 py-1 text-left transition-colors hover:bg-[#2f2f2f] ${
                      active ? 'bg-[#3a3a3a]' : ''
                    }`}
                  >
                    <span className='text-xs text-gray-200'>{model.name}</span>
                    <span className='text-[10px] text-gray-400'>
                      {model.description}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

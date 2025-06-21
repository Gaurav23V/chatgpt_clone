'use client';

import { useMemo, useRef } from 'react';

// Removed Uploadcare widget – using direct Cloudinary upload instead
import { Paperclip } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useModel } from '@/contexts/model-context';
import { modelHelpers } from '@/lib/ai/models';

export interface ChatAttachment {
  url: string;
  mimeType: string;
  name: string;
  size?: number;
}

interface FileUploadButtonProps {
  onFileUploaded: (file: ChatAttachment) => void;
  disabled?: boolean; // you can force disable regardless of model capabilities
}

export default function FileUploadButton({
  onFileUploaded,
  disabled = false,
}: FileUploadButtonProps) {
  const { selectedModel } = useModel();
  const model = useMemo(
    () => modelHelpers.getModelById(selectedModel),
    [selectedModel]
  );

  // Determine allowed file types based on model capabilities
  const accept = useMemo(() => {
    if (!model?.capabilities) return '';
    const types: string[] = [];
    if (model.capabilities.imageInput) types.push('image/*');
    if (model.capabilities.documentInput) types.push('.pdf,.txt,.docx');
    if (model.capabilities.audioInput) types.push('audio/*');
    return types.join(',');
  }, [model]);

  const envReady =
    !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    !!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const isEnabled = !disabled && accept.length > 0 && envReady;

  // Hidden file input reference
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Upload handler – uploads directly to Cloudinary unsigned preset
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected twice in a row
    e.target.value = '';

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error(
        'Missing Cloudinary environment variables. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.'
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Cloudinary upload failed');
      }

      const attachment: ChatAttachment = {
        url: data.secure_url || data.url,
        mimeType: file.type,
        name: file.name,
        size: file.size,
      };

      onFileUploaded(attachment);
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // TODO: show toast / error UI if desired
    }
  };

  if (!isEnabled) {
    const title = !envReady
      ? 'File upload is not configured (missing Cloudinary vars)'
      : 'Current model does not support file uploads';
    return (
      <Button
        type='button'
        size='icon'
        variant='ghost'
        title={title}
        className='h-8 w-8 cursor-not-allowed rounded-lg text-gray-500 opacity-50'
        disabled
      >
        <Paperclip className='h-4 w-4' />
      </Button>
    );
  }

  return (
    <>
      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type='file'
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Trigger button */}
      <Button
        type='button'
        size='icon'
        variant='ghost'
        onClick={() => inputRef.current?.click()}
        className='hover-lift h-8 w-8 rounded-lg text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
      >
        <Paperclip className='h-4 w-4' />
      </Button>
    </>
  );
}

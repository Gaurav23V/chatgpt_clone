'use client';

import { useMemo, useRef } from 'react';

import { Widget as UploadcareWidget } from '@uploadcare/react-widget';
import { Paperclip } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useModel } from '@/contexts/model-context';
import { modelHelpers } from '@/lib/ai/models';
import { uploadcareOptions } from '@/lib/storage/uploadcare-config';

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
  const model = useMemo(() => modelHelpers.getModelById(selectedModel), [selectedModel]);

  // Determine allowed file types based on model capabilities
  const accept = useMemo(() => {
    if (!model?.capabilities) return '';
    const types: string[] = [];
    if (model.capabilities.imageInput) types.push('image/*');
    if (model.capabilities.documentInput) types.push('.pdf,.txt,.docx');
    if (model.capabilities.audioInput) types.push('audio/*');
    return types.join(',');
  }, [model]);

  const isEnabled = !disabled && accept.length > 0;

  const widgetApi = useRef<any>(null);

  if (!isEnabled) {
    return (
      <Button
        type='button'
        size='icon'
        variant='ghost'
        title='Current model does not support file uploads'
        className='h-8 w-8 cursor-not-allowed rounded-lg text-gray-500 opacity-50'
        disabled
      >
        <Paperclip className='h-4 w-4' />
      </Button>
    );
  }

  return (
    <>
      {/* Hidden Uploadcare widget */}
      { /* @ts-expect-error upstream types not compatible with React 19 */ }
      <UploadcareWidget as any
        publicKey={uploadcareOptions.publicKey}
        ref={widgetApi as any}
        tabs='file url camera'
        onChange={(fileInfo: any) => {
          if (!fileInfo) return;
          fileInfo.done((info: any) => {
            const attachment: ChatAttachment = {
              url: info.cdnUrl || info.cdnUrlModifiers || info.url,
              mimeType: info.mimeType || '',
              name: info.name,
              size: info.size,
            };
            onFileUploaded(attachment);
          });
        }}
        style={{ display: 'none' }}
      />

      {/* Trigger button */}
      <Button
        type='button'
        size='icon'
        variant='ghost'
        onClick={() => widgetApi.current?.openDialog?.()}
        className='hover-lift h-8 w-8 rounded-lg text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
      >
        <Paperclip className='h-4 w-4' />
      </Button>
    </>
  );
} 
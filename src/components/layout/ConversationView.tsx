'use client';

import { useState } from 'react';

import {
  Copy,
  Download,
  Mic,
  Plus,
  RotateCcw,
  Settings,
  Share,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConversationViewProps {
  conversationId: string;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function ConversationView({
  conversationId,
  onToggleSidebar,
  sidebarOpen,
}: ConversationViewProps) {
  const [input, setInput] = useState('');

  return (
    <div className='flex h-full flex-col'>
      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto max-w-3xl px-4 py-6'>
          {/* Sample conversation - in real app, this would come from API */}
          <div className='space-y-6'>
            {/* User message */}
            <div className='flex justify-end'>
              <div className='max-w-[80%] rounded-3xl bg-[#2f2f2f] px-4 py-3'>
                <p className='text-sm text-white'>
                  "An LALR(1) parser for a grammar G can have a shift-reduce
                  conflict if:"
                </p>
              </div>
            </div>

            {/* Assistant message */}
            <div className='flex justify-start'>
              <div className='max-w-[80%]'>
                <div className='space-y-4 text-sm text-white'>
                  <p>Let's briefly review:</p>

                  <ul className='ml-4 space-y-2'>
                    <li className='flex items-start'>
                      <span className='mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-white'></span>
                      <span>
                        <strong>LR(1) parsers</strong> are the most powerful of
                        the LR family.
                      </span>
                    </li>
                    <li className='flex items-start'>
                      <span className='mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-white'></span>
                      <span>
                        <strong>LALR(1) parsers</strong> are constructed by
                        merging LR(1) states with the same LR(0) core, which can
                        sometimes introduce conflicts not present in full LR(1).
                      </span>
                    </li>
                    <li className='flex items-start'>
                      <span className='mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-white'></span>
                      <span>
                        A <strong>shift-reduce conflict</strong> happens when
                        the parser can't decide whether to shift the next input
                        symbol or reduce using a production.
                      </span>
                    </li>
                  </ul>

                  <div className='mt-6'>
                    <h3 className='mb-2 font-semibold'>Correct Answer:</h3>
                    <div className='flex items-center space-x-2'>
                      <div className='flex h-4 w-4 items-center justify-center rounded-sm bg-green-500'>
                        <span className='text-xs text-black'>✓</span>
                      </div>
                      <span>
                        The SLR(1) parser for G has shift-reduce conflict.
                      </span>
                    </div>
                  </div>

                  <div className='mt-6'>
                    <h3 className='mb-2 font-semibold'>Explanation:</h3>
                    <ul className='ml-4 space-y-2'>
                      <li className='flex items-start'>
                        <span className='mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-white'></span>
                        <span>
                          If the SLR(1) parser has a shift-reduce conflict, then{' '}
                          <strong>LALR(1) parser may also</strong> have it. SLR
                          uses simpler FOLLOW sets, which can lead to incorrect
                          decisions.
                        </span>
                      </li>
                      <li className='flex items-start'>
                        <span className='mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-white'></span>
                        <span>
                          <strong>LALR(1)</strong> merges LR(1) states and can
                          inherit conflicts from SLR(1) depending on how the
                          merging is done.
                        </span>
                      </li>
                      <li className='flex items-start'>
                        <span className='mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-white'></span>
                        <span>
                          <strong>LR(1) parsers</strong> resolve more conflicts
                          due to richer lookahead, so if LR(1) has a conflict,
                          so will the others.
                        </span>
                      </li>
                      <li className='flex items-start'>
                        <span className='mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-white'></span>
                        <span>
                          The presence of a shift-reduce conflict in{' '}
                          <strong>SLR(1)</strong> suggests the grammar is not
                          SLR(1), and so it's not guaranteed to be LALR(1)
                          either.
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className='mt-6'>
                    <h3 className='mb-2 font-semibold'>Final Answer:</h3>
                    <div className='flex items-center space-x-2'>
                      <div className='h-4 w-4 rounded-full bg-white'></div>
                      <span>
                        The SLR(1) parser for G has shift-reduce conflict.
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className='mt-4 flex items-center space-x-2 pt-2'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8 text-gray-400 hover:bg-[#404040] hover:text-white'
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8 text-gray-400 hover:bg-[#404040] hover:text-white'
                    >
                      <ThumbsUp className='h-4 w-4' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8 text-gray-400 hover:bg-[#404040] hover:text-white'
                    >
                      <ThumbsDown className='h-4 w-4' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8 text-gray-400 hover:bg-[#404040] hover:text-white'
                    >
                      <RotateCcw className='h-4 w-4' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8 text-gray-400 hover:bg-[#404040] hover:text-white'
                    >
                      <Share className='h-4 w-4' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8 text-gray-400 hover:bg-[#404040] hover:text-white'
                    >
                      <Download className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className='border-t border-[#444444] p-4'>
        <div className='mx-auto max-w-3xl'>
          <div className='relative rounded-3xl border border-[#444444] bg-[#2f2f2f] transition-colors focus-within:border-[#666666]'>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask anything'
              className='w-full rounded-3xl border-0 bg-transparent px-4 py-4 pr-20 text-base text-white placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0'
            />
            <div className='absolute top-1/2 right-2 flex -translate-y-1/2 items-center space-x-2'>
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8 rounded-lg text-gray-400 hover:bg-[#404040] hover:text-white'
              >
                <Plus className='h-4 w-4' />
              </Button>
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8 rounded-lg text-gray-400 hover:bg-[#404040] hover:text-white'
              >
                <Settings className='h-4 w-4' />
              </Button>
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8 rounded-lg text-gray-400 hover:bg-[#404040] hover:text-white'
              >
                <Mic className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='mt-2 text-center text-xs text-gray-400'>
            ChatGPT can make mistakes. Check important info.{' '}
            <a href='#' className='underline hover:text-gray-300'>
              See Cookie Preferences
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

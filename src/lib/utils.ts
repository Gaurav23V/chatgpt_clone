/**
 * UI Utilities for ChatGPT Clone
 *
 * This file contains utility functions for styling and component management.
 *
 * Package Dependencies:
 *
 * @package clsx - A tiny utility for constructing className strings conditionally.
 *   Used for conditional CSS classes and merging class names dynamically.
 *   Example: clsx('btn', { 'btn-active': isActive, 'btn-disabled': disabled })
 *
 * @package tailwind-merge - Utility to efficiently merge Tailwind CSS classes.
 *   Prevents conflicts when combining multiple Tailwind classes and removes duplicates.
 *   Example: twMerge('px-2 py-1 px-3') → 'py-1 px-3' (removes conflicting px-2)
 *
 * @package class-variance-authority - Build type-safe component APIs with focus on developer experience.
 *   Used by ShadCN components for creating consistent variant-based styling systems.
 *   Enables creation of components with multiple style variants (size, color, etc.)
 *
 * @package lucide-react - Beautiful & consistent icon toolkit made by the community.
 *   Provides 1000+ pixel-perfect icons as React components.
 *   Used throughout the ChatGPT clone for UI icons (send, menu, user, etc.)
 *
 * @package @radix-ui/react-* - Low-level UI primitives for building design systems.
 *   - react-dialog: Modal dialogs and overlays
 *   - react-dropdown-menu: Accessible dropdown menus
 *   - react-scroll-area: Custom scrollbars and scroll containers
 *   - react-tooltip: Accessible tooltips with positioning
 *   - react-separator: Visual dividers and separators
 *   These provide the foundation for ShadCN components with accessibility built-in.
 *
 * @package @shadcn/ui - Component library built on top of Radix UI and Tailwind CSS.
 *   Provides pre-built, customizable components following modern design patterns.
 *   Configured with "New York" style and Zinc color scheme for ChatGPT-like appearance.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and merges CSS class names intelligently
 *
 * This utility function combines the power of clsx and tailwind-merge:
 * - clsx handles conditional class names and various input formats
 * - twMerge removes conflicting Tailwind classes and optimizes the output
 *
 * @param inputs - Array of class values (strings, objects, arrays, etc.)
 * @returns Merged and optimized class string
 *
 * @example
 * cn('px-2 py-1', 'px-3') // → 'py-1 px-3'
 * cn('btn', { 'btn-primary': isPrimary }, ['text-sm']) // → 'btn btn-primary text-sm'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * useCopyToClipboard Hook
 * 
 * A custom hook for copying text to clipboard with visual feedback.
 * Automatically resets the "copied" state after a specified duration.
 * 
 * @example
 * ```tsx
 * const { copy, copied, isCopying } = useCopyToClipboard();
 * 
 * <button onClick={() => copy('Hello World')}>
 *   {copied ? 'Copied!' : 'Copy'}
 * </button>
 * ```
 */

import { useState, useCallback } from 'react';

interface UseCopyToClipboardOptions {
  /**
   * Duration in milliseconds before resetting the "copied" state
   * @default 2000 (2 seconds)
   */
  resetDelay?: number;
}

interface UseCopyToClipboardReturn {
  /**
   * Function to copy text to clipboard
   * @param text - The text to copy
   */
  copy: (text: string) => Promise<void>;
  
  /**
   * Whether the text was recently copied (shows "Copied" feedback)
   */
  copied: boolean;
  
  /**
   * Whether copy operation is in progress
   */
  isCopying: boolean;
}

/**
 * Custom hook for clipboard operations with visual feedback
 * 
 * @param options - Configuration options
 * @returns Object with copy function and state
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const { resetDelay = 2000 } = options;
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      if (!text) return;

      setIsCopying(true);
      try {
        // Use modern Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }

        // Show "Copied" feedback
        setCopied(true);

        // Reset after delay
        setTimeout(() => {
          setCopied(false);
        }, resetDelay);
      } catch (err) {
        // Silently handle copy errors (e.g., user denied permission)
        console.warn('Failed to copy to clipboard:', err);
      } finally {
        setIsCopying(false);
      }
    },
    [resetDelay]
  );

  return { copy, copied, isCopying };
}


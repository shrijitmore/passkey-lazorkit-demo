/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner component with different sizes and color options.
 * Provides consistent loading indicators across the application.
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="md" />
 * <LoadingSpinner size="lg" color="primary" />
 * ```
 */

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerColor = 'primary' | 'white' | 'gray' | 'purple';

interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * - sm: Small (h-3 w-3 or h-4 w-4)
   * - md: Medium (h-5 w-5 or h-6 w-6)
   * - lg: Large (h-8 w-8 or h-12 w-12)
   */
  size?: SpinnerSize;
  
  /**
   * Color variant of the spinner
   * - primary: Primary theme color
   * - white: White color
   * - gray: Gray color
   * - purple: Purple color
   */
  color?: SpinnerColor;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Custom border width (defaults based on size)
   */
  borderWidth?: string;
}

/**
 * Get size classes based on spinner size
 */
function getSizeClasses(size: SpinnerSize): {
  size: string;
  border: string;
} {
  switch (size) {
    case 'sm':
      return {
        size: 'h-3 w-3 sm:h-4 sm:w-4',
        border: 'border-b-2',
      };
    case 'md':
      return {
        size: 'h-5 w-5 sm:h-6 sm:w-6',
        border: 'border-2',
      };
    case 'lg':
      return {
        size: 'h-8 w-8 sm:h-12 sm:w-12',
        border: 'border-4',
      };
  }
}

/**
 * Get color classes based on spinner color
 */
function getColorClasses(color: SpinnerColor, borderWidth: string): string {
  switch (color) {
    case 'primary':
      return 'border-primary border-t-transparent';
    case 'white':
      return 'border-white border-t-transparent';
    case 'gray':
      return 'border-gray-400 border-t-transparent';
    case 'purple':
      return 'border-purple-500 border-t-transparent';
  }
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
  borderWidth,
}: LoadingSpinnerProps) {
  const sizeClasses = getSizeClasses(size);
  const borderClass = borderWidth || sizeClasses.border;
  const colorClasses = getColorClasses(color, borderClass);

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses.size} ${borderClass} ${colorClasses} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}


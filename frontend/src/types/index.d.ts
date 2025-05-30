declare module 'react-hot-toast' {
  import { FC, CSSProperties, ReactNode } from 'react';

  export interface ToasterProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    reverseOrder?: boolean;
    gutter?: number;
    containerClassName?: string;
    containerStyle?: CSSProperties;
    toastOptions?: ToastOptions;
  }

  export interface ToastOptions {
    duration?: number;
    style?: CSSProperties;
    className?: string;
    success?: {
      style?: CSSProperties;
      className?: string;
      duration?: number;
    };
    error?: {
      style?: CSSProperties;
      className?: string;
      duration?: number;
    };
    loading?: {
      style?: CSSProperties;
      className?: string;
    };
  }

  export const Toaster: FC<ToasterProps>;

  export const toast: {
    (message: ReactNode, options?: ToastOptions): string;
    success(message: ReactNode, options?: ToastOptions): string;
    error(message: ReactNode, options?: ToastOptions): string;
    loading(message: ReactNode, options?: ToastOptions): string;
    dismiss(toastId?: string): void;
    remove(toastId?: string): void;
  };
}
'use client';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`${sizeClasses[size]} border-primary/30 border-t-primary rounded-full animate-spin`}
            />
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-foreground-muted text-sm animate-pulse">Loading...</p>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="card">
            <div className="shimmer h-4 w-1/3 rounded mb-3" />
            <div className="shimmer h-8 w-1/2 rounded mb-2" />
            <div className="shimmer h-3 w-2/3 rounded" />
        </div>
    );
}

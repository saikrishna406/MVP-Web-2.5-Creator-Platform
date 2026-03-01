'use client';

import { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    subtitle?: string;
    gradient?: 'primary' | 'secondary' | 'accent' | 'success';
}

const gradientMap = {
    primary: 'from-primary/20 to-primary/5',
    secondary: 'from-secondary/20 to-secondary/5',
    accent: 'from-accent/20 to-accent/5',
    success: 'from-success/20 to-success/5',
};

const iconBgMap = {
    primary: 'bg-primary/20 text-primary-light',
    secondary: 'bg-secondary/20 text-secondary-light',
    accent: 'bg-accent/20 text-accent-light',
    success: 'bg-success/20 text-success',
};

export default function StatCard({
    title,
    value,
    icon,
    change,
    changeType = 'neutral',
    subtitle,
    gradient = 'primary',
}: StatCardProps) {
    return (
        <div className={`stat-card bg-gradient-to-br ${gradientMap[gradient]}`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${iconBgMap[gradient]}`}>
                    {icon}
                </div>
                {change && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${changeType === 'positive' ? 'bg-success/20 text-success' :
                            changeType === 'negative' ? 'bg-error/20 text-error' :
                                'bg-foreground-muted/20 text-foreground-muted'
                        }`}>
                        {change}
                    </span>
                )}
            </div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-sm text-foreground-muted">{title}</div>
            {subtitle && <div className="text-xs text-foreground-muted mt-1">{subtitle}</div>}
        </div>
    );
}

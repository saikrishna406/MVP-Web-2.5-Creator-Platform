'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/ui/Toast';

export function DailyLoginTracker() {
    const [toast, setToast] = useState<{message: string; type: 'success' | 'info' | 'error'} | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkDailyLogin = async () => {
            // Check if we already claimed today in this session to prevent spamming the API
            const lastClaimed = sessionStorage.getItem('daily_login_checked');
            if (lastClaimed) return;
            sessionStorage.setItem('daily_login_checked', 'true');

            try {
                const res = await fetch('/api/gamification/daily-login', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.claimed) {
                        setToast({ message: data.message || 'Daily login points earned!', type: 'success' });
                        router.refresh();
                    }
                }
            } catch (err) {
                console.error('Failed to claim daily login', err);
            }
        };

        checkDailyLogin();
    }, [router]);

    if (!toast) return null;

    return <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />;
}

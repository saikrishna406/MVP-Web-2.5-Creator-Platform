import { Suspense } from 'react';
import { SignInFlo } from '@/components/ui/sign-in-flo';

function LoginFallback() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 50%, #fff0f0 100%)',
        }}>
            <div style={{
                width: '40px', height: '40px',
                border: '3px solid #E8E8E8',
                borderTopColor: '#FF424D',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <SignInFlo initialMode="signin" />
        </Suspense>
    );
}

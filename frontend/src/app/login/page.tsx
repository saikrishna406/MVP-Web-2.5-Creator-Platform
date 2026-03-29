import { Suspense } from 'react';
import { SignInFlo } from '@/components/ui/sign-in-flo';

function LoginFallback() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000000',
        }}>
            <div style={{
                width: '40px', height: '40px',
                border: '3px solid #333333',
                borderTopColor: '#FFFFFF',
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
            <SignInFlo />
        </Suspense>
    );
}

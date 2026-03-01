'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const config = {
        success: { bg: 'bg-success/90', icon: <CheckCircle className="w-5 h-5" /> },
        error: { bg: 'bg-error/90', icon: <XCircle className="w-5 h-5" /> },
        info: { bg: 'bg-primary/90', icon: <Info className="w-5 h-5" /> },
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-white font-medium text-sm shadow-2xl transition-all duration-300 ${config[type].bg
                } ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            style={{ backdropFilter: 'blur(10px)' }}
        >
            {config[type].icon}
            <span>{message}</span>
            <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-2 hover:opacity-70">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

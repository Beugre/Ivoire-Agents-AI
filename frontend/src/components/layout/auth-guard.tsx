'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { token, loadFromStorage } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    useEffect(() => {
        if (token === null) {
            const stored = localStorage.getItem('token');
            if (!stored) {
                router.replace('/login');
            }
        }
    }, [token, router]);

    return <>{children}</>;
}

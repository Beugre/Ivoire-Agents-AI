'use client';

import Sidebar from '@/components/layout/sidebar';
import AuthGuard from '@/components/layout/auth-guard';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
            <Toaster richColors />
        </AuthGuard>
    );
}

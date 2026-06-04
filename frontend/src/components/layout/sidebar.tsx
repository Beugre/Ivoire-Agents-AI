'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
    LayoutDashboard,
    Bot,
    MessageSquare,
    BookOpen,
    Settings,
    CreditCard,
    LogOut,
    Handshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/agents', label: 'Mes agents IA', icon: Bot },
    { href: '/conversations', label: 'Conversations', icon: MessageSquare },
    { href: '/knowledge-base', label: 'Base de connaissances', icon: BookOpen },
    { href: '/handoff', label: 'Prises en main', icon: Handshake },
    { href: '/billing', label: 'Abonnement', icon: CreditCard },
    { href: '/settings', label: 'Paramètres', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { company, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <aside className="w-64 bg-white border-r flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold text-green-700">🌿 Ivoire Agents</h1>
                <p className="text-xs text-gray-400 mt-1 truncate">{company?.name ?? 'Mon entreprise'}</p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            pathname === href || pathname.startsWith(href + '/')
                                ? 'bg-green-50 text-green-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                        {company?.name?.[0]?.toUpperCase() ?? 'E'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{company?.name}</p>
                        <Badge variant="outline" className="text-xs">Starter</Badge>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                </Button>
            </div>
        </aside>
    );
}

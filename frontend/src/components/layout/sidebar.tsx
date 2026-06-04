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
    Users,
    Sparkles,
    GraduationCap,
    Megaphone,
} from 'lucide-react';

const NAV_SECTIONS = [
    {
        label: 'Principal',
        items: [
            { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
            { href: '/conversations', label: 'Conversations', icon: MessageSquare },
            { href: '/handoff', label: 'Prises en main', icon: Handshake },
            { href: '/customers', label: 'Clients CRM', icon: Users },
        ],
    },
    {
        label: 'Configuration',
        items: [
            { href: '/agents', label: 'Agents IA', icon: Bot },
            { href: '/knowledge-base', label: 'Base de connaissances', icon: BookOpen },
            { href: '/training', label: "Centre d'entraînement", icon: GraduationCap },
            { href: '/campaigns', label: 'Campagnes', icon: Megaphone },
        ],
    },
    {
        label: 'Compte',
        items: [
            { href: '/billing', label: 'Abonnement', icon: CreditCard },
            { href: '/settings', label: 'Paramètres', icon: Settings },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { company, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const initial = company?.name?.[0]?.toUpperCase() ?? 'E';

    return (
        <aside className="w-[220px] flex flex-col h-screen border-r shrink-0" style={{ background: '#070910', borderColor: 'rgba(255,255,255,0.06)' }}>
            {/* Logo */}
            <div className="px-5 pt-6 pb-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #f5a623 0%, #fcd34d 100%)' }}>
                        <Sparkles className="w-4 h-4 text-amber-900" />
                    </div>
                    <div>
                        <p className="font-bold text-[13px] leading-none"
                            style={{ background: 'linear-gradient(90deg, #f5a623, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Ivoire Agents
                        </p>
                        <p className="text-[10px] mt-0.5 font-semibold tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>IA PLATFORM</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-4 overflow-y-auto pb-4">
                {NAV_SECTIONS.map(({ label, items }) => (
                    <div key={label}>
                        <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>
                            {label}
                        </p>
                        <div className="space-y-0.5">
                            {items.map(({ href, label: itemLabel, icon: Icon }) => {
                                const isActive = pathname === href || pathname.startsWith(href + '/');
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group',
                                            isActive
                                                ? 'bg-[#f5a62315] text-[#f5a623]'
                                                : 'hover:bg-white/[0.04]'
                                        )}
                                        style={isActive ? {} : { color: 'rgba(255,255,255,0.38)' }}
                                    >
                                        <Icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-[#f5a623]' : 'opacity-50 group-hover:opacity-80')} />
                                        {itemLabel}
                                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#f5a623]" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl mb-1">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0 text-[#f5a623]"
                        style={{ background: 'rgba(245,166,35,0.1)' }}>
                        {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>{company?.name ?? 'Mon entreprise'}</p>
                        <p className="text-[11px] font-medium" style={{ color: 'rgba(245,166,35,0.6)' }}>Plan Starter</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-[13px] transition-all duration-150 hover:bg-red-500/10 hover:text-red-400"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Déconnexion
                </button>
            </div>
        </aside>
    );
}



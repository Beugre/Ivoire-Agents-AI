import { create } from 'zustand';
import api from '@/lib/api';

interface Company {
    id: string;
    name: string;
    email: string;
    sector?: string;
    phone?: string;
    city?: string;
    description?: string;
    whatsappConnected?: boolean;
    whatsappPhoneNumberId?: string;
}

interface AuthState {
    token: string | null;
    company: Company | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    loadFromStorage: () => void;
    updateCompany: (data: Partial<Company>) => Promise<void>;
}

interface RegisterData {
    email: string;
    password: string;
    companyName: string;
    sector: string;
    phone: string;
    city: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    token: null,
    company: null,
    isLoading: false,

    loadFromStorage: () => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('token');
        const companyRaw = localStorage.getItem('company');
        if (token && companyRaw) {
            set({ token, company: JSON.parse(companyRaw) });
        }
    },

    login: async (email, password) => {
        set({ isLoading: true });
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('company', JSON.stringify(data.company));
        set({ token: data.token, company: data.company, isLoading: false });
    },

    register: async (formData) => {
        set({ isLoading: true });
        const { data } = await api.post('/auth/register', formData);
        localStorage.setItem('token', data.token);
        localStorage.setItem('company', JSON.stringify(data.company));
        set({ token: data.token, company: data.company, isLoading: false });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('company');
        set({ token: null, company: null });
    },

    updateCompany: async (updates) => {
        const { data } = await api.patch('/companies/me', updates);
        localStorage.setItem('company', JSON.stringify(data));
        set({ company: data });
    },
}));

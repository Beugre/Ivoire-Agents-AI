'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';

interface FormData {
    name: string;
    sector: string;
    phone: string;
    city: string;
    description: string;
    whatsappPhoneNumberId: string;
}

export default function SettingsPage() {
    const { company, updateCompany } = useAuthStore();
    const { register, handleSubmit, reset } = useForm<FormData>();

    useEffect(() => {
        if (company) {
            reset({
                name: company.name ?? '',
                sector: company.sector ?? '',
                phone: company.phone ?? '',
                city: company.city ?? '',
                description: company.description ?? '',
                whatsappPhoneNumberId: company.whatsappPhoneNumberId ?? '',
            });
        }
    }, [company, reset]);

    const onSubmit = async (data: FormData) => {
        try {
            await updateCompany(data);
            toast.success('Paramètres sauvegardés !');
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        }
    };

    return (
        <div className="p-8 max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Paramètres</h1>
                <p className="text-gray-500 mt-1">Gérez les informations de votre entreprise</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profil entreprise</CardTitle>
                    <CardDescription>Ces informations sont utilisées par votre agent IA</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Nom de l'entreprise</Label>
                                <Input {...register('name')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Secteur</Label>
                                <Input {...register('sector')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Ville</Label>
                                <Input {...register('city')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Téléphone</Label>
                                <Input {...register('phone')} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description de l'activité</Label>
                            <Textarea
                                rows={3}
                                placeholder="Décrivez votre activité..."
                                {...register('description')}
                            />
                        </div>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                            Sauvegarder
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        WhatsApp Business
                        {company?.whatsappConnected ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                                <Wifi className="h-3 w-3 mr-1" />Connecté
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-xs">
                                <WifiOff className="h-3 w-3 mr-1" />Non connecté
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Connectez votre numéro WhatsApp Business pour recevoir et envoyer des messages
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Phone Number ID (Meta)</Label>
                        <Input
                            placeholder="Ex: 123456789012345"
                            {...register('whatsappPhoneNumberId')}
                        />
                        <p className="text-xs text-gray-400">
                            Trouvez ce numéro dans{' '}
                            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                                Meta for Developers
                            </a>{' '}
                            → WhatsApp → Getting Started
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm space-y-2">
                        <p className="font-medium text-amber-800">📋 Configuration requise :</p>
                        <ol className="text-amber-700 space-y-1 list-decimal list-inside">
                            <li>Créez un compte Meta Business</li>
                            <li>Créez une app dans Meta for Developers</li>
                            <li>Activez WhatsApp Business Cloud API</li>
                            <li>Configurez le webhook URL :{' '}
                                <code className="bg-white px-1 rounded">
                                    {typeof window !== 'undefined' ? window.location.origin.replace('3001', '3000') : 'http://localhost:3000'}/api/webhooks/whatsapp
                                </code>
                            </li>
                            <li>Token de vérification : <code className="bg-white px-1 rounded">ivoire_agents_verify_token_2024</code></li>
                        </ol>
                    </div>

                    <Button
                        type="button"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleSubmit(onSubmit)}
                    >
                        Sauvegarder la configuration WhatsApp
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

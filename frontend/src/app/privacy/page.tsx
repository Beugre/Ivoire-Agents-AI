export const metadata = {
    title: 'Politique de confidentialité — Ivoire Agents IA',
    description: 'Politique de confidentialité et protection des données personnelles de la plateforme Ivoire Agents IA.',
};

export default function PrivacyPage() {
    return (
        <div style={{ background: '#080a10', minHeight: '100vh', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px' }}>
                {/* Header */}
                <div style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                        Politique de confidentialité
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                        Dernière mise à jour : 5 juin 2026
                    </p>
                </div>

                <div style={{ lineHeight: '1.8', color: 'rgba(255,255,255,0.75)', fontSize: '15px' }}>
                    <Section title="1. Présentation">
                        <p>
                            Ivoire Agents IA (ci-après « la Plateforme ») est un service SaaS édité par Ivoire Agents, permettant aux entreprises ivoiriennes de déployer des agents conversationnels intelligents sur WhatsApp Business.
                        </p>
                        <p style={{ marginTop: '12px' }}>
                            La présente politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et aux lois applicables en Côte d'Ivoire.
                        </p>
                    </Section>

                    <Section title="2. Données collectées">
                        <p>Nous collectons les données suivantes :</p>
                        <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '8px' }}><strong>Données de compte</strong> : nom de l'entreprise, email, numéro de téléphone, secteur d'activité, ville.</li>
                            <li style={{ marginBottom: '8px' }}><strong>Données WhatsApp Business</strong> : numéro de téléphone professionnel, identifiants WABA (chiffrés), statut de connexion.</li>
                            <li style={{ marginBottom: '8px' }}><strong>Données de conversations</strong> : messages échangés entre vos clients et votre agent IA, dans le cadre de votre activité professionnelle.</li>
                            <li style={{ marginBottom: '8px' }}><strong>Données clients (CRM)</strong> : numéros de téléphone et segments de vos clients, fournis ou collectés via WhatsApp.</li>
                            <li style={{ marginBottom: '8px' }}><strong>Données d'usage</strong> : logs de connexion, statistiques d'utilisation (nombre de messages, tokens consommés).</li>
                        </ul>
                    </Section>

                    <Section title="3. Utilisation des données">
                        <p>Vos données sont utilisées exclusivement pour :</p>
                        <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '8px' }}>Fournir et améliorer le service de réponse automatique WhatsApp.</li>
                            <li style={{ marginBottom: '8px' }}>Générer des réponses IA via l'API OpenAI (les messages sont transmis de manière sécurisée).</li>
                            <li style={{ marginBottom: '8px' }}>Gérer votre abonnement et la facturation.</li>
                            <li style={{ marginBottom: '8px' }}>Vous envoyer des notifications techniques relatives au service.</li>
                        </ul>
                        <p style={{ marginTop: '12px' }}>Nous ne vendons, ne louons et ne partageons jamais vos données avec des tiers à des fins commerciales.</p>
                    </Section>

                    <Section title="4. Données WhatsApp et Meta">
                        <p>
                            Dans le cadre de l'intégration WhatsApp Business via Meta, nous accédons aux données suivantes conformément aux <a href="https://www.whatsapp.com/legal/business-policy" style={{ color: '#f5a623' }} target="_blank" rel="noopener noreferrer">Règles pour les Entreprises WhatsApp</a> :
                        </p>
                        <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '8px' }}>Numéro de téléphone WhatsApp Business de votre entreprise.</li>
                            <li style={{ marginBottom: '8px' }}>Identifiant du compte WABA (WhatsApp Business Account).</li>
                            <li style={{ marginBottom: '8px' }}>Messages entrants de vos clients (traitement automatique uniquement).</li>
                        </ul>
                        <p style={{ marginTop: '12px' }}>
                            Les tokens d'accès Meta sont chiffrés avec AES-256 et stockés uniquement côté serveur. Ils ne sont jamais exposés au navigateur ni à des tiers.
                        </p>
                    </Section>

                    <Section title="5. Sécurité des données">
                        <p>Nous mettons en œuvre les mesures de sécurité suivantes :</p>
                        <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '8px' }}>Chiffrement des tokens d'accès (AES-256-GCM).</li>
                            <li style={{ marginBottom: '8px' }}>Communications chiffrées en HTTPS/TLS.</li>
                            <li style={{ marginBottom: '8px' }}>Authentification par JWT avec expiration.</li>
                            <li style={{ marginBottom: '8px' }}>Base de données accessible uniquement depuis les serveurs de la Plateforme.</li>
                            <li style={{ marginBottom: '8px' }}>Mots de passe hashés avec bcrypt (facteur 12).</li>
                        </ul>
                    </Section>

                    <Section title="6. Conservation des données">
                        <p>
                            Vos données sont conservées pendant toute la durée de votre abonnement actif, et supprimées dans un délai de 30 jours suivant la résiliation de votre compte, sur demande écrite.
                        </p>
                    </Section>

                    <Section title="7. Vos droits">
                        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                        <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '8px' }}><strong>Accès</strong> : obtenir une copie de vos données.</li>
                            <li style={{ marginBottom: '8px' }}><strong>Rectification</strong> : corriger des données inexactes.</li>
                            <li style={{ marginBottom: '8px' }}><strong>Suppression</strong> : demander l'effacement de vos données.</li>
                            <li style={{ marginBottom: '8px' }}><strong>Portabilité</strong> : recevoir vos données dans un format structuré.</li>
                            <li style={{ marginBottom: '8px' }}><strong>Opposition</strong> : vous opposer à certains traitements.</li>
                        </ul>
                        <p style={{ marginTop: '12px' }}>Pour exercer ces droits, contactez-nous à : <strong>privacy@ivoire-agents.com</strong></p>
                    </Section>

                    <Section title="8. Cookies">
                        <p>
                            La Plateforme utilise uniquement des cookies techniques nécessaires au fonctionnement du service (session d'authentification). Aucun cookie publicitaire ou de suivi tiers n'est utilisé.
                        </p>
                    </Section>

                    <Section title="9. Contact">
                        <p>
                            Pour toute question relative à cette politique de confidentialité :<br />
                            <strong>Email</strong> : privacy@ivoire-agents.com<br />
                            <strong>Adresse</strong> : Abidjan, Côte d'Ivoire 🇨🇮
                        </p>
                    </Section>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'white', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {title}
            </h2>
            {children}
        </div>
    );
}

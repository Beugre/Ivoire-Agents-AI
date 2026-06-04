# 🌿 Ivoire Agents IA — MVP 1

Plateforme SaaS d'employés virtuels IA pour les entreprises en Côte d'Ivoire.
Répondez automatiquement à vos clients via **WhatsApp** 24h/24.

---

## Structure du projet

```
Ivoire-agents-AI/
├── backend/          # API NestJS + PostgreSQL
├── frontend/         # Interface Next.js + Tailwind + shadcn/ui
├── docker-compose.yml
├── nginx.conf
└── .env.example
```

---

## Démarrage rapide (développement)

### Prérequis
- Node.js 20+
- PostgreSQL (local ou via Docker)
- Clé API OpenAI

### 1. Cloner et installer

```bash
# Backend
cd backend
cp .env.example .env
# Remplissez les variables dans .env
npm install
npm run start:dev

# Frontend (nouveau terminal)
cd frontend
npm install
npm run dev
```

### 2. Démarrage avec Docker (recommandé)

```bash
cp .env.example .env
# Editez .env avec vos clés API
docker-compose up -d
```

- Frontend : http://localhost:3001
- Backend API : http://localhost:3000/api
- PostgreSQL : localhost:5432

---

## Variables d'environnement

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL PostgreSQL |
| `JWT_SECRET` | Secret JWT (min 32 chars) |
| `OPENAI_API_KEY` | Clé API OpenAI |
| `WHATSAPP_ACCESS_TOKEN` | Token WhatsApp Business Cloud API |
| `WHATSAPP_VERIFY_TOKEN` | Token de vérification webhook |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL du backend (ex: http://localhost:3000/api) |

---

## Configuration WhatsApp

1. Créez un compte [Meta for Developers](https://developers.facebook.com)
2. Créez une app avec WhatsApp Business Cloud API
3. Configurez le webhook :
   - **URL** : `https://votre-domaine.com/api/webhooks/whatsapp`
   - **Token de vérification** : `ivoire_agents_verify_token_2024` (ou celui de votre .env)
   - **Champs** : `messages`
4. Ajoutez le **Phone Number ID** dans les paramètres de votre entreprise sur la plateforme

---

## API principales

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription entreprise |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/agents` | Liste des agents |
| POST | `/api/agents` | Créer un agent |
| GET | `/api/conversations` | Conversations |
| GET | `/api/conversations/stats` | Statistiques |
| POST | `/api/knowledge-base` | Ajouter une info |
| GET | `/api/webhooks/whatsapp` | Vérification webhook |
| POST | `/api/webhooks/whatsapp` | Réception messages |

---

## Déploiement VPS (Hetzner / DigitalOcean)

```bash
# 1. Sur votre VPS (Ubuntu 22.04)
apt update && apt install -y docker.io docker-compose nginx certbot

# 2. Cloner le projet
git clone https://github.com/votre-repo/ivoire-agents-ai.git
cd ivoire-agents-ai

# 3. Configurer les variables d'environnement
cp .env.example .env
nano .env  # Remplir toutes les variables

# 4. Lancer avec Docker
docker-compose up -d

# 5. Configurer Nginx
cp nginx.conf /etc/nginx/sites-available/ivoire-agents
ln -s /etc/nginx/sites-available/ivoire-agents /etc/nginx/sites-enabled/
# Remplacer yourdomain.com par votre domaine dans nginx.conf
certbot --nginx -d yourdomain.com
systemctl reload nginx
```

---

## Plans d'abonnement MVP 1

| Plan | Prix | Agents | Messages/mois |
|---|---|---|---|
| Starter | Gratuit | 1 | 1 000 |
| Business | 25 000 FCFA/mois | 3 | 10 000 |
| Enterprise | Sur devis | Illimité | Illimité |

---

## Roadmap

- **MVP 1** ✅ Agent WhatsApp IA + Dashboard + Base de connaissances
- **MVP 2** 🔜 Agents vocaux (Twilio + OpenAI Realtime)
- **MVP 3** 🔜 Omnicanal + CRM + Mobile Money

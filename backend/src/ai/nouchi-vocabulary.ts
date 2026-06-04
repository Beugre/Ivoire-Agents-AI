/**
 * Vocabulaire Nouchi — argot abidjanais / ivoirien
 * Utilisé par le moteur IA quand le ton "ivoirien" est sélectionné.
 * Sources : wikipedia Nouchi, nouchi.com, corpus abidjanais.
 */

export interface NouchiWord {
    mot: string;
    sens: string;
    exemple?: string;
}

// ─── Salutations & expressions courantes ────────────────────────────────────
export const SALUTATIONS: NouchiWord[] = [
    { mot: "C'est comment ?", sens: "Comment ça va ?", exemple: "C'est comment frê ?" },
    { mot: "Sava", sens: "Ça va (salut rapide)", exemple: "Sava wêwê ?" },
    { mot: "Wêwê", sens: "Vraiment / exactement", exemple: "C'est wêwê !" },
    { mot: "Yako", sens: "Désolé pour toi / compatir", exemple: "Yako, c'est dommage." },
    { mot: "Ya fohi / Ya foye", sens: "D'accord / pas de problème / OK", exemple: "Ya fohi, on va gérer." },
    { mot: "Ya drap", sens: "Il y a des problèmes", exemple: "Attention, ya drap ici." },
    { mot: "Cohan / Conhan", sens: "Comme ça / de cette façon", exemple: "Faut faire cohan." },
    { mot: "Kessia ?", sens: "Qu'est-ce qu'il y a ?", exemple: "Kessia, t'as un problème ?" },
    { mot: "Prends mon gbô", sens: "Salutation fraternelle (serrage de main)", exemple: "Prends mon gbô, frê !" },
    { mot: "Mon frê / frê", sens: "Mon frère / ami", exemple: "Frê, c'est comment ?" },
    { mot: "Bramôgô", sens: "Ami proche, compagnon", exemple: "Mon bramôgô, j'ai besoin d'toi." },
    { mot: "Badé", sens: "Ami", exemple: "Badé, on se voit quand ?" },
    { mot: "Vié père / Grando", sens: "Grand frère, doyen, aîné", exemple: "C'est mon grando qui m'a appris." },
    { mot: "Dõgõ fari", sens: "Petit frère", exemple: "Mon dõgõ fari est là." },
    { mot: "Go", sens: "Femme, fille, petite amie", exemple: "Ma go est là." },
    { mot: "Môgô / Mogo", sens: "Personne, homme, pote", exemple: "C'est un bon môgô." },
];

// ─── Affirmations & approbation ─────────────────────────────────────────────
export const APPROBATION: NouchiWord[] = [
    { mot: "C'est gbê !", sens: "C'est vrai ! / C'est exact !", exemple: "C'est gbê, t'as raison." },
    { mot: "C'est béon", sens: "C'est bien / c'est bon", exemple: "C'est béon ça !" },
    { mot: "Kpata / Kpata-kpata", sens: "Beau, neuf, au point, parfait", exemple: "Ton truc est kpata !" },
    { mot: "Yafor", sens: "D'accord / OK", exemple: "Yafor, on fait comme ça." },
    { mot: "C'est chaud", sens: "C'est bien / impressionnant", exemple: "C'est chaud comme affaire !" },
    { mot: "Ça t'enjaille ?", sens: "Ça te plaît ?", exemple: "Notre service t'enjaille ?" },
    { mot: "Djafoule", sens: "Tout donner, impressionner", exemple: "Il a djafoule à la présentation." },
    { mot: "C'est cool là", sens: "C'est bien / sans problème", exemple: "C'est cool là, on va gérer." },
    { mot: "Gbai", sens: "Vérité / conseil", exemple: "Je te donne le gbai : faut pas tarder." },
    { mot: "Fianss", sens: "Confiance", exemple: "J'ai fianss en nos services." },
];

// ─── Actions & verbes courants ───────────────────────────────────────────────
export const VERBES: NouchiWord[] = [
    { mot: "Gérer", sens: "S'occuper de / régler un problème", exemple: "On va gérer ça pour toi." },
    { mot: "Zié / Zinzé", sens: "Voir / regarder", exemple: "Viens zié le produit." },
    { mot: "Dendjô", sens: "Comprendre / piger", exemple: "T'as dendjô ce que j'ai dit ?" },
    { mot: "Soutra", sens: "Aider, sauver, dépanner", exemple: "On va te soutra." },
    { mot: "Brobro", sens: "Chercher / travailler dur", exemple: "Il faut brobro pour y arriver." },
    { mot: "Enjailler / S'enjailler", sens: "S'amuser, être content, plaire", exemple: "Tu vas t'enjailler avec notre service !" },
    { mot: "Décaler / Fraya / Béou", sens: "Partir, s'en aller", exemple: "OK, je vais décaler là." },
    { mot: "Djedj / Dédja", sens: "Ouvrir / ouvert", exemple: "Le magasin est dédja." },
    { mot: "Flo", sens: "Partir", exemple: "On doit flo maintenant." },
    { mot: "Lâcher / Gué", sens: "Donner", exemple: "Gue-moi l'infos là !" },
    { mot: "Sri", sens: "Attraper / saisir", exemple: "Sri l'occasion !" },
    { mot: "Dindin", sens: "Regarder / hésiter / surveiller", exemple: "Dindin bien avant d'acheter." },
    { mot: "Kener", sens: "Planifier / dealer / organiser", exemple: "On va kener ça ensemble." },
    { mot: "Daba", sens: "Manger / frapper", exemple: "On va aller daba ?" },
    { mot: "Gbahé", sens: "Gronder / conseiller / s'absenter", exemple: "Il m'a gbahé pour rien." },
    { mot: "Gbagboter", sens: "Marcher longtemps / aller loin à pied", exemple: "J'ai gbagboté pour venir ici." },
    { mot: "Flôcô", sens: "Mentir", exemple: "Faut pas flôcô avec moi." },
    { mot: "Loger / Mettre gorge", sens: "Duper, arnaquer", exemple: "Méfie-toi, y'a des gens qui logent." },
    { mot: "Dj̃o / Djõ", sens: "Tenir, prendre", exemple: "Djõ ça pour moi stp." },
    { mot: "Faroter", sens: "Frimer / faire le beau", exemple: "Il est en train de faroter." },
    { mot: "Damer", sens: "Laisser tomber / abandonner", exemple: "Faut pas damer ton client." },
    { mot: "Ganman", sens: "Rouler vite / aller rapidement", exemple: "Le livreur va ganman." },
    { mot: "Pantougouler", sens: "Fuir / s'échapper", exemple: "Il a pantougoulé avec la commande." },
    { mot: "Enjaillement", sens: "Fête, bonne humeur, amusement", exemple: "C'est l'enjaillement total !" },
];

// ─── Commerce & argent ───────────────────────────────────────────────────────
export const ARGENT: NouchiWord[] = [
    { mot: "Djê / Pierre / Zoto", sens: "L'argent", exemple: "T'as le djê pour payer ?" },
    { mot: "Barre", sens: "1 000 FCFA", exemple: "Ça coûte deux barres." },
    { mot: "Moro", sens: "5 FCFA", exemple: "C'est à un moro." },
    { mot: "Plomb / Togo / Plon", sens: "100 FCFA", exemple: "Donne-moi deux plombs de crédit." },
    { mot: "Gbèss / Gbèssè", sens: "500 FCFA", exemple: "Ça fait un gbèss." },
    { mot: "Bâ / Krika", sens: "1 000 FCFA", exemple: "C'est deux krikas." },
    { mot: "Chelsea", sens: "2 000 FCFA", exemple: "Ça coûte un chelsea." },
    { mot: "Gbonhon / Key / Gbon", sens: "5 000 FCFA", exemple: "C'est un gbonhon." },
    { mot: "Rougeau / Rougeot / Arobase", sens: "10 000 FCFA", exemple: "Donne un rougeau." },
    { mot: "Une brique", sens: "1 000 000 FCFA", exemple: "Il a posé une brique." },
    { mot: "Tiasse / Moisi / Perdre réseau", sens: "Être fauché / sans argent", exemple: "Je suis tiasse là, peux pas payer." },
    { mot: "Bédou", sens: "Portefeuille / porte-monnaie", exemple: "Mon bédou est vide !" },
    { mot: "Groto", sens: "Homme riche / bourgeois", exemple: "C'est un groto ce client-là." },
    { mot: "Ken / Wéh", sens: "Affaire / deal / truc", exemple: "T'as un bon ken pour moi ?" },
    { mot: "Kener / Wéman", sens: "Planifier / dealeur / vendeur", exemple: "Le wéman a tout le stock." },
    { mot: "Brouteur", sens: "Arnaqueur", exemple: "Méfie-toi des brouteurs en ligne." },
    { mot: "Broutage", sens: "Arnaque", exemple: "C'est du broutage ce site-là." },
    { mot: "Faux-type", sens: "Hypocrite / malhonnête", exemple: "Ce commerçant est un faux-type." },
    { mot: "Grosse", sens: "25 FCFA", exemple: "C'est deux grosses." },
    { mot: "Sogban", sens: "75 FCFA", exemple: "Ça fait un sogban de monnaie." },
    { mot: "Rienneux", sens: "Personne sans argent, très pauvre", exemple: "Faut pas traiter quelqu'un de rienneux." },
];

// ─── Transport & lieux ───────────────────────────────────────────────────────
export const TRANSPORT: NouchiWord[] = [
    { mot: "Gbaka", sens: "Minibus collectif (transport commun)", exemple: "Prends le gbaka jusqu'à Adjamé." },
    { mot: "Woro-woro", sens: "Taxi collectif / taxi communal", exemple: "Le woro-woro part vers Cocody." },
    { mot: "Warren", sens: "Taxi", exemple: "On va prendre un warren." },
    { mot: "Panneau", sens: "Bus (SOTRA)", exemple: "Attends le panneau là-bas." },
    { mot: "Glôglô", sens: "Couloirs / raccourcis / bas quartier", exemple: "Passe par le glôglô, c'est plus court." },
    { mot: "Wôtro", sens: "Hôtel", exemple: "Il est au wôtro du quartier." },
    { mot: "007", sens: "Orange CI (l'opérateur 07)", exemple: "Envoie sur mon 007." },
    { mot: "Bingue / Bengué", sens: "Europe / France", exemple: "Il est parti au bingue." },
    { mot: "Binguiste", sens: "Quelqu'un qui vient d'Europe / de France", exemple: "Ce binguiste là parle trop." },
    { mot: "France-au-revoir", sens: "Voiture d'occasion importée", exemple: "Il a acheté une france-au-revoir." },
];

// ─── Qualités & descriptions ─────────────────────────────────────────────────
export const DESCRIPTIONS: NouchiWord[] = [
    { mot: "Gaou", sens: "Naïf / ignorant / pas branché / plouc", exemple: "Faut pas faire le gaou." },
    { mot: "Borlaï", sens: "Ignorant", exemple: "Ce mec est borlaï." },
    { mot: "Gawa / Gnata", sens: "Ringard / très ignorant", exemple: "Ne sois pas gawa." },
    { mot: "Grouilleur", sens: "Débrouillard", exemple: "C'est un bon grouilleur ce livreur." },
    { mot: "Djanterman", sens: "Homme stylé", exemple: "Le chef c'est un djanterman." },
    { mot: "Tika", sens: "Bien habillé", exemple: "Il est tika aujourd'hui." },
    { mot: "Pain", sens: "Beau / belle gosse", exemple: "C'est un pain ce garçon." },
    { mot: "Zo / Zota", sens: "Beau (neutre) / belle", exemple: "La go est zota !" },
    { mot: "Agboloh / Gbôlôzailli", sens: "Musclé / costaud", exemple: "Il est agboloh ce livreur." },
    { mot: "Zinzin", sens: "Fou / givré", exemple: "Il est un peu zinzin ce client-là." },
    { mot: "Were were", sens: "Affranchie / délurée", exemple: "Cette go est were were." },
    { mot: "Soayé", sens: "Méchant / mauvais", exemple: "C'est soayé comme traitement." },
    { mot: "Foul", sens: "Plein / beaucoup", exemple: "Y'a foul de monde aujourd'hui." },
    { mot: "Bôrô", sens: "Beaucoup / fan / sac", exemple: "Y'a bôrô de commandes !" },
    { mot: "Djossi / Brobroli", sens: "Travail / taf / boulot", exemple: "On a du djossi à faire." },
    { mot: "Zogor", sens: "Quelque chose d'ennuyeux / pénible", exemple: "C'est un zogor ce problème." },
    { mot: "Cra-cra", sens: "Dur / compliqué / difficile", exemple: "La livraison est cra-cra là-bas." },
    { mot: "Façon / Façon façon", sens: "Bizarre / très bizarre", exemple: "Il a fait façon façon." },
    { mot: "Dêmin-dêmin", sens: "Se débrouiller", exemple: "On va dêmin-dêmin pour trouver." },
    { mot: "Dibi-dibi", sens: "Louche / suspect", exemple: "Ce vendeur est dibi-dibi." },
    { mot: "Gbairè", sens: "Commérage / ragot", exemple: "Faut pas faire les gbairès." },
    { mot: "Kpakpato", sens: "Bavard / indiscret / rapporteur", exemple: "Ne sois pas un kpakpato." },
];

// ─── Situations & expressions figées ─────────────────────────────────────────
export const EXPRESSIONS: NouchiWord[] = [
    { mot: "Ya drap !", sens: "Il y a un problème !", exemple: "Attention ya drap avec cette commande !" },
    { mot: "Faut blèblè", sens: "Il faut y aller doucement / faire attention", exemple: "Faut blèblè avec ce client." },
    { mot: "Tout laisse", sens: "On ne sait jamais / ce que t'as peut disparaître", exemple: "Tout laisse, profite pendant que tu peux." },
    { mot: "Ne prend pas ma bouche pour manger piment", sens: "Ne me cite pas pour critiquer / m'impliquer", exemple: "Eh, ne prend pas ma bouche pour manger piment !" },
    { mot: "Il n'a pas ses 25/25 complets", sens: "Il est un peu fou / pas tout à fait sain d'esprit", exemple: "Ce client-là n'a pas ses 25/25 complets." },
    { mot: "Ça t'as gôh / Ça t'as raté", sens: "C'est bien fait pour toi", exemple: "T'avais qu'à écouter — ça t'as gôh !" },
    { mot: "Yê suis kpin", sens: "Je suis présent / disponible", exemple: "Yê suis kpin pour t'aider." },
    { mot: "Anango plan", sens: "Fausse promesse / petite arnaque", exemple: "Faut pas faire d'anango plan." },
    { mot: "Perdre réseau", sens: "Être fauché OU être complètement perdu/saoul", exemple: "J'ai perdu réseau cette semaine." },
    { mot: "Kramgba / Au cohi", sens: "Quelqu'un qui s'incruste", exemple: "Il est kramgba, il veut pas partir." },
    { mot: "Dõgõ sur", sens: "Petite sœur", exemple: "Ma dõgõ sur m'a aidé." },
    { mot: "Hé Dja !", sens: "Hé Dieu ! (exclamation)", exemple: "Hé Dja, ce prix est trop élevé !" },
    { mot: "Boro d'enjaillement", sens: "Quelqu'un qui fait le show / ambiance", exemple: "Il est le boro d'enjaillement de la soirée." },
    { mot: "Vié père", sens: "Grand frère / doyen / ancêtre", exemple: "Respecte le vié père." },
    { mot: "Fousseni / Djon gninin", sens: "Foutaise / sans valeur", exemple: "C'est des fousseni tout ça !" },
    { mot: "Gbonhi", sens: "Groupe / bande", exemple: "Viens rejoindre notre gbonhi." },
    { mot: "Atalaku", sens: "Faire l'éloge de quelqu'un", exemple: "Il a fait l'atalaku pour le patron." },
    { mot: "Djaprapanpali", sens: "Long discours donné par quelqu'un", exemple: "Il a fait un djaprapanpali de 30 minutes." },
    { mot: "Gnan", sens: "Ignorer quelqu'un", exemple: "Faut pas gnan le client !" },
    { mot: "Blanco", sens: "Européen / blanc", exemple: "Le blanco a commandé." },
    { mot: "Peau-gra", sens: "Blanc (= peau grattée, argot)", exemple: "Un peau-gra est dans la boutique." },
    { mot: "Gbaire", sens: "Ragots / médisances", exemple: "Y'a des gbaires qui circulent." },
];

// ─── Lexique complet — export principal ──────────────────────────────────────
export const NOUCHI_LEXIQUE: NouchiWord[] = [
    ...SALUTATIONS,
    ...APPROBATION,
    ...VERBES,
    ...ARGENT,
    ...TRANSPORT,
    ...DESCRIPTIONS,
    ...EXPRESSIONS,
];

/**
 * Génère le bloc de contexte nouchi à injecter dans le prompt système IA.
 * On n'injecte pas les 500 mots (trop de tokens) mais une sélection
 * des expressions les plus utiles en contexte commercial/client.
 */
export function buildNouchiContext(): string {
    const selection = [
        ...SALUTATIONS,
        ...APPROBATION.slice(0, 8),
        ...VERBES.slice(0, 12),
        ...ARGENT.slice(0, 10),
        ...EXPRESSIONS.slice(0, 10),
        ...DESCRIPTIONS.slice(0, 8),
    ];

    const lines = selection
        .map((w) => `• ${w.mot} → ${w.sens}${w.exemple ? ` (ex: "${w.exemple}")` : ''}`)
        .join('\n');

    return `VOCABULAIRE NOUCHI — Expressions ivoiriennes à utiliser naturellement quand le ton est "ivoirien" :
${lines}

Règles d'usage :
- Mélange naturellement le français ivoirien et le nouchi, ne force pas.
- Utilise les salutations nouchi en ouverture (C'est comment ?, Sava, Prends mon gbô...).
- Exprime l'approbation avec : Ya fohi, C'est gbê, Kpata, Yafor.
- Pour les prix : utilise les noms nouchi des billets (barre, gbèss, krikas, rougeau) en plus du montant FCFA.
- Pour exprimer de la compassion : Yako.
- Pour rassurer : Ya fohi, C'est cool là, On va gérer.
- Si le client écrit en nouchi, réponds en nouchi/français ivoirien mixte.
`;
}

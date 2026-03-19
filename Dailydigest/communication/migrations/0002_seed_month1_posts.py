"""
Data migration : importe les posts du Mois 1 de la strategie de communication.
"""
from django.db import migrations


MONTH1_POSTS = [
    # ══ DAY 1 - Launch ══
    {"day": 1, "date_label": "Jour 1 - Lancement", "month": 1, "platform": "facebook", "post_type": "promotionnel",
     "text": "🚀 DailyDigest se lance AUJOURD'HUI !\n\nMarre de passer 1 heure a chercher les infos importantes ?\n\nDailyDigest cree VOTRE digest personnalise chaque matin avec les articles les plus pertinents sur les sujets qui VOUS interessent.\n\n✨ Technologie • Business • Crypto • Emploi • Et plus\n\nC'est gratuit, c'est rapide, c'est intelligent.\n\nPret(e) ? 👇",
     "hashtags": ["#DailyDigest", "#Tech", "#AfricanStartups", "#Productivity"],
     "image_description": "Image hero avec logo DailyDigest centre, montrant l'interface newsletter avec articles epingles. Couleurs: bleu (#2E75B6) et blanc. Design moderne, minimaliste.",
     "cta": "Inscrivez-vous gratuitement", "objective": "Generer les premieres inscriptions et creer le buzz de lancement"},
    {"day": 1, "date_label": "Jour 1 - Lancement", "month": 1, "platform": "linkedin", "post_type": "informatif",
     "text": "🎯 Un probleme que tout professionnel connait :\n\n📰 Trop d'information\n⏰ Pas assez de temps\n🤯 Difficile de rester informe\n\nC'est pourquoi nous lancons DailyDigest.\n\nUne plateforme SaaS qui utilise l'IA pour selectionner et resumer les actualites les plus pertinentes pour VOUS — directement dans votre boite mail chaque matin.\n\n✅ Selection intelligente\n✅ Resumes precis\n✅ Personnalise selon vos interets\n\nQue ce soit tech, business, crypto ou carrieres — DailyDigest vous tient informe sans vous submerger.\n\n🚀 Lancons-nous ensemble ! Rejoignez-nous aujourd'hui.",
     "hashtags": ["#AI", "#SaaS", "#Innovation", "#News", "#Productivity"],
     "image_description": "Infographie montrant Probleme vs Solution. Gauche: personne submergee par l'info (emojis 📚📰). Droite: interface DailyDigest avec articles organises. Texte: 'Surcharge d'info → Curation intelligente'.",
     "cta": "Essayez DailyDigest", "objective": "Etablir la credibilite et attirer les early adopters sur LinkedIn"},
    {"day": 1, "date_label": "Jour 1 - Lancement", "month": 1, "platform": "twitter", "post_type": "promotionnel",
     "text": "🚀 We're live!\n\nTired of drowning in news? DailyDigest uses AI to send you personalized news summaries every morning.\n\n✨ Curated • Summarized • Smart\n\nNo more endless scrolling. Just the news that matters to YOU.\n\nJoin us → dailydigest.ai\n\n#AI #SaaS #Startups #Tech",
     "hashtags": ["#AI", "#SaaS", "#Startups", "#News"],
     "image_description": "Visuel tweet avec style animation: ecran mobile montrant l'interface DailyDigest, articles epingles, horloge montrant 6h du matin. Couleur: bleu vibrant.",
     "cta": "Sign up free", "objective": "Creer le buzz initial sur Twitter et attirer l'audience tech anglophone"},

    # ══ DAY 2 ══
    {"day": 2, "date_label": "Jour 2", "month": 1, "platform": "facebook", "post_type": "informatif",
     "text": "Le saviez-vous ? 📊\n\nUn adulte moyen consomme l'equivalent de :\n📰 34 Go d'information par jour\n⏱️ Prend en moyenne 1h45min par jour\n\nPourtant...\n❌ 65% des gens se sentent mal informes\n❌ 78% ratent les infos vraiment importantes\n\nPourquoi ?\n\nParce qu'on n'est pas des machines. On ne peut pas tout traiter. On a besoin d'AIDE.\n\nC'est la que DailyDigest intervient.\n\nDecouvrez comment l'IA peut vous aider a vous informer intelligemment. 🧠",
     "hashtags": ["#Infographie", "#DailyDigest", "#Intelligence"],
     "image_description": "Infographie de statistiques avec icones. Montrer: 34Go de donnees, 1h45min de temps, 65% mal informes. Design avec graphiques colores (bleu, vert, orange).",
     "cta": "En savoir plus", "objective": "Eduquer sur le probleme et creer de l'empathie"},
    {"day": 2, "date_label": "Jour 2", "month": 1, "platform": "linkedin", "post_type": "informatif",
     "text": "📈 Comment les grands leaders restent informes\n\nBezos: 3 journaux chaque matin\nSatya Nadella: \"Je lis 15-20 articles par semaine\"\nSundar Pichai: Regime informationnel structure\n\nQu'ont-ils en commun ?\n\n✅ Ils ne lisent pas TOUT\n✅ Ils lisent ce qui est PERTINENT\n✅ Ils utilisent des SYSTEMES pour filtrer\n\nMais comment les professionnels occupes font-ils a grande echelle ?\n\nAvec les bons outils.\n\nDailyDigest est exactement ca — votre systeme personnel de curation d'actualites.\n\nPret a lire comme un leader ? 🚀",
     "hashtags": ["#Leadership", "#Productivity", "#AI", "#News"],
     "image_description": "Collage avec portraits stylises de leaders tech (Bezos, Nadella, Pichai) + logo DailyDigest. Texte: 'Comment les Top Leaders Restent Informes' avec coches.",
     "cta": "Essayez maintenant", "objective": "Associer DailyDigest aux leaders et figures inspirantes"},
    {"day": 2, "date_label": "Jour 2", "month": 1, "platform": "twitter", "post_type": "informatif",
     "text": "Stats that hit different:\n\n📊 34GB of info per day\n⏰ 1h45min consumed\n❌ 65% still feel uninformed\n\nThe problem isn't lack of information.\n\nIt's lack of CURATION.\n\nThat's why DailyDigest exists.\n\n#AI #InfoOverload",
     "hashtags": ["#AI", "#InfoOverload", "#Tech"],
     "image_description": "Tweet avec 3 icones statistiques alignees. Design epure, minimaliste. Chiffres en gras, couleur bleue.",
     "cta": "Learn more", "objective": "Partager des insights pertinents pour l'audience tech"},

    # ══ DAY 3 ══
    {"day": 3, "date_label": "Jour 3", "month": 1, "platform": "facebook", "post_type": "promotionnel",
     "text": "Votez pour vos 3 sujets PREFERES ! 👇\n\nChaque matin, DailyDigest cree un digest special pour VOS interets.\n\nQuels sujets vous interessent le plus ?\n\n🚀 Technologie\n💰 Crypto & Finance\n💼 Business & Startups\n👨\u200d💼 Carriere & Emploi\n🌍 Actualites generales\n🎨 Design & Innovation\n\nCommentez vos choix ci-dessous ! On verra les sujets les plus demandes. 🎯",
     "hashtags": ["#VoteCommunaute", "#DailyDigest", "#VotreChoix"],
     "image_description": "Sondage visuel avec 6 categories illustrees par des emojis et icones. Chaque categorie avec une couleur differente. Design engageant.",
     "cta": "Commentez vos sujets", "objective": "Engager la communaute et collecter les preferences"},
    {"day": 3, "date_label": "Jour 3", "month": 1, "platform": "linkedin", "post_type": "informatif",
     "text": "🔍 Deep Dive: La curation d'actualites a l'ere de l'IA\n\nLes journalistes traditionnels ont un metier: filtrer.\n\nAvant:\n- 100 articles → 10 publies\n- Expertise humaine = filtrage\n\nAujourd'hui:\n- 100 000+ articles/jour\n- L'IA devient le filtre humain\n\nMais l'IA seule ne suffit pas.\n\nLe secret ? L'INTELLIGENCE HYBRIDE:\n✅ L'IA pour decouvrir\n✅ L'expertise humaine pour valider\n✅ Les preferences personnelles pour personnaliser\n\nC'est la base de DailyDigest.\n\nComment restez-VOUS informe en 2025 ?",
     "hashtags": ["#AI", "#Innovation", "#MediaTech"],
     "image_description": "Comparaison Avant/Apres avec timeline. Avant: journaliste avec pile de papiers. Apres: interface DailyDigest avec IA. Timeline montrant l'evolution de la curation.",
     "cta": "Discutons", "objective": "Etablir le thought leadership sur la tech de curation"},
    {"day": 3, "date_label": "Jour 3", "month": 1, "platform": "twitter", "post_type": "informatif",
     "text": "The future of news isn't more articles.\n\nIt's better CURATION.\n\nAI helps discover.\nHuman expertise validates.\nPersonal taste personalizes.\n\nThat's hybrid intelligence.\n\nThat's DailyDigest.\n\n#AI #MediaTech",
     "hashtags": ["#AI", "#MediaTech", "#News"],
     "image_description": "Flowchart simple: icone IA → icone Humain → icone ContenuPersonnalise. Chaque etape avec couleur.",
     "cta": "Join us", "objective": "Partager des insights sur la curation et l'innovation media"},

    # ══ DAY 4 ══
    {"day": 4, "date_label": "Jour 4", "month": 1, "platform": "facebook", "post_type": "preuve_sociale",
     "text": "L'histoire de DailyDigest commence par une question :\n\n\"Pourquoi dois-je passer 2 heures par jour sur les actus si j'ai vraiment besoin de connaitre que 5-10 choses ?\"\n\nCe sentiment nous hantait depuis des annees.\n\nComme beaucoup d'entre vous, on etait :\n📱 Submerges par le bruit\n😴 Fatigues de scroller\n😰 Stresses de rater des trucs importants\n\nEt en plus, on etait developpeurs. 😄\n\nAlors au lieu de juste se plaindre, on a decide de CONSTRUIRE.\n\nAujourd'hui DailyDigest existe parce qu'on a cree la solution qu'on voulait.\n\nEt maintenant ?\n\nOn la partage avec vous. ❤️",
     "hashtags": ["#Fondation", "#Histoire", "#DailyDigest"],
     "image_description": "Design narratif avec timeline 'Notre Parcours': probleme → frustration → idee → construction → lancement. Avec emojis et illustrations minimalistes.",
     "cta": "Rejoignez notre aventure", "objective": "Humaniser la marque et creer une connexion emotionnelle"},
    {"day": 4, "date_label": "Jour 4", "month": 1, "platform": "linkedin", "post_type": "preuve_sociale",
     "text": "Lancer une startup c'est 99% de doute.\n\nJusqu'a ce que tu livres.\n\nOn a commence DailyDigest il y a 6 mois avec une simple question: \"Et si on pouvait automatiser la partie ennuyeuse de s'informer ?\"\n\nAujourd'hui, on a lance.\n\n100+ utilisateurs en premiere heure.\n1 000+ inscriptions projetees.\n\nMais les chiffres ne sont pas le sujet.\n\nLe sujet: on a construit quelque chose en quoi on croit.\nEt ca resonne avec les gens qui ressentent la meme chose.\n\nA chaque fondateur qui galere: continuez.\nA chaque utilisateur potentiel: on a construit ca pour vous.\n\nDisruptons l'industrie de l'info ensemble. 🚀",
     "hashtags": ["#Startup", "#Founders", "#DailyDigest"],
     "image_description": "Style temoignage: photo d'equipe startup (stylisee) avec citation: '99% de doute jusqu'a ce que tu livres.' Design inspirant avec couleurs vibrantes.",
     "cta": "Rejoignez-nous", "objective": "Attirer d'autres fondateurs et construire la credibilite startup"},
    {"day": 4, "date_label": "Jour 4", "month": 1, "platform": "twitter", "post_type": "preuve_sociale",
     "text": "6 months of building.\n1 day of shipping.\n1,000+ signups.\n\nStarting a startup is 99% doubt until you ship.\n\nWe shipped DailyDigest.\n\nNow it's your turn. 🚀\n\n#StartupLife #DailyDigest",
     "hashtags": ["#StartupLife", "#DailyDigest", "#Shipped"],
     "image_description": "Timeline visuelle: 6 mois en gris (construction), 1 jour en OR (livraison), 1000+ en vert (croissance). Avec courbe de croissance exponentielle.",
     "cta": "Join 1000+", "objective": "Momentum et preuve sociale pour les early adopters"},

    # ══ DAY 5 ══
    {"day": 5, "date_label": "Jour 5", "month": 1, "platform": "facebook", "post_type": "informatif",
     "text": "Astuce productivite : ☀️\n\nChaque matin, lisez vos actus entre 6h et 6h15.\n15 minutes.\nVotre journee: deja orientee vers ce qui compte.\n\nDailyDigest fait ca pour vous. Automatise. Intelligent. ✨\n\nVous ? Vous vous concentrez sur ce qui compte vraiment.\n\nC'est du temps recupere. C'est votre vie optimisee. 🎯",
     "hashtags": ["#AstuceProductivite", "#GestionDuTemps", "#DailyDigest"],
     "image_description": "Visuel Avant/Apres: Gauche personne stressee avec horloge. Droite meme personne calme avec cafe, DailyDigest sur telephone, detendue. Fleche montrant la transformation.",
     "cta": "Decouvrez comment", "objective": "Positionner comme outil de productivite"},
    {"day": 5, "date_label": "Jour 5", "month": 1, "platform": "linkedin", "post_type": "informatif",
     "text": "Routines matinales des personnes a succes :\n\n- 6h00 : Reveil\n- 6h15 : Exercice\n- 6h30 : Petit-dejeuner\n- 6h45 : LIRE LES ACTUS\n\nMAIS... comment lisent-ils les actus en 15 minutes ?\n\nSimple: Ils utilisent des systemes.\n\nDailyDigest EST ce systeme.\n\nC'est la difference entre etre informe et etre distrait.\n\n#AstuceProductivite #RoutineMatinale #Leadership",
     "hashtags": ["#AstuceProductivite", "#RoutineMatinale", "#Leadership"],
     "image_description": "Timeline de routine matinale avec 5 etapes en icones. Chaque etape avec creneau horaire. Mettre en valeur la lecture d'actus a 6h45 avec capture DailyDigest.",
     "cta": "Commencez votre routine", "objective": "Positionnement comme habitude quotidienne"},
    {"day": 5, "date_label": "Jour 5", "month": 1, "platform": "twitter", "post_type": "informatif",
     "text": "Pro tip: Winners read the news in 15 mins.\n\nHow?\n- Auto-curated\n- AI-summarized\n- Personal interests\n\nThat's DailyDigest.\n\n#Productivity #NewsIntel",
     "hashtags": ["#Productivity", "#NewsIntel", "#AI"],
     "image_description": "Visuel avec icones: timer 15 min + icone News + icone Cerveau = coche. Design epure, simple, moderne.",
     "cta": "Try it", "objective": "Astuce rapide et actionnable pour l'audience Twitter"},

    # ══ DAY 6 ══
    {"day": 6, "date_label": "Jour 6", "month": 1, "platform": "facebook", "post_type": "informatif",
     "text": "🎯 Cas d'usage : Le Developpeur Occupe\n\nNom : Alex\nMetier : Dev full-stack\nProbleme : \"Je veux rester a jour en tech, mais zero temps\"\n\nAvant DailyDigest :\n❌ Sauter les actus (FOMO)\n❌ 2h de scrolling (pas productif)\n\nAvec DailyDigest :\n✅ 15 min le matin\n✅ Top 10 articles tech pertinents pour moi\n✅ Resumes IA des decouvertes cles\n✅ Zero FOMO\n\nC'est vous ? Oui ? Alors on l'a construit pour vous. 👇",
     "hashtags": ["#DevLife", "#EtudeDeCas", "#DailyDigest"],
     "image_description": "Carte persona developpeur montrant Alex: photo (stylisee), titre du poste, probleme, avant/apres avec coches et croix.",
     "cta": "Votre histoire pourrait etre la prochaine", "objective": "Demontrer un cas d'usage concret"},
    {"day": 6, "date_label": "Jour 6", "month": 1, "platform": "linkedin", "post_type": "informatif",
     "text": "Etude de cas : Le Developpeur Occupe\n\nAlex code a plein temps. Veut rester a jour. Ne peut pas se permettre 2h de lecture.\n\nAncienne methode : Sauter les actus ou sacrifier sommeil/productivite\n\nNouvelle methode : DailyDigest (15 minutes, top 10 articles pertinents)\n\nResultat : Informe, pas submerge.\n\nCa vous ressemble ? Reglons ca ensemble.\n\n#DevLife #EtudeDeCas #AstuceProductivite",
     "hashtags": ["#DevLife", "#EtudeDeCas", "#AstuceProductivite"],
     "image_description": "Layout professionnel etude de cas: Probleme, Solution, Resultat. Chaque section avec icones et statistiques. Design epure, corporate.",
     "cta": "Reservez une demo", "objective": "Positionnement B2B avec metriques concretes"},
    {"day": 6, "date_label": "Jour 6", "month": 1, "platform": "twitter", "post_type": "informatif",
     "text": "Case study: The Busy Developer\n\n⏰ 15 mins / day\n📰 Top 10 articles\n🧠 AI summaries\n✅ Stays current\n\nBetter than 2-hour news scrolls.\n\nThat's the promise. That's DailyDigest.\n\n#DevLife #Productivity",
     "hashtags": ["#DevLife", "#Productivity", "#AI"],
     "image_description": "Infographie compacte avec 4 metriques empilees verticalement: temps, articles, resumes, resultat. Chiffres en gras, couleurs bleu et blanc.",
     "cta": "Try free", "objective": "Etude de cas rapide pour Twitter"},

    # ══ DAY 7 ══
    {"day": 7, "date_label": "Jour 7", "month": 1, "platform": "facebook", "post_type": "promotionnel",
     "text": "SONDAGE COMMUNAUTE 🗳️\n\nA quelle HEURE preferez-vous recevoir votre digest ?\n\n🌅 6h (j'adore mon rituel)\n☕ 7h (avec mon cafe)\n🏢 8h (avant le boulot)\n🌙 Pas d'heure fixe (je lis quand je veux)\n\nVotez en commentaires ! Votre vote compte pour ameliorer DailyDigest. 👇",
     "hashtags": ["#SondageCommunaute", "#DailyDigest", "#VotreVoix"],
     "image_description": "Visuel de sondage avec 4 options horaires affichees avec des scenarios illustres par emojis. Chaque option coloree et distincte.",
     "cta": "Votez maintenant", "objective": "Engagement et collecte de donnees de preferences"},
    {"day": 7, "date_label": "Jour 7", "month": 1, "platform": "linkedin", "post_type": "promotionnel",
     "text": "Sondage rapide : Quand lisez-VOUS les actus ?\n\nA) 6h (le leve-tot)\nB) 8h (avec le petit-dej)\nC) Midi (pause)\nD) Soir (decompression)\nE) Jamais (je m'informe par osmose 😄)\n\nCommentez ci-dessous ! Vos preferences faconnent notre roadmap.",
     "hashtags": ["#Sondage", "#Communaute", "#DeveloppementProduit"],
     "image_description": "Visuel de sondage professionnel avec 5 options etiquetees A-E. Chaque option avec icone horaire et breve description.",
     "cta": "Votez en reponse", "objective": "Input communautaire pour la roadmap produit"},
    {"day": 7, "date_label": "Jour 7", "month": 1, "platform": "twitter", "post_type": "promotionnel",
     "text": "Poll: When's your perfect news reading time?\n\n🌅 6 AM\n☕ 8 AM\n🏢 Midday\n🌙 Evening\n🤷 Never\n\nVote in reply! Shaping our roadmap based on YOUR habits.",
     "hashtags": ["#Poll", "#Community", "#DailyDigest"],
     "image_description": "Format sondage Twitter avec 5 options etiquetees par emojis affichees clairement.",
     "cta": "Vote", "objective": "Engagement Twitter et feedback"},

    # ══ DAY 8 ══
    {"day": 8, "date_label": "Jour 8", "month": 1, "platform": "facebook", "post_type": "informatif",
     "text": "Transparence : Nos couts d'infrastructure 💰\n\n500$/mois pour serveurs + APIs IA = trop cher pour 1 utilisateur.\n\nMais partage entre 1000 ? = 50 centimes par utilisateur/mois.\n\nC'est pourquoi on est Freemium des le jour 1.\n\nQuand vous nous aidez a grandir, on garde les couts bas et l'acces ouvert. ❤️\n\nMerci d'etre la !",
     "hashtags": ["#Transparence", "#Startup", "#DailyDigest"],
     "image_description": "Visualisation de la repartition des couts: 500$ montres, divises par nombre d'utilisateurs (1, 10, 100, 1000, 10000) montrant le cout par utilisateur qui diminue. Couleurs: rouge (cher) a vert (pas cher).",
     "cta": "Aidez-nous a grandir", "objective": "Construire la confiance par la transparence"},
    {"day": 8, "date_label": "Jour 8", "month": 1, "platform": "linkedin", "post_type": "informatif",
     "text": "Transparence startup : Voici comment on garde DailyDigest gratuit\n\nNotre stack coute ~500$/mois.\nAvec 1 utilisateur : insoutenable.\nAvec 1 000 utilisateurs : 50¢ chacun.\nAvec 10 000 : 5¢ chacun.\n\nC'est pourquoi on est freemium des le jour 1.\n\nScale = durabilite.\nDurabilite = produit gratuit pour les utilisateurs.\n\nGagnant-gagnant. 🙌\n\n#EconomieStartup #SaaS #Transparence",
     "hashtags": ["#EconomieStartup", "#SaaS", "#Transparence"],
     "image_description": "Infographie de structure de couts montrant comment le cout par utilisateur diminue avec l'echelle. Graphique en ligne montrant une diminution exponentielle.",
     "cta": "Decouvrez notre modele", "objective": "Expliquer le modele economique durable"},
    {"day": 8, "date_label": "Jour 8", "month": 1, "platform": "twitter", "post_type": "informatif",
     "text": "Startup math: Why DailyDigest is free\n\n$500 infra costs ÷ 10,000 users = $.05/user\n\nScale early, stay free.\nThat's the philosophy.\n\nWe win when you win. 🙌\n\n#StartupMath #SaaS",
     "hashtags": ["#StartupMath", "#SaaS", "#Transparency"],
     "image_description": "Equation mathematique simple: Cout ÷ Utilisateurs = Cout par utilisateur. Progression de cher a pas cher.",
     "cta": "Join us", "objective": "Montrer l'alignement du modele avec les utilisateurs"},

    # ══ DAY 9 ══
    {"day": 9, "date_label": "Jour 9", "month": 1, "platform": "facebook", "post_type": "informatif",
     "text": "Le saviez-vous ? La personne moyenne passe :\n\n📱 7 heures 22 minutes sur les ecrans par jour\n📰 Mais seulement 12 minutes sur les actus\n📊 Et pourtant se sent mal informee\n\nLe probleme n'est pas le TEMPS. C'est la PERTINENCE.\n\nVous n'avez pas besoin de PLUS de temps pour lire les actus. Vous avez besoin de MEILLEURES actus.\n\nDailyDigest filtre le bruit pour que vous ne voyiez que ce qui compte. ✨\n\nC'est ca la difference.",
     "hashtags": ["#TempsEcran", "#Productivite", "#IntelligenceActus"],
     "image_description": "Infographie temps d'ecran: 7h22 total, 12 min actus surlignes, emoji triste 'Se sent mal informe'. Design avec camembert montrant la distribution du temps.",
     "cta": "De meilleures actus", "objective": "Recadrer le probleme comme qualite et non quantite"},
    {"day": 9, "date_label": "Jour 9", "month": 1, "platform": "linkedin", "post_type": "informatif",
     "text": "Le paradoxe de l'information :\n\n- Les gens consomment PLUS d'actus que jamais\n- La consommation d'actus AUGMENTE\n- Pourtant ils se sentent MOINS informes\n\nPourquoi ?\n\nParce que la plupart des actus sont du BRUIT.\n\nLe ratio signal/bruit s'est effondre. Vous obtenez 1 info precieuse pour 100 inutiles.\n\nCe n'est pas un probleme de temps. C'est un probleme de QUALITE.\n\nDailyDigest resout ca avec un filtrage de signal alimente par l'IA.\n\n#IntelligenceMedia #AI",
     "hashtags": ["#IntelligenceMedia", "#AI", "#News"],
     "image_description": "Graphique montrant: Consommation d'actus EN HAUSSE, mais Sentiment d'etre informe EN BAISSE. Axe X annees, axe Y metriques. Deux lignes qui se croisent montrant le paradoxe.",
     "cta": "Discutons", "objective": "Positionner comme solution au paradoxe mediatique"},
    {"day": 9, "date_label": "Jour 9", "month": 1, "platform": "twitter", "post_type": "informatif",
     "text": "The news paradox:\n\nMore news consumed → Less informed\n\nWhy?\n\nNoise > Signal\n\nYou need filtering, not more content.\n\nThat's what AI is for.\n\n#MediaTech #AI",
     "hashtags": ["#MediaTech", "#AI", "#News"],
     "image_description": "Graphique simple a deux lignes: consommation en hausse, connaissance en baisse. Lignes qui se croisent formant un X. Minimal, percutant.",
     "cta": "Learn more", "objective": "Debut de thread Twitter sur le probleme mediatique"},

    # ══ DAY 10 ══
    {"day": 10, "date_label": "Jour 10", "month": 1, "platform": "facebook", "post_type": "preuve_sociale",
     "text": "\"Je passais une heure chaque matin sur les actus. Maintenant j'ai toutes les infos importantes en 15 minutes. Game changer !\" - Maria, Product Manager\n\nDailyDigest n'est pas que pour les developpeurs. C'est pour tous ceux qui veulent rester informes sans le bruit.\n\nQue feriez-vous avec 45 minutes de plus chaque matin ?\n\n👇 Dites-nous votre reponse en commentaires !",
     "hashtags": ["#Temoignage", "#HistoireUtilisateur", "#DailyDigest"],
     "image_description": "Carte temoignage utilisateur: photo de Maria (ou avatar), titre 'Product Manager', citation en gros, temps economise mis en valeur (45 min).",
     "cta": "Essayez gratuitement", "objective": "Construire la preuve sociale avec un vrai temoignage"},
    {"day": 10, "date_label": "Jour 10", "month": 1, "platform": "linkedin", "post_type": "preuve_sociale",
     "text": "\"Je perdais 1-2 heures par jour en consommation d'actus. Maintenant DailyDigest me donne l'essentiel en 15 minutes. Ma productivite a augmente de 30%.\" - Alex, CTO chez TechStartup\n\nLes utilisateurs DailyDigest rapportent :\n✅ 45+ minutes supplementaires par jour\n✅ Mieux informes\n✅ Moins de fatigue decisionnelle\n✅ Plus de temps de concentration\n\nVotre matin compte. Faites-le compter.\n\n#HistoireProductivite #AI",
     "hashtags": ["#HistoireProductivite", "#AI", "#Leadership"],
     "image_description": "Layout temoignage avec nom utilisateur, titre, entreprise, citation, et stats/resultats listees en dessous.",
     "cta": "Lire plus d'histoires", "objective": "Construire la credibilite avec des temoignages nommes"},
    {"day": 10, "date_label": "Jour 10", "month": 1, "platform": "twitter", "post_type": "preuve_sociale",
     "text": "\"I was losing 1-2 hours daily to news. Now DailyDigest in 15 mins. My productivity +30%.\" - Alex, CTO\n\nUsers report:\n⏱️ +45 mins daily\n🧠 Better informed\n✅ Less decision fatigue\n🎯 More focus\n\nYour morning matters.\n\n#ProductivityWin",
     "hashtags": ["#ProductivityWin", "#AI", "#UserStory"],
     "image_description": "Tweet style citation avec temoignage surligne, points de benefices en dessous.",
     "cta": "Join them", "objective": "Preuve sociale par temoignages utilisateurs"},
]


def seed_posts(apps, schema_editor):
    SocialPost = apps.get_model('communication', 'SocialPost')
    # Ne pas re-inserer si deja present
    if SocialPost.objects.exists():
        return
    for post_data in MONTH1_POSTS:
        SocialPost.objects.create(**post_data)


def remove_posts(apps, schema_editor):
    SocialPost = apps.get_model('communication', 'SocialPost')
    SocialPost.objects.filter(month=1).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('communication', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_posts, remove_posts),
    ]

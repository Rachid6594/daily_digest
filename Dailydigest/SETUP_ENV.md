# Configuration Django et Environnement

## 📋 Fichiers créés

- **requirement.txt** - Dépendances du projet
- **.env** - Variables d'environnement (développement)
- **.env.example** - Template des variables d'environnement

## 🚀 Installation initiale

```bash
# 1. Activer l'environnement virtuel
.venv\Scripts\activate  # Windows
# ou
source .venv/bin/activate  # Unix/Mac

# 2. Installer les dépendances
pip install -r requirement.txt

# 3. Créer les migrations
python manage.py makemigrations

# 4. Appliquer les migrations
python manage.py migrate

# 5. Créer un superuser
python manage.py createsuperuser

# 6. Lancer le serveur
python manage.py runserver
```

## 📝 Configuration du settings.py

Voici comment utiliser les variables d'environnement dans `settings.py` :

```python
from decouple import config

# Django Configuration
DEBUG = config('DEBUG', default=True, cast=bool)
SECRET_KEY = config('SECRET_KEY')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Database Configuration
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.sqlite3'),
        'NAME': config('DB_NAME', default='db.sqlite3'),
        'USER': config('DB_USER', default=''),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default=''),
        'PORT': config('DB_PORT', default=''),
    }
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='').split(',')

# Email Configuration
EMAIL_BACKEND = config('EMAIL_BACKEND')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# Frontend URL
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')
```

## 📦 Packages inclus

| Package | Utilité |
|---------|---------|
| **Django** | Framework web |
| **djangorestframework** | Construction d'API REST |
| **django-cors-headers** | Gestion CORS (React ↔ Django) |
| **python-decouple** | Variables d'environnement |
| **Pillow** | Traitement d'images |
| **psycopg2-binary** | Driver PostgreSQL |
| **python-dotenv** | Chargement .env |
| **requests** | Requêtes HTTP |
| **celery** | Tâches asynchrones |
| **redis** | Cache/Broker Celery |
| **gunicorn** | Serveur production |
| **drf-spectacular** | Documentation API |
| **django-filter** | Filtrage avancé |
| **djangorestframework-simplejwt** | Authentification JWT |

## 🔐 Configuration pour Production

Avant de déployer, modifie `.env` :

```bash
DEBUG=False
SECRET_KEY=your-very-secret-key-generate-one
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_ENGINE=django.db.backends.postgresql
DB_NAME=production_db
DB_USER=prod_user
DB_PASSWORD=strong-password
```

## 🚨 Sécurité

- ❌ Ne commit jamais le `.env` réel
- ✅ Commit le `.env.example` avec des valeurs dummy
- ✅ Ajoute `.env` au `.gitignore`
- ✅ Utilise des secrets manager en production

## 📖 Prochaines étapes

1. **Configurer les apps Django**
   ```bash
   python manage.py startapp api
   python manage.py startapp users
   ```

2. **Installer CORS**
   Ajoute à `INSTALLED_APPS` dans settings.py :
   ```python
   INSTALLED_APPS = [
       ...
       'corsheaders',
       'rest_framework',
   ]
   ```

3. **Configurer le middleware CORS**
   ```python
   MIDDLEWARE = [
       'corsheaders.middleware.CorsMiddleware',
       ...
   ]
   ```

4. **Créer un superuser et tester l'admin**
   ```bash
   python manage.py createsuperuser
   # Puis visiter http://localhost:8000/admin
   ```

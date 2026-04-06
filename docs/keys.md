---

# 📁 Project Configuration

## 🔗 Repositories

* **Frontend (Next.js)**
  👉 [https://github.com/victory-aime/my-immo-front](https://github.com/victory-aime/my-immo-front)

* **Backend (NestJS)**
  👉 [https://github.com/victory-aime/my-immo-backend](https://github.com/victory-aime/my-immo-backend)


---

# ⚙️ Environment Variables

## 🖥️ Frontend (.env.local)

```env
# Email verification & password reset URLs
NEXT_PUBLIC_VERIFIED_EMAIL_URL='http://localhost:5080/auth/email-verified'
NEXT_PUBLIC_RESET_PASSWORD_URL='http://localhost:5080/auth/forget-pass/validate'

# API
NEXT_PUBLIC_BACKEND_URL='http://localhost:4000'
NEXT_PUBLIC_BACKEND_PATH='/api/v1/'

# Auth (better-auth secret)
BETTER_AUTH_SECRET=aP40z7mUhkMwI0OIPQ9oszAvnJBJFbUC
```

---

## 🧠 Backend (.env.local)

```env
# App
PORT=4000
NODE_ENV=local

# Database (Prisma)
DATABASE_URL="postgresql://postgres:root@localhost:5432/create-database"

# Auth (better-auth)
BETTER_AUTH_URL=http://localhost:4000
BETTER_AUTH_SECRET=aP40z7mUhkMwI0OIPQ9oszAvnJBJFbUC


# Email (Resend)
RESEND_API_KEY=xxx
EMAIL_FROM=noreply@yourapp.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=dhv3jtnwh
CLOUDINARY_API_KEY=228466268167358
CLOUDINARY_API_SECRET=KPSvPGk54GsTv_rxHC-P7THd4c0

# App URLs
APP_NAME=MyIMMO
FRONTEND_EMAIL_VERIFIED_URL=http://localhost:5080/auth/email-verified
FRONTEND_RESET_PASSWORD_URL='http://localhost:5080/auth/forget-pass/validate'
```

---

## 🔐 Bonnes pratiques

- Ne **jamais commit** les vrais `.env`
- Utiliser :
  - `.env.local` (frontend)
  - `.env` (backend)

- Stocker les secrets dans :
  - Vault / Doppler / 1Password (optionnel mais recommandé)

---

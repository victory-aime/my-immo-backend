# 🏠 Database Schema — SaaS Immobilier

Schéma Prisma pour une plateforme SaaS destinée aux agences immobilières au Sénégal.
Stack : **PostgreSQL** + **Prisma ORM** + **Better-Auth**

---

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture User-centric](#architecture-user-centric)
- [Modèles](#modèles)
  - [Auth (Better-Auth)](#auth-better-auth)
  - [Profils Métier](#profils-métier)
  - [Agence](#agence)
  - [Terrains, Bâtiments & Villas](#terrains-bâtiments--villas)
  - [Propriétés](#propriétés)
  - [Leads](#leads)
  - [Visites](#visites)
  - [Favoris](#favoris)
  - [Locataires & Contrats](#locataires--contrats)
  - [Tickets / Incidents](#tickets--incidents)
  - [Comptabilité](#comptabilité)
  - [Business Model (Commissions)](#business-model-commissions)
  - [Abonnements & RBAC](#abonnements--rbac)
  - [Notifications](#notifications)
  - [Rapports](#rapports)
- [Enums](#enums)
- [Relations clés](#relations-clés)
- [Règles métier importantes](#règles-métier-importantes)
- [Changelog](#changelog)
- [Installation & Migration](#installation--migration)

---

## Vue d'ensemble

La base de données supporte trois applications distinctes :

| Application     | Utilisateurs                                  | Description                           |
| --------------- | --------------------------------------------- | ------------------------------------- |
| **Web App**     | Owner, Staff (Agent, Comptable, Admin agence) | Gestion complète de l'agence          |
| **Mobile App**  | User (client)                                 | Recherche de biens, favoris, demandes |
| **Back-office** | Super Admin                                   | Administration de la plateforme       |

---

## Architecture User-centric

`User` est la table pivot centrale. Toute personne utilisant la plateforme est d'abord un `User`, quelle que soit son application (web, mobile, back-office). Cela garantit un système d'authentification unifié via **Better-Auth**.

```
User (auth, sessions, rôle global)
  ├── Owner   → role: OWNER         — propriétaire de l'agence (1 agence)
  ├── Staff   → role: AGENT         — agent immobilier
  │            role: ACCOUNTANT     — comptable
  │            role: AGENCY_ADMIN   — admin interne agence
  └── Client  → role: USER          — utilisateur mobile app
```

> Un `User` ne peut avoir qu'**un seul profil métier** actif (`Owner`, `Staff` ou `Client`).
> Le champ `User.role` détermine lequel est actif.

---

## Modèles

### Auth (Better-Auth)

Ces modèles sont gérés automatiquement par **Better-Auth** et ne doivent pas être modifiés manuellement.

#### `User`

Table centrale. Contient les informations d'identité et le rôle global.

| Champ              | Type          | Description                                  |
| ------------------ | ------------- | -------------------------------------------- |
| `id`               | String (UUID) | Identifiant unique                           |
| `email`            | String        | Email unique, utilisé pour le login          |
| `name`             | String        | Nom complet                                  |
| `role`             | Role          | Rôle global (`USER`, `OWNER`, `AGENT`, etc.) |
| `emailVerified`    | Boolean       | Email confirmé                               |
| `twoFactorEnabled` | Boolean?      | 2FA activée                                  |
| `status`           | UserStatus    | `ACTIVE`, `INACTIVE`, `BANNED`               |

> Les notifications sont reliées à `User` via deux relations nommées distinctes :
> `receivedNotifications` (destinataire) et `sentNotifications` (émetteur).

#### `Session`

Sessions actives de l'utilisateur. Gérées par Better-Auth.

#### `Account`

Comptes OAuth liés (Google, etc.) et credentials email/password.

#### `Verification`

Tokens de vérification (email, OTP).

#### `TwoFactor`

Secrets TOTP et codes de secours pour la 2FA.

#### `Passkey`

Clés d'accès WebAuthn (authentification sans mot de passe).

---

### Profils Métier

#### `Owner`

Propriétaire d'une agence. Lié à un `User` (role = `OWNER`) et une `Agency`.

| Champ    | Description               |
| -------- | ------------------------- |
| `userId` | Unique — 1 owner = 1 user |

> La relation `Owner` ↔ `Agency` est bidirectionnelle avec contrainte unique des deux côtés.
> `Agency.ownerId` est un champ String dénormalisé (pas une FK Prisma) — la relation réelle passe par `Owner.agencyId` côté `Agency`.

#### `Staff`

Personnel de l'agence (agents, comptables, admins). Lié à un `User` et une `Agency`.

| Champ         | Description                                                      |
| ------------- | ---------------------------------------------------------------- |
| `agencyRole`  | Rôle au sein de l'agence : `AGENCY_ADMIN`, `AGENT`, `ACCOUNTANT` |
| `isActive`    | Permet de désactiver un membre sans le supprimer                 |
| `permissions` | Permissions RBAC accordées par l'owner/admin                     |

Relations sortantes : `assignedLeads`, `assignedTickets`, `visits`, `permissions`

#### `Client`

Utilisateur de l'application mobile. Lié à un `User` (role = `USER`).

| Champ       | Description                                  |
| ----------- | -------------------------------------------- |
| `phone`     | Numéro de téléphone optionnel                |
| `favorites` | Biens sauvegardés                            |
| `leads`     | Demandes de contact envoyées (authentifiées) |

---

### Agence

#### `Agency`

Entité centrale de la gestion immobilière. Tous les objets métier lui sont rattachés.

| Champ         | Description                                                   |
| ------------- | ------------------------------------------------------------- |
| `name`        | Nom unique de l'agence                                        |
| `email`       | Email de contact unique                                       |
| `phone`       | Téléphone unique                                              |
| `documents`   | Pièces justificatives (KYC)                                   |
| `acceptTerms` | Acceptation des CGU                                           |
| `isVerified`  | Validé par le Super Admin                                     |
| `status`      | `PENDING`, `OPEN`, `CLOSE`                                    |
| `ownerId`     | Donnée dénormalisée (String) — référence informelle à l'owner |

Une agence peut être composée d'**une seule personne** (owner seul) ou d'une **équipe** (owner + plusieurs staff).

---

### Terrains, Bâtiments & Villas

#### `Land`

Terrain acquis ou disponible, rattaché à une agence. Peut accueillir des bâtiments ou des villas.

| Champ               | Type       | Description                              |
| ------------------- | ---------- | ---------------------------------------- |
| `title`             | String     | Libellé du terrain                       |
| `purchasePrice`     | Decimal    | Prix d'achat en FCFA                     |
| `area`              | Float      | Surface en m²                            |
| `city` / `district` | String     | Localisation                             |
| `status`            | LandStatus | `AVAILABLE`, `CURRENTLY_ON_SALE`, `SOLD` |
| `documents`         | String[]   | Documents liés (URLs)                    |

Relations sortantes : `batiments`, `villa`

#### `Batiment`

Immeuble ou bâtiment rattaché à une agence, optionnellement lié à un terrain.

| Champ                           | Description                               |
| ------------------------------- | ----------------------------------------- |
| `name`                          | Nom unique par agence (`name + agencyId`) |
| `address` / `city` / `district` | Adresse complète                          |
| `floors`                        | Nombre d'étages (optionnel)               |
| `landId`                        | Terrain d'origine (optionnel)             |
| `properties`                    | Liste des logements dans ce bâtiment      |

> Un bâtiment peut exister sans terrain (`landId` nullable).

#### `Villa`

Villa rattachée à une agence, optionnellement liée à un terrain.

| Champ      | Description                               |
| ---------- | ----------------------------------------- |
| `name`     | Nom unique par agence (`name + agencyId`) |
| `price`    | Prix en FCFA (Int)                        |
| `nbrItems` | Nombre de lots ou pièces (optionnel)      |
| `landId`   | Terrain d'origine (optionnel)             |

---

### Propriétés

#### `Property`

Logement publié par une agence, obligatoirement rattaché à un `Batiment`.

| Champ                 | Type           | Description                                          |
| --------------------- | -------------- | ---------------------------------------------------- |
| `type`                | PropertyType   | `APARTMENT`, `HOUSE`, `STUDIO`                       |
| `price`               | Decimal        | Prix en FCFA                                         |
| `caution`             | Decimal?       | Caution (location uniquement)                        |
| `city` / `district`   | String         | Localisation                                         |
| `rooms` / `bathrooms` | Int            | Configuration du bien                                |
| `area`                | Float?         | Surface en m²                                        |
| `status`              | PropertyStatus | `AVAILABLE`, `RENTED`                                |
| `galleryImages`       | String[]       | URLs des photos                                      |
| `documents`           | String[]       | Documents liés au bien                               |
| `batimentId`          | String         | Bâtiment auquel appartient ce bien (**obligatoire**) |

> Contraintes uniques : `(agencyId, title)` et `(agencyId, batimentId)`.
> Un bien doit toujours être rattaché à un `Batiment`.

---

### Leads

#### `Lead`

Demande de contact d'un prospect pour un bien. Supporte deux flux :

**Flux public (non connecté)**

```
guestName + guestPhone + guestEmail  →  Lead créé sans clientId
```

**Flux privé (client connecté)**

```
clientId  →  Lead créé avec les infos du Client
```

| Champ                   | Description                                                                  |
| ----------------------- | ---------------------------------------------------------------------------- |
| `guestName/Phone/Email` | Infos saisies manuellement (public) — nullable                               |
| `clientId`              | Client connecté (privé) — nullable                                           |
| `assignedToId`          | Staff assigné au suivi                                                       |
| `status`                | Pipeline CRM : `NEW` → `CONTACTED` → `VISIT_PLANNED` → `OFFER` → `CONVERTED` |
| `tenant`                | Backrelation vers le `Tenant` créé depuis ce lead                            |

> `guestName` **et** `clientId` sont tous les deux nullable mais la logique applicative
> doit s'assurer qu'au moins l'un des deux est renseigné à la création.

---

### Visites

#### `Visit`

Visite planifiée pour un bien, issue d'un lead.

| Champ         | Description                                 |
| ------------- | ------------------------------------------- |
| `scheduledAt` | Date et heure de la visite                  |
| `status`      | `PLANNED`, `CONFIRMED`, `DONE`, `CANCELLED` |
| `leadId`      | Lead à l'origine de la visite               |
| `agentId`     | Staff (agent) assigné à la visite           |

---

### Favoris

#### `Favorite`

Bien sauvegardé par un client (mobile app).

Contrainte unique sur `(clientId, propertyId)` — un client ne peut pas sauvegarder le même bien deux fois.

---

### Locataires & Contrats

#### `Tenant`

Fiche locataire associée à un bien et une agence.

| Champ       | Description                                     |
| ----------- | ----------------------------------------------- |
| `documents` | CNI, justificatifs (URLs)                       |
| `status`    | `ACTIVE` ou `INACTIVE`                          |
| `leadId`    | Unique — traçabilité si converti depuis un lead |

> Deux modes de création :
>
> - **Manuel** depuis le dashboard agence → `leadId = null`
> - **Conversion d'un lead** → `leadId` renseigné, formulaire prérempli
>
> `leadId @unique` garantit qu'un lead ne peut être converti qu'une seule fois.

#### `Contract`

Contrat de location liant un locataire à un bien.

| Champ          | Description                          |
| -------------- | ------------------------------------ |
| `rentAmount`   | Montant mensuel du loyer en FCFA     |
| `deposit`      | Dépôt de garantie en FCFA            |
| `documents`    | Contrats signés uploadés (URLs)      |
| `transactions` | Paiements de loyer liés à ce contrat |

---

### Tickets / Incidents

#### `Ticket`

Réclamation ou incident technique sur un bien.

| Champ          | Description                                       |
| -------------- | ------------------------------------------------- |
| `type`         | `PLUMBING`, `ELECTRICITY`, `MAINTENANCE`, `OTHER` |
| `status`       | `OPEN`, `IN_PROGRESS`, `RESOLVED`                 |
| `documents`    | Photos / pièces jointes (URLs)                    |
| `assignedToId` | Staff assigné à l'intervention                    |

---

### Comptabilité

#### `Transaction`

Mouvement financier de l'agence.

| Champ        | Description                                            |
| ------------ | ------------------------------------------------------ |
| `type`       | `RENT`, `SALE`, `COMMISSION`, `EXPENSE`, `MAINTENANCE` |
| `amount`     | Montant en FCFA                                        |
| `contractId` | Lien optionnel avec un contrat (pour les loyers)       |

---

### Business Model (Commissions)

#### `TransactionCommission`

Commission prélevée par la plateforme sur les transactions d'une agence.

| Champ              | Description                            |
| ------------------ | -------------------------------------- |
| `agencyId`         | Agence concernée                       |
| `amount`           | Montant de la transaction de référence |
| `currency`         | Devise                                 |
| `status`           | `PENDING`, `COMPLETED`, `FAILED`       |
| `commissionAmount` | Montant de la commission calculée      |
| `commissionRate`   | Taux appliqué (ex: `10.00` = 10%)      |
| `validatedAt`      | Date de validation de la commission    |

> Le taux de commission est déterminé par l'abonnement actif de l'agence (`Subscription.commissionRate`).

---

### Abonnements & RBAC

Le RBAC repose sur **deux couches distinctes** :

```
Plan → ce que l'agence PEUT faire  (PlanFeature)
         ↓
Staff → ce qu'un membre a le DROIT de faire  (StaffPermission)
```

#### `Subscription`

Abonnement SaaS actif de l'agence.

| Champ            | Description                                                 |
| ---------------- | ----------------------------------------------------------- |
| `planId`         | Plan souscrit                                               |
| `commissionRate` | Snapshot du taux de commission au moment de la souscription |

> Contrainte unique sur `agencyId` — une seule souscription active par agence à la fois.

#### `SubscriptionPlan`

Catalogue des plans disponibles.

| Plan       | Description        |
| ---------- | ------------------ |
| `BASIC`    | Plan de démarrage  |
| `STANDARD` | Plan intermédiaire |
| `PREMIUM`  | Plan sans limites  |

| Champ            | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `commissionRate` | Taux de commission de la plateforme (ex: `10.00` = 10%) |
| `isActive`       | Plan disponible à la souscription                       |

#### `Feature`

Catalogue de toutes les fonctionnalités de la plateforme.

| Champ      | Description                                                                                |
| ---------- | ------------------------------------------------------------------------------------------ |
| `id`       | UUID — identifiant unique                                                                  |
| `name`     | Nom lisible (ex: `manage_properties`, `view_reports`)                                      |
| `category` | `PROPERTIES`, `LEADS`, `TENANTS`, `ACCOUNTING`, `USERS`, `REPORTS`, `TICKETS`, `MARKETING` |

#### `PlanFeature`

Ce que chaque plan inclut, avec limites quantitatives.

| Champ       | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `planId`    | Référence au plan                                             |
| `featureId` | Référence à la feature                                        |
| `enabled`   | Feature activée pour ce plan                                  |
| `limit`     | `null` = illimité, `Int` = quota (ex: 5 biens, 30 locataires) |

#### `StaffPermission`

Permissions accordées à un membre du staff par l'owner ou l'admin agence.

| Champ       | Description                                           |
| ----------- | ----------------------------------------------------- |
| `staffId`   | Membre ciblé                                          |
| `featureId` | Feature concernée                                     |
| `granted`   | `true` = accordé, `false` = révoqué explicitement     |
| `grantedBy` | `userId` de celui qui a accordé la permission (audit) |
| `grantedAt` | Date d'attribution                                    |

**Flow de vérification d'accès :**

```
1. L'agence a-t-elle un abonnement actif ?
2. Le plan actif inclut-il la feature ? (PlanFeature.enabled)
3. La limite quantitative est-elle atteinte ? (PlanFeature.limit)
4. Le staff a-t-il la permission accordée ? (StaffPermission.granted)
```

> L'`Owner` bypass les étapes 3 et 4 — il a toutes les permissions par défaut.
> Cette règle est gérée en applicatif, pas en base.

---

### Notifications

#### `Notification`

Notification destinée à un utilisateur spécifique.

| Champ         | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `type`        | `LEAD`, `VISIT`, `TICKET`, `PAYMENT`, `MAINTENANCE`, `SYSTEM`   |
| `recipientId` | Destinataire (`User`) — relation nommée `NotificationRecipient` |
| `senderId`    | Émetteur (`User?`) — relation nommée `NotificationSender`       |
| `agencyId`    | Contexte agence si applicable                                   |
| `isRead`      | Statut de lecture                                               |

> Les deux relations vers `User` sont nommées pour éviter l'ambiguïté Prisma.
> `senderId = null` pour les notifications système automatiques.

---

### Rapports

#### `Report`

Rapport généré pour une agence, stocké en JSON.

| Champ         | Description                                   |
| ------------- | --------------------------------------------- |
| `type`        | `FINANCIAL`, `PERFORMANCE`, `LEADS`, `CUSTOM` |
| `data`        | Contenu du rapport (Json)                     |
| `generatedAt` | Date de génération                            |

---

## Enums

| Enum                | Valeurs                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `Role`              | `SUPER_ADMIN`, `OWNER`, `AGENCY_ADMIN`, `AGENT`, `ACCOUNTANT`, `USER`                      |
| `UserStatus`        | `ACTIVE`, `INACTIVE`, `BANNED`                                                             |
| `AgencyRole`        | `AGENCY_ADMIN`, `AGENT`, `ACCOUNTANT`                                                      |
| `AgencyStatus`      | `PENDING`, `OPEN`, `CLOSE`                                                                 |
| `PropertyType`      | `APARTMENT`, `HOUSE`, `STUDIO`                                                             |
| `PropertyStatus`    | `AVAILABLE`, `RENTED`                                                                      |
| `LandStatus`        | `AVAILABLE`, `CURRENTLY_ON_SALE`, `SOLD`                                                   |
| `LeadStatus`        | `NEW`, `CONTACTED`, `VISIT_PLANNED`, `OFFER`, `CONVERTED`                                  |
| `VisitStatus`       | `PLANNED`, `CONFIRMED`, `DONE`, `CANCELLED`                                                |
| `TenantStatus`      | `ACTIVE`, `INACTIVE`                                                                       |
| `TransactionType`   | `RENT`, `SALE`, `COMMISSION`, `EXPENSE`, `MAINTENANCE`                                     |
| `TransactionStatus` | `PENDING`, `COMPLETED`, `FAILED`                                                           |
| `TicketType`        | `PLUMBING`, `ELECTRICITY`, `MAINTENANCE`, `OTHER`                                          |
| `TicketStatus`      | `OPEN`, `IN_PROGRESS`, `RESOLVED`                                                          |
| `Plan`              | `BASIC`, `STANDARD`, `PREMIUM`                                                             |
| `FeatureCategory`   | `PROPERTIES`, `LEADS`, `TENANTS`, `ACCOUNTING`, `USERS`, `REPORTS`, `TICKETS`, `MARKETING` |
| `NotificationType`  | `LEAD`, `VISIT`, `TICKET`, `PAYMENT`, `MAINTENANCE`, `SYSTEM`                              |
| `ReportType`        | `FINANCIAL`, `PERFORMANCE`, `LEADS`, `CUSTOM`                                              |

---

## Relations clés

```
User ──────────────┬──► Owner ──────────► Agency ◄──── Staff ◄──────────── User
                   ├──► Staff                │              └──► StaffPermission ◄── Feature
                   └──► Client               │                                           ▲
                           │                 ├──► PlanFeature ◄──────────────────────────┘
                           └──► Favorite     │
                                    │        ├──► Land ──┬──► Batiment ──► Property ◄── Lead ◄── Client
                                    └────────►           └──► Villa              │          └──── (guest)
                                                         │                       ├──► Visit
                                                         │                       ├──► Ticket
                                                         │                       ├──► Tenant ──► Contract ──► Transaction
                                                         │                       └──► Favorite
                                                         │
                                             Agency ──► Subscription ──► SubscriptionPlan
                                                    ──► TransactionCommission
                                                    ──► Notification ◄── User (recipient / sender)
                                                    ──► Report
```

---

## Règles métier importantes

**Lead**

- Si `clientId` est renseigné → lead privé (client connecté)
- Si `guestName/Email/Phone` sont renseignés → lead public (visiteur anonyme)
- Les deux ne doivent pas être nuls simultanément (validation applicative)

**Agency**

- Une agence = exactement 1 `Owner`
- Une agence peut avoir 0 à N `Staff`
- Toutes les entités métier sont systématiquement rattachées à une agence

**Land / Batiment / Villa**

- Un `Batiment` ou une `Villa` peut exister sans `Land` (`landId` nullable)
- Une `Property` doit obligatoirement être rattachée à un `Batiment` (`batimentId` non nullable)
- `Land.status` suit son propre cycle : `AVAILABLE` → `CURRENTLY_ON_SALE` → `SOLD`

**Property**

- `caution` est optionnel : uniquement pertinent pour une location
- `PropertyStatus` ne contient pas `SOLD` — les ventes sont modélisées via `Villa` et `Land`
- Deux biens d'une même agence ne peuvent pas avoir le même titre (`agencyId + title` unique)
- Un seul bien par bâtiment par agence (`agencyId + batimentId` unique)

**Tenant**

- Création manuelle depuis le dashboard → `leadId = null`
- Conversion depuis un lead → `leadId` renseigné, `@unique` empêche la double conversion

**Subscription & RBAC**

- Contrainte `@unique([agencyId])` sur `Subscription` — une seule souscription par agence
- Le champ `commissionRate` est un snapshot copié depuis `SubscriptionPlan` au moment de la souscription
- L'`Owner` bypass les vérifications de permissions — toujours accès total
- Les limites quantitatives (`PlanFeature.limit`) sont vérifiées en applicatif avant création

**TransactionCommission**

- Générée automatiquement lors de chaque `Transaction` de l'agence
- Le taux appliqué (`commissionRate`) est celui de l'abonnement actif au moment de la transaction

**Notification**

- Deux relations nommées vers `User` : `NotificationRecipient` et `NotificationSender`
- `senderId = null` pour les notifications système automatiques

---

## Changelog

### v2 — Terrains, Bâtiments, Villas & Business model

- ✅ `UserStatus.BANNED` ajouté
- ✅ `AgencyStatus` enum ajouté (`PENDING`, `OPEN`, `CLOSE`)
- ✅ `Land` model ajouté avec `LandStatus` enum (`AVAILABLE`, `CURRENTLY_ON_SALE`, `SOLD`)
- ✅ `Batiment` model ajouté — immeuble rattachable à un `Land`
- ✅ `Villa` model ajouté — villa rattachable à un `Land`
- ✅ `Property.batimentId` rendu obligatoire — tout bien appartient à un `Batiment`
- ✅ `TransactionCommission` model ajouté — suivi des commissions plateforme
- ✅ `Subscription.commissionRate` ajouté — snapshot du taux au moment de la souscription
- ✅ `SubscriptionPlan.commissionRate` ajouté
- ✅ `Plan.PRO` renommé en `Plan.STANDARD` (conforme au business model)
- ✅ `Staff.permissions StaffPermission[]` backrelation ajoutée
- ✅ `Lead.tenant Tenant?` backrelation ajoutée
- ✅ `Notification` — relations `User` nommées (`NotificationRecipient` / `NotificationSender`) et FK `senderId` définie
- ✅ Modèles RBAC ajoutés : `Feature`, `PlanFeature`, `StaffPermission`

### v1 — Initial

- Schéma de base : Auth, Agency, Property, Lead, Visit, Tenant, Contract, Ticket, Transaction, Subscription, Notification, Report

---

## Installation & Migration

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Créer et appliquer la migration initiale
npx prisma migrate dev --name init

# Visualiser la base (Prisma Studio)
npx prisma studio
```

Variables d'environnement requises :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/saas_immo"
```

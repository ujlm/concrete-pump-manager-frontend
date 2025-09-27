# Betonpomp Management Systeem - Projectvoorstel

## Projectoverzicht
Quantum Noodle BV verbindt zich ertoe een complete webapplicatie te ontwikkelen voor het plannen en beheren van betonpompdiensten. Het systeem combineert de functionaliteit van twee bestaande applicaties (een kalender voor planning en een online tool voor het operationele luik) met een moderne, strakke interface die geoptimaliseerd is voor grote schermen en responsief werkt op tablets en smartphones.

## Hoofdfunctionaliteiten

### 1. Planning Kalender (`/planning`)
- **Drie kalenderweergaven:**
  - Alleen geplande afspraken (voorlopige planning)
  - Alleen toegewezen afspraken (definitieve planning)
  - Gesplitste weergave: beide kalenders naast elkaar voor vergelijking
- **Intuïtieve bediening:**
  - Dubbelklik of sleep op lege ruimte om nieuwe afspraak toe te voegen
  - Sleep afspraken tussen chauffeurs en tijdslots
  - Automatische berekening van vertrektijd via Waze (90 km/h max snelheid)
- **Visuele indicatoren:**
  - Grijze afspraken: toegewezen aan definitieve planning
  - Groene afspraken: geannuleerd
  - Rode afspraken: gepland
  - Blauwe afspraken: gepland eigen beton
  - Gestreepte secties: reistijd
  - Waarschuwingen bij overlappende afspraken

### 2. Job Management
- **Volledige jobgegevens:**
  - Automatische vertrektijdberekening via Waze/Google Maps
  - Pomptype selectie uit beheerbare lijst
  - Chauffeur toewijzing
  - Klant- en adresgegevens met Google Maps integratie
  - Prijslijst en facturatiegegevens
  - Notities voor dispatcher en chauffeur
- **Status workflow:**
  - Te plannen → Gepland → Gepland eigen beton → Geannuleerd
  - Chauffeurs kunnen status bijwerken via WhatsApp
  - De status kan ook aangepast worden door de dispatcher

### 3. Administratieve Pagina's
- **Klantenbeheer** (`/admin/clients`)
- **Betoncentrales** (`/admin/concrete-plants`)
- **Werven** (`/admin/yards`)
- **Prijslijsten** (`/admin/prices`)
- **Gebruikersbeheer** (`/admin/users`)
- **Machines** (`/admin/machines`)
- **Factuurtemplates** (`/admin/invoicing`)

### 4. Dashboard & Rapportering (`/dashboard`)
- **Aanpasbare rapporten:**
  - Bruto omzet per klant per werkdag
  - Aantal jobs per chauffeur per werkdag
  - Volume per pomp per werkdag
  - Annulatieanalyse per klant
- **Excel export** voor alle gegevens en rapporten

### 5. Integraties
- **WhatsApp API:** Automatische notificaties naar chauffeurs
- **Google Maps:** Adresautocomplete en routeberekening
- **Waze SDK:** Realistische reistijdberekening
- **Excel export:** Voor alle gegevens en rapporten

## Technische Specificaties

### Technologie Stack
- **Framework:** Next.js 15.5.3 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authenticatie:** Supabase Auth
- **Styling:** Tailwind CSS v4 + Shadcn/ui
- **Talen:** Engels (database) + Nederlands (interface)
- **Visualisatie:** Chart.js
- **Kaarten:** Google Maps API + Waze SDK
- **Berichten:** WhatsApp API

### Beveiliging & Toegang
- **Rollen:** Pompist, Manager, Dispatcher, Accountant
- **Pompisten:** Alleen eigen rooster bekijken
- **Andere gebruikers:** Volledige lees/schrijftoegang, behalve tot gebruikersbeheer
- **Gebruikersbeheer:** Alleen Managers

## Projecttimeline

### Fase 1: Kernfunctionaliteit (Klaar 8 december 2025)
- Database opzet en authenticatie
- Basis kalenderweergaven
- Job CRUD operaties
- Administratieve pagina's
- **Facturering:** €4.800 (exclusief BTW)

### Fase 2: Geavanceerde Features (Klaar 2 februari 2026)
- Kalender interacties (slepen/neerzetten)
- WhatsApp integratie
- Waze/Google Maps integratie
- Dashboard en rapportering
- Excel export functionaliteit
- **Facturering:** €4.800 (exclusief BTW)

### Fase 3: Testen & Verfijning (Maart 2026)
- Uitgebreide testing
- Bug fixes en optimalisaties
- Gebruikerservaring verbeteringen
- Performance tuning

### Fase 4: Productie (Vanaf april 2026)
- Volledig productieklaar systeem
- Continue ondersteuning en updates

## Kostenstructuur
Alle prijzen zijn exclusief BTW.

### Maandelijkse Abonnementskosten
- **Database en website:** €1.000/maand
- **WhatsApp integratie:** €100/maand
- **Waze integratie:** €50/maand
- **Gebruikerslicenties:** €400 per 30 gebruikers
- **Totaal:** €1.550/maand

### Jaarlijkse Korting
- **Jaarlijks betalen:** €1.200 korting (€100/maand korting)
- **Nettokosten:** €1.450/maand bij jaarlijkse betaling

### Ontwikkelingskosten
- **Fase 1 (december 2025):** €4.800
- **Fase 2 (maart 2026):** €4.800
- **Totaal ontwikkeling:** €9.600

### Factureringsstructuur
De ontwikkelingskosten worden in korting gebracht met de abonnementskosten:
- **Jaarlijkse abonnementskosten:** €1.450 × 12 = €17.400
- **Minus ontwikkelingskosten:** €17.400 - €9.600 = €7.800
- **Te factureren bij start abonnement:** €7.800

## Voordelen van het Systeem

### Operationele Efficiëntie
- **Geautomatiseerde planning:** Waze integratie voor realistische reistijden
- **Visuele kalender:** Overzichtelijke planning met drag & drop functionaliteit
- **WhatsApp notificaties:** Directe communicatie met chauffeurs
- **Excel export:** Eenvoudige data-export voor verdere analyse

### Gebruiksvriendelijkheid
- **Responsive design:** Werkt op alle apparaten
- **Intuïtieve interface:** Moderne, strakke styling
- **Meertalig:** Nederlandse interface met Engelse database
- **Rolgebaseerde toegang:** Iedereen ziet alleen relevante informatie

### Schaalbaarheid
- **Cloud-gebaseerd:** Supabase voor betrouwbare hosting
- **Modulaire opbouw:** Eenvoudig uit te breiden
- **API integraties:** Klaar voor toekomstige uitbreidingen
- **Backup en recovery:** Automatische data bescherming

## Toekomstige Uitbreidingen
- **Real-time tracking:** Locatie en status van pompen
- **WhatsApp status updates:** Chauffeurs kunnen status bijwerken via WhatsApp
- **Accounting integratie:** Koppeling met boekhoudsoftware (Yuki)
- **Geavanceerde analytics:** Uitgebreidere rapportage mogelijkheden

## Volgende Stappen
1. **Goedkeuring projectvoorstel** door klant
2. **Contract ondertekening** met betalingsvoorwaarden
3. **Start ontwikkeling Fase 1** (eind september 2025)
4. **Regelmatige updates** tijdens ontwikkelingsproces
5. **Levering en implementatie** volgens timeline

---

**Contact:** Voor vragen over dit voorstel kunt u contact opnemen via maesulysse@gmail.com

*Alle prijzen zijn exclusief BTW. Dit voorstel is geldig tot 30/9/2025.*

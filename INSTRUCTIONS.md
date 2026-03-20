# YO, TASTE! - Konfigurace a Nasazení

Tento dokument obsahuje seznam klíčů a nastavení, které je potřeba doplnit pro plnou funkčnost aplikace, zejména pro Stripe platby a AI generování receptů.

### 1. Environmentální proměnné (`.env.local`)
Vytvořte soubor `.env.local` v kořenovém adresáři projektu a vložte do něj následující:

```env
# Google Gemini API (pro generování receptů)
GEMINI_API_KEY=vase_gemini_api_key_zde

# Stripe API (pro platby)
STRIPE_SECRET_KEY=sk_test_... # Tajný klíč z dashboardu Stripe
STRIPE_WEBHOOK_SECRET=whsec_... # (Volitelné) Pro automatické zpracování plateb

# Nastavení serveru
PORT=3001
FRONTEND_URL=http://localhost:8092
DB_PATH=./server/db/db.json
```

### 2. Stripe Konfigurace
Pro fungující platby musíte mít ve Stripe Dashboardu vytvořený:
1. **Produkt**: "YO, TASTE! Premium"
2. **Cenový plán**: Nastavený na 99 Kč / měsíc (opakující se platba).
3. **Price ID**: ID začínající na `price_...`, které musíte vložit do souboru `src/App.tsx` v metodě `handleBuyPremium`.

### 3. Docker Deployment
Aplikace je připravena pro Docker. Pro spuštění použijte:

```bash
docker-compose up --build
```

### 4. Databáze
Aplikace používá `lowdb` (JSON soubor). Data jsou perzistentní díky Docker volume namapovanému na `./server/db`. Pokud soubor neexistuje, vytvoří se automaticky při prvním spuštění.

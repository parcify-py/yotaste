import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Stripe key defined:', !!process.env.STRIPE_SECRET_KEY);
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY is not defined. Please check your .env or .env.local file.');
}
const stripe = new Stripe(stripeKey || 'sk_test_mock');

// Database setup
const defaultData = { users: [], purchases: [] };
const dbPath = process.env.DB_PATH || path.join(__dirname, 'db', 'db.json');
const db = await JSONFilePreset(dbPath, defaultData);

const app = express();

// Webhook endpoint (must be BEFORE express.json())
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (webhookSecret && sig) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // Fallback for development/testing without webhook signing
            event = req.body;
        }
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        console.log(`Payment successful for user: ${userId}`);

        // Update user in db
        await db.update(({ users }: any) => {
            const user = users.find((u: any) => u.id === userId);
            if (user) {
                user.isPremium = true;
            } else {
                // If user doesn't exist, create it (shouldn't happen in real app)
                users.push({ id: userId, isPremium: true });
            }
        });
    }

    res.json({received: true});
});

app.use(express.json());
app.use(cors());

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'yo-taste-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, name } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Find or create user
    let user = db.data.users.find((u: any) => u.email === email);
    
    if (!user) {
        user = {
            id: Math.random().toString(36).substring(2, 9),
            name: name || email.split('@')[0],
            email: email,
            isPremium: false
        };
        await db.update(({ users }: any) => users.push(user));
    }

    // Save user to session
    (req.session as any).user = user;
    
    res.json(user);
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ success: true });
    });
});

// Get current user session
app.get('/api/me', (req, res) => {
    const user = (req.session as any).user;
    if (user) {
        // Refresh user data from DB to get latest premium status
        const freshUser = db.data.users.find((u: any) => u.id === user.id);
        res.json(freshUser || user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// ... (other API endpoints)

// For any request that doesn't match an API route, send back index.html
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    const { priceId, userId } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'czk',
                        product_data: {
                            name: 'YO, TASTE! Premium',
                            description: 'Vařte bez reklam a s okamžitým přístupem k receptům.',
                        },
                        unit_amount: 9900, // 99.00 CZK
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `http://localhost:8092/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:8092/cancel`,
            metadata: {
                userId: userId,
            },
        });

        res.json({ id: session.id, url: session.url });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Mock user endpoint
app.get('/api/users/:id', async (req, res) => {
    const user = db.data.users.find((u: any) => u.id === req.params.id);
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

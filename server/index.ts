import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Database setup
const defaultData = { users: [], purchases: [] };
const dbPath = process.env.DB_PATH || path.join(__dirname, 'db', 'db.json');
const db = await JSONFilePreset(dbPath, defaultData);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
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
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/cancel`,
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

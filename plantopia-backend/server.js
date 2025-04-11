const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'https://plantopia-w5m1.onrender.com' })); // Match your frontend origin
app.use(express.json());

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined in .env file');
    process.exit(1);
}

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    name: String,
    email: String,
    picture: String,
    orders: [{
        orderId: String,
        date: String,
        items: [{
            name: String,
            price: Number,
            quantity: Number,
            image: String
        }],
        totalCost: String,
        status: String,
        method: String,
        address: String,
        pickupTime: String,
        paymentMethod: String,
        closed: { type: Boolean, default: false }
    }],
    reservations: [{
        reservationId: { type: String, required: true },
        table: { type: Number, required: true },
        name: { type: String, required: true },
        people: { type: Number, required: true },
        date: { type: String, required: true },
        time: { type: String, required: true },
        branch: { type: String, required: true },
        cancelled: { type: Boolean, default: false }
    }]
});

const User = mongoose.model('User', userSchema);

// Root route for debugging
app.get('/', (req, res) => {
    res.send('Server is running');
});

// General Reservation Endpoint
app.get('/api/reservations/:branch/:date/:time', async (req, res) => {
    try {
        const { branch, date, time } = req.params;
        const dbTime = time.replace('_', ' '); // Convert underscore back to space for DB query
        console.log('Received request for reservations:', { branch, date, time: dbTime });
        const users = await User.find({
            'reservations.branch': branch,
            'reservations.date': date,
            'reservations.time': dbTime,
            'reservations.cancelled': false
        });
        const reservedTables = users.flatMap(user =>
            user.reservations
                .filter(r => r.branch === branch && r.date === date && r.time === dbTime && !r.cancelled)
                .map(r => r.table)
        );
        console.log('Returning reserved tables:', reservedTables);
        res.json(reservedTables);
    } catch (err) {
        console.error('Error fetching reservations:', err);
        res.status(500).json({ message: err.message });
    }
});

// Order Endpoints
app.get('/api/users/:googleId/orders', async (req, res) => {
    try {
        const user = await User.findOne({ googleId: req.params.googleId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/users/:googleId/orders', async (req, res) => {
    try {
        const order = req.body;
        let user = await User.findOne({ googleId: req.params.googleId });
        if (!user) {
            user = new User({ googleId: req.params.googleId, orders: [order], reservations: [] });
        } else {
            user.orders.push(order);
        }
        await user.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/users/:googleId/orders/:orderId/close', async (req, res) => {
    try {
        const user = await User.findOne({ googleId: req.params.googleId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const order = user.orders.find(o => o.orderId === req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        order.closed = true;
        await user.save();
        res.json({ message: 'Order closed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { googleId, name, email, picture } = req.body;
        let user = await User.findOne({ googleId });
        if (!user) {
            user = new User({ googleId, name, email, picture, orders: [], reservations: [] });
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// User Reservation Endpoints
app.get('/api/users/:googleId/reservations', async (req, res) => {
    try {
        const user = await User.findOne({ googleId: req.params.googleId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.reservations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/users/:googleId/reservations', async (req, res) => {
    try {
        const { table, date, time, branch } = req.body;
        console.log('Checking reservation conflict:', { table, date, time, branch });
        const existingReservations = await User.find({
            'reservations.branch': branch,
            'reservations.date': date,
            'reservations.time': time,
            'reservations.table': table,
            'reservations.cancelled': false
        });
        if (existingReservations.length > 0) {
            return res.status(400).json({ message: 'Table is already reserved for this time slot' });
        }

        const reservation = {
            ...req.body,
            reservationId: `RES-${uuidv4()}`
        };
        let user = await User.findOne({ googleId: req.params.googleId });
        if (!user) {
            user = new User({ googleId: req.params.googleId, orders: [], reservations: [reservation] });
        } else {
            user.reservations.push(reservation);
        }
        await user.save();
        console.log('Reservation saved:', reservation);
        res.status(201).json(reservation);
    } catch (err) {
        console.error('Error saving reservation:', err);
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/users/:googleId/reservations/:reservationId/cancel', async (req, res) => {
    try {
        const user = await User.findOne({ googleId: req.params.googleId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const reservation = user.reservations.find(r => r.reservationId === req.params.reservationId);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
        reservation.cancelled = true;
        await user.save();
        res.json({ message: 'Reservation cancelled' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

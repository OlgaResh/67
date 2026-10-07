const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

let db;

// Підключення до MongoDB Atlas
MongoClient.connect(process.env.MONGODB_URI)
    .then(client => {
        console.log('Успішно підключено до MongoDB Atlas');
        db = client.db('myDatabase'); // Можете замінити на назву своєї бази даних
        
        app.listen(port, () => {
            console.log(`Сервер запущено на http://localhost:${port}`);
        });
    })
    .catch(error => console.error('Помилка підключення:', error));

app.use(express.json());

// 1. Маршрут з використанням курсора (stream)
app.get('/stream-items', async (req, res) => {
    try {
        const cursor = db.collection('items').find({});

        res.setHeader('Content-Type', 'application/json');
        res.write('[');

        let first = true;
        for await (const doc of cursor) {
            if (!first) {
                res.write(',');
            }
            res.write(JSON.stringify(doc));
            first = false;
        }

        res.write(']');
        res.end();
    } catch (error) {
        console.error('Помилка курсора:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. Маршрут з агрегаційним запитом
app.get('/stats', async (req, res) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: "$category",
                    totalCount: { $sum: 1 },
                    averagePrice: { $avg: "$price" }
                }
            }
        ];

        const result = await db.collection('items').aggregate(pipeline).toArray();
        res.json(result);
    } catch (error) {
        console.error('Помилка агрегації:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

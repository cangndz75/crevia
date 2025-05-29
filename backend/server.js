const express = require('express');
const cors = require('cors'); 
const dotenv = require('dotenv');
const connectDb = require('./config/db.js');

dotenv.config();

const app = express();

connectDb();

app.use(cors);
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend çalışıyor...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
})
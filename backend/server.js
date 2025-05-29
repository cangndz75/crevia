const express = require('express');
const cors = require('cors'); 
const dotenv = require('dotenv');
const connectDb = require('./config/db.js');
const Role = require('./models/role.js');

dotenv.config();

const app = express();

connectDb();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend çalışıyor...');
});

const PORT = process.env.PORT || 5000;

const defaultRoles = [
  { label: 'Tasarımcı', value: 'designer' },
  { label: 'Proje Yöneticisi', value: 'manager' },
  { label: 'İç Mimar', value: 'interior' },
  { label: 'Peyzaj Mimarı', value: 'landscape' },
  { label: 'Uygulamacı', value: 'contractor' },
  { label: 'Tedarikçi', value: 'supplier' },
  { label: 'Diğer', value: 'other' },
];

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
})

app.get('/api/roles', async (req, res) => {
  try {
    const count = await Role.countDocuments();
    if (count === 0) {
      await Role.insertMany(defaultRoles);
      console.log("Varsayılan roller yüklendi.");
    }

    const roles = await Role.find().select('label value');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Roller alınamadı', error: err });
  }
});

// Role.insertMany(defaultRoles).then(() => console.log("Roller kaydedildi"));

require('dotenv/config');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(() => {
  return mongoose.connection.db.collection('configtramites').updateOne(
    { tipo: 'COA' }, 
    { $set: { fechaCierre: new Date('2026-12-31T23:59:59Z') } }
  );
}).then(console.log).then(() => process.exit(0));

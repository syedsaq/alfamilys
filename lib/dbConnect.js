import mongoose from 'mongoose';

let isConnected = false;

const Connectdb = async () => {
  if (isConnected) return;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env');

  await mongoose.connect(MONGODB_URI, {
    dbName: 'myappdb',
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  isConnected = true;
  //console.log('✅ MongoDB connected');
};

export default Connectdb ; // 👈 default export

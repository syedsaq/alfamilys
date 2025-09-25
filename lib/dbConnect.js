import mongoose from "mongoose";

let isConnected = false;

const Connectdb = async () => {
  if (isConnected) return;

  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || "myappdb"; // ✅ get db from env

  if (!MONGODB_URI) throw new Error("❌ MONGODB_URI not set in .env");

  await mongoose.connect(MONGODB_URI, {
    dbName: DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  isConnected = true;
  console.log(`✅ MongoDB connected to database: ${DB_NAME}`);
};

export default Connectdb;



// import mongoose from 'mongoose';

// let isConnected = false;

// const Connectdb = async () => {
//   if (isConnected) return;

//   const MONGODB_URI = process.env.MONGODB_URI;
//   if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env');

//   await mongoose.connect(MONGODB_URI, {
//     dbName: 'myappdb',
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });

//   isConnected = true;
//   //console.log('✅ MongoDB connected');
// };

// export default Connectdb ; // 👈 default export

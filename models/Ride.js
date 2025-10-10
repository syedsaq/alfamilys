import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String, required: true }, // 👈 new field added
});

const rideSchema = new mongoose.Schema(
  {
    rideType: {
      type: String,
      enum: ["request", "offer"],
      required: true,
    },

    pickupLocation: {
     type: locationSchema,
      required: true,
    },
    dropLocation: {
       type: locationSchema,
      required: true,
    },
    dateTime: { type: Date, required: true },

    rideDirection: {
      type: String,
      enum: ["home-to-office", "office-to-home"],
      required: false, // optional
    },

    // Rider for ride request
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.rideType === "request";
      },
    },

    // Driver for ride offer
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.rideType === "offer";
      },
    },

    requestedSeats: { type: Number }, // only for riders
    availableSeats: { type: Number }, // only for drivers
    acAvailable: { type: Boolean, default: false },

    notes: { type: String },

    status: {
      type: String,
      enum: ["pending", "available", "confirmed", "completed", "cancelled"],
      default: function () {
        return this.rideType === "offer" ? "available" : "pending";
      },
    },
  },
  { timestamps: true }
);

const Ride = mongoose.models.Ride || mongoose.model("Ride", rideSchema);
export default Ride;

// // models/Ride.js
// import mongoose from "mongoose";

// const rideSchema = new mongoose.Schema(
//   {
//     rideType: {
//       type: String,
//       enum: ["request", "offer"],
//       required: true,
//     },

//     pickupLocation: {
//       latitude: { type: Number, required: true },
//       longitude: { type: Number, required: true },
//     },
//     dropLocation: {
//       latitude: { type: Number, required: true },
//       longitude: { type: Number, required: true },
//     },
//     dateTime: { type: Date, required: true },

//     // Rider for ride request
//     rider: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: function () {
//         return this.rideType === "request";
//       },
//     },

//     // Driver for ride offer
//     driver: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: function () {
//         return this.rideType === "offer";
//       },
//     },

//     requestedSeats: { type: Number }, // only used for rider
//     availableSeats: { type: Number }, // only used for driver
//     acAvailable: { type: Boolean, default: false },

//     notes: { type: String },

//     // allow "available" for offers
//     status: {
//       type: String,
//       enum: ["pending", "available", "confirmed", "completed", "cancelled"],
//       default: function () {
//         return this.rideType === "offer" ? "available" : "pending";
//       },
//     },
//   },
//   { timestamps: true }
// );

// const Ride = mongoose.models.Ride || mongoose.model("Ride", rideSchema);

// export default Ride;

// models/Ride.js
// import mongoose from "mongoose";

// const RideSchema = new mongoose.Schema(
//   {
//     rider: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     pickupLocation: {
//       latitude: { type: Number, required: true },
//       longitude: { type: Number, required: true },
//     },
//     dropLocation: {
//       latitude: { type: Number, required: true },
//       longitude: { type: Number, required: true },
//     },
//     dateTime: { type: Date, required: true },
//     notes: { type: String },
//     status: {
//       type: String,
//       enum: ["pending", "accepted", "completed", "cancelled"],
//       default: "pending",
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.models.Ride || mongoose.model("Ride", RideSchema);

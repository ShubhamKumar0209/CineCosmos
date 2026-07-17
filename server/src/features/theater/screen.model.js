import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema(
  {
    row: { type: Number, required: true },
    col: { type: Number, required: true },
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Screen name is required (e.g., Screen 1)'],
      trim: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: [true, 'Theater reference is required'],
      index: true,
    },
    seatLayout: {
      rows: { type: Number, required: true },
      columns: { type: Number, required: true },
      aisleAfterRows: { type: [Number], default: [] },
      aisleAfterColumns: { type: [Number], default: [] },
      unavailableSeats: { type: [seatSchema], default: [] }, // Seats blocked due to pillars, stairs, etc.
    },
    totalSeats: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate totalSeats if not provided explicitly
screenSchema.pre('save', function (next) {
  if (this.isModified('seatLayout')) {
    const totalPossible = this.seatLayout.rows * this.seatLayout.columns;
    const unavailableCount = this.seatLayout.unavailableSeats.length;
    this.totalSeats = totalPossible - unavailableCount;
  }
  next();
});

const Screen = mongoose.model('Screen', screenSchema);

export default Screen;

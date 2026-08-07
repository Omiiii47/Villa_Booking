const mongoose = require('mongoose');

const historySchema = mongoose.Schema(
  {
    actor: { type: String, default: 'system' },
    actorType: { type: String, enum: ['sales', 'admin', 'user', 'system'], default: 'system' },
    action: { type: String },
    note: { type: String, default: '' },
    changes: { type: mongoose.Schema.Types.Mixed },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bookingSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    villa: { type: mongoose.Schema.Types.ObjectId, ref: 'Villa', required: true },
    checkIn: { type: Date, required: [true, 'Please add check-in date'] },
    checkOut: { type: Date, required: [true, 'Please add check-out date'] },
    nights: { type: Number, default: 0 },
    guests: { type: Number, required: true, default: 1 },
    adults: { type: Number, default: 1 },
    kids: { type: Number, default: 0 },
    infants: { type: Number, default: 0 },
    pets: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    estimatedPrice: { type: Number },
    quotedPrice: { type: Number },
    finalPrice: { type: Number },

    /**
     * Legacy `status` derived from reviewStatus + bookingStatus via a
     * pre-save hook. Kept only for backward compatibility — new code
     * should read `reviewStatus` and `bookingStatus` instead.
     */
    status: {
      type: String,
      enum: ['pending', 'pending-custom', 'payment-pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'requested', 'under-review', 'approved', 'expired'],
      default: 'pending',
    },

    /**
     * Single canonical lifecycle. `reviewStatus` is controlled only by the
     * Sales Team; `bookingStatus` is the source of truth for the customer's
     * booking lifecycle (wealth whose dates hold/block a villa).
     *
     * - REQUESTED:      submitted, awaiting Sales review (dates NOT held)
     * - UNDER_REVIEW:   Sales opened/handling it (dates still NOT held)
     * - APPROVED:       Sales approved; no payment link yet (dates NOT held)
     * - PAYMENT_PENDING:payment link sent → dates held (YELLOW), hold window
     * - CONFIRMED:      first successful payment → dates locked (RED)
     * - CANCELLED:      cancelled before completion (dates released)
     * - EXPIRED:        payment attempt expired/failed → dates released
     * - COMPLETED:      stay finished
     */
    bookingStatus: {
      type: String,
      enum: ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED'],
      default: 'REQUESTED',
    },
    reviewStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PENDING', 'LINK_SENT', 'LINK_EXPIRED', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'UNPAID',
    },
    /**
     * Payment hold — dates are reserved (yelled "Payment in Progress") from
     * the moment a payment link is sent until the first payment lands or the
     * hold window elapses. `paymentHoldStartedAt` and `paymentHoldExpiresAt`
     * bound the window; after expiry a reaper flips the booking to EXPIRED and
     * releases the dates.
     */
    paymentHoldStartedAt: { type: Date },
    paymentHoldExpiresAt: { type: Date },
    /**
     * Transient guard used by the "first payment wins" webhook: set to the
     * Razorpay payment id once a confirmation has been (or is being) applied,
     * so duplicate webhook deliveries cannot double-confirm.
     */
    paymentProcessedId: { type: String },
    paymentId: { type: String },
    paymentLink: { type: String },
    paymentLinkId: { type: String },
    paymentLinkExpiresAt: { type: Date },
    paymentDate: { type: Date },
    amountPaid: { type: Number },
    paymentHistory: {
      type: [
        {
          linkId: { type: String },
          url: { type: String },
          amount: { type: Number },
          currency: { type: String, default: 'INR' },
          status: { type: String },
          expiresAt: { type: Date },
          source: { type: String, enum: ['razorpay', 'manual'], default: 'razorpay' },
          createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
          createdAt: { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },

    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },
    customerCountry: { type: String },
    purposeOfStay: { type: String },
    arrivalTime: { type: String },
    specialRequests: { type: String },
    paymentMethod: { type: String, default: 'pending' },

    standardCapacity: { type: Number },
    requestedGuests: { type: Number },
    extraGuests: { type: Number },
    isCustomBooking: { type: Boolean, default: false },
    requiresManualReview: { type: Boolean, default: false },
    approvalReason: { type: String },
    internalNotes: { type: String },
    offerSent: { type: Boolean, default: false },

    assignedSales: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    cancelledBy: { type: String, enum: ['customer', 'sales', 'admin'] },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },

    history: { type: [historySchema], default: [] },

    customPricing: {
      basePrice: { type: Number },
      extraGuestFee: { type: Number, default: 0 },
      extraGuestCount: { type: Number, default: 0 },
      cleaningFee: { type: Number, default: 0 },
      additionalServices: { type: Number, default: 0 },
      housekeepingCharges: { type: Number, default: 0 },
      beddingCharges: { type: Number, default: 0 },
      securityCharges: { type: Number, default: 0 },
      transportation: { type: Number, default: 0 },
      chefServices: { type: Number, default: 0 },
      decoration: { type: Number, default: 0 },
      airportPickup: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      complimentaryServices: { type: String, default: '' },
      overrideAmount: { type: Number },
      totalPerNight: { type: Number },
      totalAmount: { type: Number },
      offerMessage: { type: String },
      _id: false,
    },
  },
  { timestamps: true }
);

/**
 * Legacy `status` kept in sync for backward compatibility with older
 * consumers and seed data. Primary source of truth is `reviewStatus` +
 * `bookingStatus`; they are never mixed.
 */
bookingSchema.pre('save', async function () {
  if (
    this.isModified('reviewStatus') ||
    this.isModified('bookingStatus') ||
    this.isNew
  ) {
    if (this.reviewStatus === 'REJECTED') this.status = 'rejected';
    else if (this.bookingStatus === 'CANCELLED') this.status = 'cancelled';
    else if (this.bookingStatus === 'COMPLETED') this.status = 'completed';
    else if (this.bookingStatus === 'CONFIRMED') this.status = 'confirmed';
    else if (this.bookingStatus === 'EXPIRED') this.status = 'expired';
    else if (this.bookingStatus === 'PAYMENT_PENDING') this.status = this.reviewStatus === 'APPROVED' ? 'payment-pending' : 'pending';
    else if (this.bookingStatus === 'APPROVED') this.status = 'approved';
    else if (this.bookingStatus === 'UNDER_REVIEW') this.status = 'under-review';
    else this.status = 'requested';
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
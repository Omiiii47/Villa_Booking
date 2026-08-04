const Review = require('../models/Review');
const Villa = require('../models/Villa');

const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const villaId = req.params.villaId;

    const villa = await Villa.findById(villaId);
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }

    const alreadyReviewed = await Review.findOne({ user: req.user._id, villa: villaId });
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this villa' });
    }

    const review = await Review.create({
      user: req.user._id,
      villa: villaId,
      rating: Number(rating),
      comment,
    });

    const reviews = await Review.find({ villa: villaId });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    villa.rating = Math.round(avgRating * 10) / 10;
    villa.numReviews = reviews.length;
    await villa.save();

    const populated = await Review.findById(review._id).populate('user', 'name avatar');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVillaReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ villa: req.params.villaId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const villaId = review.villa;
    await Review.findByIdAndDelete(req.params.id);

    const reviews = await Review.find({ villa: villaId });
    const villa = await Villa.findById(villaId);
    if (villa) {
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        villa.rating = Math.round(avgRating * 10) / 10;
      } else {
        villa.rating = 0;
      }
      villa.numReviews = reviews.length;
      await villa.save();
    }

    res.json({ message: 'Review removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview, getVillaReviews, deleteReview };

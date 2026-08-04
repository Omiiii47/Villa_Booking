const Review = require('../models/Review');
const Villa = require('../models/Villa');

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const villaId = review.villa;
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

module.exports = { deleteReview };

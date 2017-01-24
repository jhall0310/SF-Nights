var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PostSchema = Schema({
  date: Date,
  votes: [Number],
  rating: Number,
  placeId: {
    type: Schema.Types.ObjectId,
    ref: 'Place'
  }
});

var Post = mongoose.model('Post', PostSchema);
module.exports = Post;

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlaceSchema = Schema({
  yelp_id: String,
  hours: [Schema.Types.Mixed],
  visitors: [{
    type: Schema.Types.ObjectId,
    ref: 'UserPlace'
  }],
  currentPost: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }]
});

var Place = mongoose.model('Place', PlaceSchema);
module.exports = Place;

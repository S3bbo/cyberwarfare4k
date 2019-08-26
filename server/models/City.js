const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const citySchema = new Schema({
  name: String,
  price: { type: Number, default: 2000 },
  residents: { type: [Schema.Types.ObjectId], ref: 'User' },
  allianceBase: { type: Schema.Types.ObjectId, ref: 'Alliance' }
});

// pushes userId into residents so server (and client) knows which hacker is in which city
citySchema.methods.arrival = function(userId) {
  console.log('arrival triggered', userId);
  this.residents.addToSet({ _id: userId });
  this.save();
};

// pop/pull userId into residents so server (and client) knows which hacker is in which city
citySchema.methods.departure = function(userId) {
  console.log('departure triggered', userId);
  this.residents.pull({ _id: userId });

  this.save();
};

module.exports = mongoose.model('City', citySchema);

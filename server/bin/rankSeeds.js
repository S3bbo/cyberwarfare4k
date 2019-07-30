const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Seeds file that remove all ranks and create all ranks for marketplace

// To execute this seed, run from the root of the project
// $ node bin/rankSeeds.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Rank = require('../models/Rank');

require('../configs/database');

let ranks = [
  {
    name: 'Script Kiddie',
    rank: 0,
    expToNewRank: 1000
  },

  {
    name: 'Family IT-Support',
    rank: 1,
    expToNewRank: 25000
  },

  {
    name: 'Blog Writer',
    rank: 2,
    expToNewRank: 45000
  },

  {
    name: "HTML 'programmer'",
    rank: 3,
    expToNewRank: 70000
  },

  {
    name: 'Jr. Web Dev',
    rank: 4,
    expToNewRank: 100000
  },

  {
    name: 'Sr. Web Dev',
    rank: 5,
    expToNewRank: 140000
  },

  {
    name: 'System Dev',
    rank: 6,
    expToNewRank: 200000
  },

  {
    name: 'Cyber Security Dev',
    rank: 7,
    expToNewRank: 300000
  },

  {
    name: 'Basement Dweller',
    rank: 8,
    expToNewRank: 500000
  },

  {
    name: 'Anonymous',
    rank: 9,
    expToNewRank: 9999999999999
  }
];

Rank.deleteMany()
  .then(() => {
    return Rank.create(ranks);
  })
  .then(ranksCreated => {
    console.log(`${ranksCreated.length} ranks created with the following id:`);
    console.log(itemsCreated.map(u => u._id));
  })
  .then(() => {
    // Close properly the connection to Mongoose
    mongoose.disconnect();
  })
  .catch(err => {
    mongoose.disconnect();
    throw err;
  });
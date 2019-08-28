const express = require('express');
const { isLoggedIn } = require('../middlewares/middleAuth');
const {
  buyRouteCriterias,
  soldRouteCriterias,
  sellCurrency,
  purchaseCurrency
} = require('../middlewares/middleCurrency');
const router = express.Router();
const User = require('../models/User');
const Currency = require('../models/Currency');

//todo move all functions to middleware

router.get('/', isLoggedIn, async (req, res, next) => {
  console.log('you are now in currency route');

  let currency = await Currency.find().populate('lastPurchasedBy', 'name');

  console.log(currency, 'currency');

  return res.status(200).json({
    success: true,
    message: 'currency loaded',
    currency
  });
});

router.post('/buy', isLoggedIn, async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  const batteryCost = 5;

  const { name, amount } = req.body;

  const currency = await Currency.findOne({ name });
  let totalPrice;

  // Checking if everything is in order for a purchase
  let message = buyRouteCriterias(user, batteryCost, currency, amount);
  console.log(message, 'message');
  if (message) {
    return res.status(400).json({
      success: false,
      message
    });
  }

  totalPrice = currency.price * amount;

  purchaseCurrency(user, currency, amount, batteryCost, totalPrice);

  res.status(200).json({
    success: true,
    message: `${amount} ${currency.name} purchased`
  });
});

router.post('/sell', isLoggedIn, async (req, res, next) => {
  console.log('you are now sell currency route');
  const userId = req.user._id;
  const user = await User.findById(userId);

  const batteryCost = 5;

  const { name, amount } = req.body;
  const currency = await Currency.findOne({ name });
  let totalPrice;

  // Checking if everything is in order for a sale
  let message = soldRouteCriterias(user, batteryCost, currency, amount);
  console.log(message, 'message');
  if (message) {
    return res.status(400).json({
      success: false,
      message
    });
  }

  totalPrice = currency.price * amount;

  sellCurrency(user, currency, amount, batteryCost, totalPrice);

  res.status(200).json({
    success: true,
    message: `${amount} ${currency.name} sold for ${totalPrice}`
  });
});

module.exports = router;
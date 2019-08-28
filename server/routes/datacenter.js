const express = require('express');
const { isLoggedIn } = require('../middlewares/middleAuth');
const {
  purchaseDataCenterCriterias,
  purchaseDataCenter,
  attackDataCenterCriterias,
  attackDataCenter
} = require('../middlewares/middleDataCenter');
const router = express.Router();
const DataCenter = require('../models/DataCenter');
const User = require('../models/User');

/* todo, allow alliance member to heal eachother datacenter or grace it?*/

router.get('/', async (req, res, next) => {
  const userId = req.user._id;
  let dataCenters = await DataCenter.find()
    .populate('requiredStash', ['name', 'price'])
    .populate('city', ['name', 'residents']);

  dataCenters = dataCenters.filter(el => {
    const stringifiedObjectId = JSON.stringify(el.city.residents);
    return stringifiedObjectId.includes(userId.toString());
  });
  console.log(req.user._id.toString(), 'userid');
  console.log(dataCenters.length);
  console.log(dataCenters);

  res.status(200).json({
    dataCenters,
    message: 'datacenters loaded..',
    success: true
  });

  // todo nullify values
});

router.post('/purchase', async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  const { dataCenterName } = req.body;

  const dataCenter = await DataCenter.findOne({ name: dataCenterName });

  const batteryCost = 0;

  let message = purchaseDataCenterCriterias(user, dataCenter, batteryCost);

  if (message) {
    return res.status(400).json({
      success: false,
      message
    });
  }

  purchaseDataCenter(user, dataCenter, batteryCost);

  res.status(200).json({
    success: true,
    message: `You purchased ${dataCenter.name} for ${dataCenter.price}`
  });
});

router.post('/attack', async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  const { dataCenterName } = req.body;
  const dataCenter = await DataCenter.findOne({ name: dataCenterName });

  const dataCenterOwnerId = dataCenter.owner;
  const dataCenterOwner = await User.findById(dataCenterOwnerId);

  const batteryCost = 5;

  let message = attackDataCenterCriterias(user, dataCenter, batteryCost);

  if (message) {
    return res.status(400).json({
      success: false,
      message
    });
  }

  let finalResult = await attackDataCenter(
    user,
    dataCenter,
    dataCenterOwner,
    batteryCost
  );

  res.status(200).json({
    success: true,
    message: `You attacked ${dataCenter.name} for ${batteryCost} battery and dealt ${finalResult.damageDealt} damage`,
    finalResult
  });
});

/* todo, one of the special weapons allows anonymousiy */
/* todo several feedback messages for res.json? */
/* todo see if models follow same structure on schema.type.objectid and arrays around or nested */
/* todo see if checkroutescriterias follow the same pattern */
module.exports = router;
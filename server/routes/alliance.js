const express = require('express');

const router = express.Router();
const User = require('../models/User');
const Alliance = require('../models/Alliance');
const City = require('../models/City');
const Message = require('../models/Message');
const Currency = require('../models/Currency');

const {
  checkCreateAllianceCriteria, saveAndUpdateUser, getInbox, findAllianceByIdAndPopulate,
  findAllianceStats, inviteSendCriteria, answerCriterias, promoteCriterias,
} = require('../logic/alliance');

// @GET
// PRIVATE
// Retrives all alliances and available cities

router.get('/', async (req, res) => {
  const alliances = await Alliance.find()
    .lean();
  const availableCities = await City.find({ allianceOwner: null })
    .select({ name: 1 })
    .lean();

  res.status(200).json({
    success: true,
    message: 'Alliances loaded...',
    alliances,
    cities: availableCities,
  });
});

// @GET
// PRIVATE
// Retrives dashboard information

router.get('/dashboard', async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  const alliance = await findAllianceByIdAndPopulate(user.alliance);

  const users = await User.find({ 'account.isSetup': true })
    .select({ name: 1, alliance: 1, allianceRole: 1 })
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    message: 'Dashboard loaded...',
    alliance,
    users,

  });
});

// @GET
// PRIVATE
// Retrives all alliances with stats

router.get('/ladder', async (req, res) => {
  const memberPopulateValues = [
    'hackSkill',
    'crimeSkill',
    'currencies',
    'fightInformation',
    'playerStats',
    'name',
  ];
  const alliances = await Alliance.find({ active: true })
    .populate('city', 'name')
    .populate('boss', memberPopulateValues)
    .populate('cto', memberPopulateValues)
    .populate('analyst', memberPopulateValues)
    .populate('firstLead', memberPopulateValues)
    .populate('secondLead', memberPopulateValues)
    .populate('firstMonkeys', memberPopulateValues)
    .populate('secondMonkeys', memberPopulateValues);
  const currencies = await Currency.find().lean();
  const cities = await City.find({ allianceOwner: { $ne: null } })
    .select({ name: 1, allianceOwner: 1 })
    .lean();
  const totStats = await findAllianceStats(alliances, cities, currencies);
  res.status(200).json({
    success: true,
    message: 'alliances ladder loaded...',
    totStats,
  });
});

// creating an alliance
router.post('/', async (req, res) => {
  const userId = req.user._id;
  const { allianceId, cityId } = req.body;

  const createCost = 1000000;

  const alliance = await Alliance.findById(allianceId);
  const user = await User.findById(userId);
  const city = await City.findById(cityId);

  const disallowed = checkCreateAllianceCriteria(user, alliance, createCost, city);

  if (disallowed) {
    return res.status(403).json({
      success: false,
      message: disallowed,
    });
  }
  alliance.claimAlliance(userId);
  user.createAlliance(createCost, alliance._id);
  city.setNewOwner(alliance._id);

  await alliance.save();
  await city.save();
  const updatedUser = await saveAndUpdateUser(user);

  return res.status(200).json({
    success: true,
    message: `${alliance.name} has been created!`,
    user: updatedUser,
  });
});

router.post('/invitation', async (req, res) => {
  const userId = req.user._id;
  const { id } = req.body;

  const user = await User.findById(userId);
  const alliance = await Alliance.findById(user.alliance);
  const invitedUser = await User.findById(id);

  const disallowed = inviteSendCriteria(user, alliance, invitedUser);

  if (disallowed) {
    return res.status(400).json({
      success: false,
      message: disallowed,
    });
  }

  const now = new Date(Date.now()).toString().slice(0, 21);
  alliance.inviteMember(now, invitedUser);
  await alliance.save();

  // const allianceName = user.alliance;

  //  const invitationText = `<p>${user.name} has invited you to join
  // ${allianceName} hats.<a href="alliance/accept/${allianceName}">Accept</a> or
  // <a href="alliance/decline/${allianceName}">decline</a></p>`;

  res.status(200).json({
    success: true,
    message: `invitation sent to ${invitedUser.name}`,
    invitedUser,
  });
});

// invited player declines or accepts invitation
router.patch('/invitation', async (req, res) => {
  const userId = req.user._id;
  const { id, answer } = req.body;

  const user = await User.findById(userId);
  const alliance = await Alliance.findById(id);
  let message;

  const disallowed = answerCriterias(user, alliance);

  if (disallowed) {
    return res.status(403).json({
      success: false,
      message: disallowed,
    });
  }

  // accepts
  if (answer) {
    const role = Math.random() > 0.5 ? 'firstMonkeys' : 'secondMonkeys';
    alliance.acceptInvitation(userId, role);
    user.alliance = id;
    user.allianceRole = role;
    message = `You have joined ${alliance.name} alliance`;
  } else {
    alliance.declineInvitation(userId);
    message = `You declined ${alliance.name} alliance`;
  }

  await alliance.save();
  const updatedUser = await saveAndUpdateUser(user);
  await Message.deleteOne({ allianceInvitation: id, to: userId });
  const inbox = await getInbox(userId);

  res.status(200).json({
    success: true,
    message,
    alliance,
    inbox,
    user: updatedUser,
  });
});

// router.post('/kick', async (req, res) => {
// const userId = req.user._id;
// const user = await User.findById(userId);
//
// const { playerId, newRole } = req.body;
// const player = await User.findById(playerId);
// });
//
router.post('/promote', async (req, res) => {
  const userId = req.user._id;
  const { playerId, newTitle } = req.body;

  const user = await User.findById(userId).lean();
  const promotedUser = await User.findById(playerId);
  const alliance = await Alliance.findById(user.alliance);

  const disallowed = promoteCriterias(user, promotedUser, alliance, newTitle);

  if (disallowed) {
    return res.status(403).json({
      success: false,
      message: disallowed,
    });
  }

  if (alliance[newTitle] && !Array.isArray(alliance[newTitle])) {
    const demotedUser = await User.findById(alliance[newTitle]);
    demotedUser.allianceRole = 'firstMonkeys';
    await demotedUser.save();
  }

  const oldTitle = promotedUser.allianceRole;
  alliance.changeAllianceRole(playerId, newTitle, oldTitle);
  promotedUser.allianceRole = newTitle;
  await promotedUser.save();
  await alliance.save();
  // disallow. wrong alliance. not boss

  const allianceMembers = await User.find({
    alliance: alliance._id,
    'account.isSetup': true,
  })
    .select({ name: 1, alliance: 1, allianceRole: 1 })
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    message: `${promotedUser.name} has been promoted to ${newTitle}`,
    allianceMembers,
  });
});
//
// router.delete('/dissolve', async (req, res) => {
// const userId = req.user._id;
// const user = await User.findById(userId);
//
// if (user.allianceRole !== 'Boss') {
// return res.status(403).json({
//      success: false,
//      message: 'Only the boss can do this',
// });
// }
// const alliance = await Alliance.findOneAndDelete(user.alliance);
//
// dissolveAlliance();
//
// res.status(200).json({
// success: true,
// message: `${alliance.name} has ceased to exist..`,
// });
// });

// @GET
// PRIVATE
// Retrives one alliance

router.get('/:allianceId', async (req, res) => {
  const alliance = await findAllianceByIdAndPopulate(req.params.allianceId);

  res.status(200).json({
    success: true,
    message: 'Alliance loaded...',
    alliance,
  });
});

router.patch('/leave', async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  // todo criterias
  // todo send notification
  const alliance = await Alliance.findById(user.alliance);
  alliance.leaveAlliance(req.user._id, user.allianceRole);
  user.leaveAlliance();
  alliance.leaveAlliance(userId);
  await alliance.save();
  const updatedUser = await saveAndUpdateUser(user);
  res.status(200).json({
    success: true,
    message: `You left ${alliance.name}...`,
    user: updatedUser,
  });
});

module.exports = router;

const Circular = require('../models/Circular');
const User = require('../models/User');

const getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    let stats = {};

    if (userRole === 'Principal') {
      const totalCirculars = await Circular.countDocuments();
      const totalUsers = await User.countDocuments();
      const newUsers = await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }); // Last 7 days
      
      const recentCirculars = await Circular.find().sort('-createdAt').limit(5).populate('createdBy', 'name');

      stats = { totalCirculars, totalUsers, newUsers, recentCirculars };
    } else if (userRole === 'Faculty' || userRole === 'HOD') {
      const myCirculars = await Circular.countDocuments({ createdBy: req.user._id });
      // Calculate read percentages for circulars created by me
      const recentMyCirculars = await Circular.find({ createdBy: req.user._id }).sort('-createdAt').limit(5);

      stats = { myCirculars, recentMyCirculars };
    } else {
      const { department, year } = req.user;
      
      const roleMatch = { 'targetAudience.role': userRole };
      const deptMatch = { $or: [
        { 'targetAudience.department': { $exists: false } },
        { 'targetAudience.department': '' },
        { 'targetAudience.department': department }
      ]};
      const yearMatch = { $or: [
        { 'targetAudience.year': { $exists: false } },
        { 'targetAudience.year': null },
        { 'targetAudience.year': year }
      ]};

      const query = {
        $or: [
          { 'targetAudience.role': 'All' },
          { $and: [ roleMatch, deptMatch, yearMatch ] }
        ]
      };
      const relevantCirculars = await Circular.countDocuments(query);
      
      const unreadQuery = {
        ...query,
        'readBy.user': { $ne: req.user._id }
      };
      
      const unreadCount = await Circular.countDocuments(unreadQuery);
      
      stats = { relevantCirculars, unreadCount };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats
};

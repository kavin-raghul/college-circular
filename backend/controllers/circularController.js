const Circular = require('../models/Circular');
const AuditLog = require('../models/AuditLog');

const createCircular = async (req, res) => {
  try {
    const { title, description, priority, category, targetAudience: targetAudienceStr, scheduledFor } = req.body;
    
    let targetAudience = { role: 'All' };
    if (targetAudienceStr) {
      try {
        targetAudience = typeof targetAudienceStr === 'string' ? JSON.parse(targetAudienceStr) : targetAudienceStr;
      } catch (e) {
         // ignore
      }
    }

    const attachments = req.files ? req.files.map(file => {
      // Cloudinary stores URL in file.path, local stores in file.filename
      return process.env.CLOUDINARY_CLOUD_NAME ? file.path : `/uploads/${file.filename}`;
    }) : [];

    const circular = await Circular.create({
      title,
      description,
      priority,
      category,
      attachments,
      targetAudience,
      createdBy: req.user._id,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null
    });

    await AuditLog.create({
      action: 'CREATED_CIRCULAR',
      performedBy: req.user._id,
      targetId: circular._id,
      details: { title: circular.title }
    });

    // Populate createdBy to return user info
    await circular.populate('createdBy', 'name email role department');

    // Emit Socket event to clients
    const io = req.app.get('io');
    
    const eventName = 'new_circular';
    if (targetAudience.role !== 'All') {
      let room = targetAudience.role;
      if (targetAudience.department) room += `_${targetAudience.department}`;
      if (targetAudience.year) room += `_${targetAudience.year}`;
      io.to(room).emit(eventName, circular);
    } else {
      io.emit(eventName, circular);
    }

    res.status(201).json(circular);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getCirculars = async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    if (userRole !== 'Principal') {
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

      query = {
        $or: [
          { 'targetAudience.role': 'All' },
          { createdBy: req.user._id },
          { $and: [ roleMatch, deptMatch, yearMatch ] }
        ]
      };
    }

    // Keyword search & Filtering
    const { keyword, category, priority, department, startDate, endDate } = req.query;

    if (keyword) {
      query.$or = [
        ...(query.$or || []),
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (department) query['targetAudience.department'] = department;
    
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const circulars = await Circular.find(query)
      .populate('createdBy', 'name role department')
      .sort('-createdAt'); // Newest first
    res.json(circulars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCircularById = async (req, res) => {
  try {
    const circular = await Circular.findById(req.params.id)
      .populate('createdBy', 'name role department email')
      .populate('readBy.user', 'name role department year');

    if (!circular) {
      return res.status(404).json({ message: 'Circular not found' });
    }

    res.json(circular);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const circular = await Circular.findById(req.params.id);

    if (!circular) {
      return res.status(404).json({ message: 'Circular not found' });
    }

    // Check if user already read it
    const alreadyRead = circular.readBy.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      circular.readBy.push({ user: req.user._id, readAt: Date.now() });
      await circular.save();
    }

    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCircular = async (req, res) => {
    try {
        const circular = await Circular.findById(req.params.id);

        if (!circular) {
          return res.status(404).json({ message: 'Circular not found' });
        }

        // Only Principal or creator can delete
        if(req.user.role !== 'Principal' && circular.createdBy.toString() !== req.user._id.toString()){
            return res.status(403).json({ message: 'User not authorized to delete this circular' });
        }

        await circular.deleteOne();

        await AuditLog.create({
          action: 'DELETED_CIRCULAR',
          performedBy: req.user._id,
          targetId: circular._id,
          details: { title: circular.title }
        });

        res.json({ message: 'Circular removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
  createCircular,
  getCirculars,
  getCircularById,
  markAsRead,
  deleteCircular
};

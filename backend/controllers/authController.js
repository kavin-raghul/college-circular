const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax'
};

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
    expiresIn: '7d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, year } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Student',
      department,
      year
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie('jwt', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content

    const refreshToken = cookies.jwt;
    const user = await User.findOne({ refreshToken });

    if (user) {
      await User.updateOne({ _id: user._id }, { $set: { refreshToken: '' } });
    }

    res.clearCookie('jwt', cookieOptions);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

    const refreshToken = cookies.jwt;
    const user = await User.findOne({ refreshToken });

    if (!user) return res.status(403).json({ message: 'Forbidden' });

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      (err, decoded) => {
        if (err || user.id !== decoded.id) return res.status(403).json({ message: 'Forbidden' });

        const accessToken = generateAccessToken(user.id);
        res.json({ accessToken });
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refresh
};

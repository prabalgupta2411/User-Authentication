import { Request, Response } from 'express';
import axios from 'axios';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';


// Access environment variables directly
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

// Debug logging with actual values (masked for security)
console.log('GitHub Auth Controller - Environment Variables:', {
  GITHUB_CLIENT_ID: GITHUB_CLIENT_ID ? 'Present' : 'Missing',
  GITHUB_CLIENT_SECRET: GITHUB_CLIENT_SECRET ? 'Present' : 'Missing',
  JWT_SECRET: JWT_SECRET ? 'Present' : 'Missing'
});

export const githubAuth = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    console.log('Received GitHub code:', code ? 'Present' : 'Missing');

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Double check environment variables
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      console.error('Missing GitHub credentials:', {
        clientId: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET ? 'Present' : 'Missing'
      });
      return res.status(500).json({ 
        message: 'GitHub OAuth configuration is missing',
        details: {
          clientId: GITHUB_CLIENT_ID ? 'Present' : 'Missing',
          clientSecret: GITHUB_CLIENT_SECRET ? 'Present' : 'Missing'
        }
      });
    }

    // Exchange code for access token
    console.log('Attempting to exchange code for access token...');
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('GitHub token response:', {
      status: tokenResponse.status,
      hasAccessToken: !!tokenResponse.data.access_token,
      error: tokenResponse.data.error,
      errorDescription: tokenResponse.data.error_description
    });

    if (!tokenResponse.data.access_token) {
      return res.status(400).json({ 
        message: 'Failed to get access token from GitHub',
        details: tokenResponse.data
      });
    }

    const { access_token } = tokenResponse.data;

    // Get user data from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
      },
    });

    const { email, id, login } = userResponse.data;

    // If email is not public, try to get it from the emails endpoint
    let userEmail = email;
    if (!userEmail) {
      const emailsResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json',
        },
      });
      const primaryEmail = emailsResponse.data.find((email: any) => email.primary);
      userEmail = primaryEmail ? primaryEmail.email : `${login}@github.com`;
    }

    // Check if user exists
    let user = await User.findOne({ email: userEmail });

    if (!user) {
      // Create new user
      user = new User({
        email: userEmail,
        password: id.toString(), // Using GitHub ID as password
      });
      await user.save();
    }

    // Create JWT token
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Redirect to frontend with token and user data
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user._id,
      email: user.email,
    }))}`;

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('GitHub auth error:', error.response?.data || error.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const errorRedirectUrl = `${frontendUrl}/auth?error=${encodeURIComponent(error.response?.data?.message || error.message)}`;
    res.redirect(errorRedirectUrl);
  }
}; 
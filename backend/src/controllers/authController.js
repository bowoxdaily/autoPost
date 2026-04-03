import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseAdmin } from '../utils/supabase.js';
import { generateToken } from '../utils/jwt.js';

// Helper: Generate API key
function generateApiKey() {
  return 'ap_' + crypto.randomBytes(32).toString('hex');
}

// Helper: Hash API key
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export async function registerUser(req, res) {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role 'user' (buyer)
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
          name: name || email.split('@')[0],
          role: 'user' // Default role
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Generate default API key untuk user
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    // Insert API key ke database
    await supabaseAdmin
      .from('api_keys')
      .insert([
        {
          user_id: data.id,
          key_hash: apiKeyHash,
          name: 'Default API Key'
        }
      ]);

    // Create default settings for user
    await supabaseAdmin
      .from('settings')
      .insert([
        {
          user_id: data.id
        }
      ]);

    // Generate token
    const token = generateToken(data.id, data.email, data.role);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role
      },
      api_key: apiKey // Hanya sekali di registration, jangan lupa save!
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_plan: user.subscription_plan,
        api_usage: user.api_usage,
        api_limit: user.api_limit
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}

export async function getProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, avatar_url, role, subscription_plan, api_usage, api_limit, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function updateProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, avatar_url } = req.body;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        name: name || undefined,
        avatar_url: avatar_url || undefined,
        updated_at: new Date()
      })
      .eq('id', req.user.userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Update failed' });
  }
}

import { supabaseAdmin } from '../utils/supabase.js';

// GET: All users (Superuser only)
export async function getAllUsers(req, res) {
  try {
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can access this' });
    }

    // Get all users with their usage stats
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, subscription_plan, api_usage, api_limit, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      total: users?.length || 0,
      users: users || []
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// GET: User by ID (Superuser only or own profile)
export async function getUserById(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Allow superuser or user viewing own profile
    if (req.user.role !== 'superuser' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't expose password hash
    delete user.password;

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

// PUT: Update user role (Superuser only)
export async function updateUserRole(req, res) {
  try {
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can do this' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    if (!['user', 'superuser'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be user or superuser' });
    }

    // Prevent last superuser removal
    if (role === 'user') {
      const { data: superusers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'superuser');

      if (superusers && superusers.length <= 1) {
        return res.status(400).json({ error: 'Cannot remove last superuser' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: data.id,
        email: data.email,
        role: data.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
}

// PUT: Update subscription plan (Superuser only)
export async function updateSubscriptionPlan(req, res) {
  try {
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can do this' });
    }

    const { userId } = req.params;
    const { subscription_plan, api_limit } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    if (!subscription_plan) {
      return res.status(400).json({ error: 'Subscription plan required (free, pro, enterprise)' });
    }

    const updateData = { subscription_plan };
    
    if (api_limit) {
      updateData.api_limit = api_limit;
    } else {
      // Set default limits based on plan
      switch (subscription_plan) {
        case 'free':
          updateData.api_limit = 100;
          break;
        case 'pro':
          updateData.api_limit = 10000;
          break;
        case 'enterprise':
          updateData.api_limit = 1000000;
          break;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      user: {
        id: data.id,
        email: data.email,
        subscription_plan: data.subscription_plan,
        api_limit: data.api_limit
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    return res.status(500).json({ error: 'Failed to update subscription' });
  }
}

// DELETE: Delete user (Superuser only)
export async function deleteUser(req, res) {
  try {
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can do this' });
    }

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Prevent self-deletion
    if (req.user.userId === userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // Prevent deleting last superuser
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (targetUser && targetUser.role === 'superuser') {
      const { data: superusers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'superuser');

      if (superusers && superusers.length <= 1) {
        return res.status(400).json({ error: 'Cannot delete last superuser' });
      }
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}

// GET: System stats (Superuser only)
export async function getSystemStats(req, res) {
  try {
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can access this' });
    }

    // Get total users
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, subscription_plan, api_usage');

    // Get total posts
    const { data: posts } = await supabaseAdmin
      .from('posts')
      .select('id');

    // Calculate stats
    const stats = {
      total_users: users?.length || 0,
      total_posts: posts?.length || 0,
      total_api_calls: users?.reduce((sum, u) => sum + (u.api_usage || 0), 0) || 0,
      users_by_plan: {
        free: users?.filter(u => u.subscription_plan === 'free').length || 0,
        pro: users?.filter(u => u.subscription_plan === 'pro').length || 0,
        enterprise: users?.filter(u => u.subscription_plan === 'enterprise').length || 0
      }
    };

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

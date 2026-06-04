/**
 * Authentication Service
 * Handles user auth, JWT, OAuth, password reset
 */

const { supabase } = require('../config/supabase');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { AuthenticationError, ConflictError, NotFoundError } = require('../utils/errors');
const crypto = require('crypto');

class AuthService {
  /**
   * Sign up with email & password
   */
  async signup(email, password, name) {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Create user in Supabase Auth
    const { data, error: authError } = await supabase.auth.signUpWithPassword({
      email,
      password
    });

    if (authError) {
      throw new AuthenticationError(authError.message);
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        name,
        plan: 'free',
        status: 'active',
        role: 'user',
        monthly_limit: 10 // FREE plan limit
      });

    if (profileError) {
      throw new AuthenticationError(profileError.message);
    }

    // Generate tokens
    const accessToken = generateAccessToken(data.user.id, email, 'free');
    const refreshToken = generateRefreshToken(data.user.id);

    return {
      user: {
        id: data.user.id,
        email,
        name,
        plan: 'free'
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  /**
   * Login with email & password
   */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Get user profile
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, plan, status')
      .eq('id', data.user.id)
      .single();

    if (fetchError || !user || user.status === 'suspended') {
      throw new AuthenticationError('Account not found or suspended');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.plan);
    const refreshToken = generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  /**
   * Google OAuth login
   */
  async googleLogin(googleToken) {
    // Verify token with Google
    const googleData = await this.verifyGoogleToken(googleToken);

    if (!googleData || !googleData.email) {
      throw new AuthenticationError('Invalid Google token');
    }

    // Check if user exists
    let { data: user } = await supabase
      .from('users')
      .select('id, email, name, plan, avatar_url')
      .eq('email', googleData.email)
      .single();

    // Create user if doesn't exist
    if (!user) {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: googleData.email,
          name: googleData.name,
          avatar_url: googleData.picture,
          plan: 'free',
          status: 'active',
          role: 'user',
          monthly_limit: 10
        })
        .select()
        .single();

      if (error) {
        throw new AuthenticationError('Failed to create account');
      }

      user = newUser;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.plan);
    const refreshToken = generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        avatar_url: user.avatar_url
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  /**
   * Verify Google OAuth token
   */
  async verifyGoogleToken(token) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `access_token=${token}`
      });

      const data = await response.json();

      if (!response.ok || !data.email) {
        throw new Error('Invalid token');
      }

      return {
        email: data.email,
        name: data.name,
        picture: data.picture
      };
    } catch (err) {
      throw new AuthenticationError('Failed to verify Google token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const { data: user } = await supabase
        .from('users')
        .select('id, email, plan')
        .eq('id', decoded.userId)
        .single();

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      const newAccessToken = generateAccessToken(user.id, user.email, user.plan);

      return {
        accessToken: newAccessToken
      };
    } catch (err) {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token (would need to add to users table)
    // await supabase
    //   .from('users')
    //   .update({
    //     reset_token_hash: resetTokenHash,
    //     reset_token_expires_at: resetTokenExpiry
    //   })
    //   .eq('id', user.id);

    // Send email with reset link
    // await emailService.sendPasswordResetEmail(email, resetToken);

    return { success: true };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('reset_token_hash', tokenHash)
      // .gt('reset_token_expires_at', new Date().toISOString())
      .single();

    if (error || !user) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw new AuthenticationError('Failed to reset password');
    }

    // Clear reset token
    // await supabase
    //   .from('users')
    //   .update({
    //     reset_token_hash: null,
    //     reset_token_expires_at: null
    //   })
    //   .eq('id', user.id);

    return { success: true };
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(userId, currentPassword, newPassword) {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (verifyError) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      throw new AuthenticationError('Failed to change password');
    }

    return { success: true };
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, plan, status, created_at, company_name, website, phone')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AuthenticationError('Failed to update profile');
    }

    return user;
  }

  /**
   * Logout (invalidate token - in real app, use token blacklist)
   */
  async logout(userId) {
    // In production, add to token blacklist or invalidate sessions
    return { success: true };
  }
}

module.exports = new AuthService();

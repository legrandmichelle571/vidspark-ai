/**
 * Data Validation Schemas using Joi-like validation
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const schemas = {
  // Auth
  signup: {
    email: { required: true, validate: validateEmail },
    password: { required: true, validate: validatePassword, minLength: 8 },
    name: { required: true, minLength: 2, maxLength: 255 }
  },

  login: {
    email: { required: true, validate: validateEmail },
    password: { required: true }
  },

  googleAuth: {
    token: { required: true, minLength: 10 }
  },

  // User
  updateProfile: {
    name: { minLength: 2, maxLength: 255 },
    company_name: { maxLength: 255 },
    website: { validate: validateUrl },
    phone: { maxLength: 20 }
  },

  changePassword: {
    currentPassword: { required: true },
    newPassword: { required: true, validate: validatePassword, minLength: 8 }
  },

  // Projects
  createProject: {
    title: { required: true, minLength: 3, maxLength: 255 },
    description: { maxLength: 1000 },
    project_type: { required: true, enum: ['youtube', 'upload', 'url'] },
    youtube_channel_id: { maxLength: 255 },
    youtube_channel_name: { maxLength: 255 }
  },

  // Analysis
  createAnalysis: {
    video_id: { required: true, uuid: true },
    analysis_type: { enum: ['full', 'seo', 'engagement', 'audience', 'competitor'] },
    ai_provider: { enum: ['openai', 'claude', 'gemini', 'deepseek'] }
  },

  // Payment
  createCheckout: {
    plan: { required: true, enum: ['pro', 'business', 'enterprise'] }
  },

  updatePlan: {
    plan: { required: true, enum: ['free', 'pro', 'business', 'enterprise'] }
  },

  refund: {
    payment_id: { required: true, uuid: true },
    reason: { required: true, minLength: 10, maxLength: 500 }
  }
};

const validateField = (value, rules) => {
  if (rules.required && (value === undefined || value === null || value === '')) {
    return 'Field is required';
  }

  if (value !== undefined && value !== null) {
    if (rules.minLength && value.toString().length < rules.minLength) {
      return `Minimum length is ${rules.minLength}`;
    }

    if (rules.maxLength && value.toString().length > rules.maxLength) {
      return `Maximum length is ${rules.maxLength}`;
    }

    if (rules.validate && !rules.validate(value)) {
      return 'Invalid format';
    }

    if (rules.enum && !rules.enum.includes(value)) {
      return `Must be one of: ${rules.enum.join(', ')}`;
    }

    if (rules.uuid && !isUUID(value)) {
      return 'Invalid UUID';
    }
  }

  return null;
};

const isUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

const validateRequest = (schema, data) => {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(data[field], rules);
    if (error) {
      errors[field] = error;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUrl,
  validateField,
  validateRequest,
  schemas,
  isUUID
};

/**
 * Request Validation Middleware
 */

const { validateRequest, schemas } = require('../utils/validators');
const { ValidationError } = require('../utils/errors');

/**
 * Validate request against schema
 */
const validate = (schemaName) => {
  return (req, res, next) => {
    try {
      const schema = schemas[schemaName];

      if (!schema) {
        return next(new Error(`Validation schema '${schemaName}' not found`));
      }

      // Merge all possible data sources
      const data = {
        ...req.query,
        ...req.params,
        ...req.body
      };

      const errors = validateRequest(schema, data);

      if (errors) {
        throw new ValidationError('Validation failed', errors);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  validate
};

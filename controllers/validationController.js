const Ajv = require('ajv');
const ajv = new Ajv(); 

const validate = (schema) => {
    return (req, res, next) => {
      const validate = ajv.compile(schema);
      const valid = validate(req.body); 
  
      if (!valid) {
        const errorMessages = validate.errors.map(err => err.message);
        return res.status(400).json({ errors: errorMessages });
      }
      next(); 
    };
};
 

module.exports = validate;
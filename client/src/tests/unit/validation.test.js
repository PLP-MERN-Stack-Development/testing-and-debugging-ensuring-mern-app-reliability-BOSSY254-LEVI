import {
  validateEmail,
  validatePassword,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePost,
  validateUser,
} from '../../utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('returns true for valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(validateEmail('test123@example.io')).toBe(true);
    });

    it('returns false for invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('returns true for valid passwords', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('MySecurePass1@')).toBe(true);
      expect(validatePassword('Test123!@#')).toBe(true);
    });

    it('returns false for invalid passwords', () => {
      expect(validatePassword('password')).toBe(false); // no uppercase, no number
      expect(validatePassword('PASSWORD')).toBe(false); // no lowercase, no number
      expect(validatePassword('Password')).toBe(false); // no number
      expect(validatePassword('12345678')).toBe(false); // no letters
      expect(validatePassword('Pass1')).toBe(false); // too short
    });
  });

  describe('validateRequired', () => {
    it('returns true for non-empty strings', () => {
      expect(validateRequired('test')).toBe(true);
      expect(validateRequired('  test  ')).toBe(true);
    });

    it('returns false for empty or whitespace-only strings', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });
  });

  describe('validateMinLength', () => {
    it('returns true when value meets minimum length', () => {
      expect(validateMinLength('hello', 3)).toBe(true);
      expect(validateMinLength('hi', 2)).toBe(true);
    });

    it('returns false when value is shorter than minimum length', () => {
      expect(validateMinLength('hi', 3)).toBe(false);
      expect(validateMinLength('', 1)).toBe(false);
    });
  });

  describe('validateMaxLength', () => {
    it('returns true when value is within maximum length', () => {
      expect(validateMaxLength('hello', 10)).toBe(true);
      expect(validateMaxLength('hi', 2)).toBe(true);
    });

    it('returns false when value exceeds maximum length', () => {
      expect(validateMaxLength('hello world', 5)).toBe(false);
    });

    it('returns true for null/undefined values', () => {
      expect(validateMaxLength(null, 5)).toBe(true);
      expect(validateMaxLength(undefined, 5)).toBe(true);
    });
  });

  describe('validatePost', () => {
    it('returns valid result for valid post data', () => {
      const validPost = {
        title: 'Valid Title',
        content: 'This is a valid content with more than 10 characters for testing purposes.',
        category: 'technology',
      };

      const result = validatePost(validPost);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns invalid result with errors for invalid post data', () => {
      const invalidPost = {
        title: 'Hi', // too short
        content: 'Short', // too short
        category: '', // empty
      };

      const result = validatePost(invalidPost);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('title');
      expect(result.errors).toHaveProperty('content');
      expect(result.errors).toHaveProperty('category');
    });

    it('validates title length constraints', () => {
      const shortTitle = { title: 'Hi', content: 'Valid content', category: 'tech' };
      const longTitle = {
        title: 'a'.repeat(101), // 101 characters
        content: 'Valid content',
        category: 'tech'
      };

      expect(validatePost(shortTitle).isValid).toBe(false);
      expect(validatePost(longTitle).isValid).toBe(false);
    });

    it('validates content minimum length', () => {
      const shortContent = { title: 'Valid Title', content: 'Short', category: 'tech' };
      const validContent = {
        title: 'Valid Title',
        content: 'This content has more than 10 characters',
        category: 'tech'
      };

      expect(validatePost(shortContent).isValid).toBe(false);
      expect(validatePost(validContent).isValid).toBe(true);
    });
  });

  describe('validateUser', () => {
    it('returns valid result for valid user data', () => {
      const validUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      };

      const result = validateUser(validUser);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns invalid result with errors for invalid user data', () => {
      const invalidUser = {
        username: 'u', // too short
        email: 'invalid-email', // invalid email
        password: 'password', // invalid password
      };

      const result = validateUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('username');
      expect(result.errors).toHaveProperty('email');
      expect(result.errors).toHaveProperty('password');
    });

    it('validates username constraints', () => {
      const shortUsername = { username: 'u', email: 'test@example.com', password: 'Password123' };
      const longUsername = {
        username: 'a'.repeat(31), // 31 characters
        email: 'test@example.com',
        password: 'Password123'
      };
      const invalidChars = { username: 'user@name', email: 'test@example.com', password: 'Password123' };

      expect(validateUser(shortUsername).isValid).toBe(false);
      expect(validateUser(longUsername).isValid).toBe(false);
      expect(validateUser(invalidChars).isValid).toBe(false);
    });

    it('validates email format', () => {
      const invalidEmails = [
        'invalid',
        'test@',
        '@example.com',
        'test.example.com',
        '',
      ];

      invalidEmails.forEach(email => {
        const user = { username: 'testuser', email, password: 'Password123' };
        expect(validateUser(user).isValid).toBe(false);
      });
    });

    it('validates password strength', () => {
      const weakPasswords = [
        'password', // no uppercase, no number
        'PASSWORD', // no lowercase, no number
        'Password', // no number
        '12345678', // no letters
        'Pass1', // too short
      ];

      weakPasswords.forEach(password => {
        const user = { username: 'testuser', email: 'test@example.com', password };
        expect(validateUser(user).isValid).toBe(false);
      });
    });
  });
});

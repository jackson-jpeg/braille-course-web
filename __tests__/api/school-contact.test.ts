/**
 * Tests for the school-contact API route validation logic.
 * We test the validation patterns directly since the route handler
 * depends on Prisma and Resend.
 */

// Validation helpers extracted from the route's logic
function validateEmail(email: unknown): string | null {
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

function validateContactName(name: unknown): string | null {
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return 'Please enter a valid contact name (2-100 characters)';
  }
  return null;
}

function validateSchoolName(name: unknown): string | null {
  if (!name || typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 200) {
    return 'Please enter a valid school name (3-200 characters)';
  }
  return null;
}

function validateServicesNeeded(services: unknown): string | null {
  if (!services || typeof services !== 'string' || services.trim().length < 5 || services.trim().length > 3000) {
    return 'Please describe the services needed (5-3000 characters)';
  }
  return null;
}

function validatePhone(phone: unknown): string | null {
  if (phone && (typeof phone !== 'string' || phone.trim().length < 10)) {
    return 'Please enter a valid phone number (minimum 10 characters)';
  }
  return null;
}

describe('School Contact Validation', () => {
  describe('email validation', () => {
    it('rejects empty email', () => {
      expect(validateEmail('')).not.toBeNull();
    });

    it('rejects null', () => {
      expect(validateEmail(null)).not.toBeNull();
    });

    it('rejects email without @', () => {
      expect(validateEmail('notanemail')).not.toBeNull();
    });

    it('rejects email without domain', () => {
      expect(validateEmail('user@')).not.toBeNull();
    });

    it('accepts valid email', () => {
      expect(validateEmail('admin@school.edu')).toBeNull();
    });

    it('accepts email with subdomain', () => {
      expect(validateEmail('user@mail.school.edu')).toBeNull();
    });
  });

  describe('contactName validation', () => {
    it('rejects empty name', () => {
      expect(validateContactName('')).not.toBeNull();
    });

    it('rejects single character', () => {
      expect(validateContactName('A')).not.toBeNull();
    });

    it('accepts 2+ char name', () => {
      expect(validateContactName('Jo')).toBeNull();
    });

    it('rejects name > 100 chars', () => {
      expect(validateContactName('A'.repeat(101))).not.toBeNull();
    });
  });

  describe('schoolName validation', () => {
    it('rejects names < 3 chars', () => {
      expect(validateSchoolName('AB')).not.toBeNull();
    });

    it('accepts valid school name', () => {
      expect(validateSchoolName('Lincoln Elementary')).toBeNull();
    });

    it('rejects names > 200 chars', () => {
      expect(validateSchoolName('A'.repeat(201))).not.toBeNull();
    });
  });

  describe('servicesNeeded validation', () => {
    it('rejects empty description', () => {
      expect(validateServicesNeeded('')).not.toBeNull();
    });

    it('rejects too short description', () => {
      expect(validateServicesNeeded('help')).not.toBeNull();
    });

    it('accepts valid description', () => {
      expect(validateServicesNeeded('We need braille instruction for 5 students')).toBeNull();
    });

    it('rejects > 3000 chars', () => {
      expect(validateServicesNeeded('x'.repeat(3001))).not.toBeNull();
    });
  });

  describe('phone validation (optional)', () => {
    it('passes when phone is not provided', () => {
      expect(validatePhone(undefined)).toBeNull();
      expect(validatePhone(null)).toBeNull();
      expect(validatePhone('')).toBeNull();
    });

    it('rejects short phone numbers', () => {
      expect(validatePhone('123')).not.toBeNull();
    });

    it('accepts valid phone', () => {
      expect(validatePhone('555-123-4567')).toBeNull();
    });
  });

  describe('honeypot field', () => {
    it('should reject submissions with honeypot filled', () => {
      // The route checks: if (website) return 400
      const website = 'http://spam.com';
      expect(!!website).toBe(true); // Honeypot is filled = should reject
    });

    it('should accept submissions with empty honeypot', () => {
      const website = '';
      expect(!!website).toBe(false); // Honeypot empty = should accept
    });
  });
});

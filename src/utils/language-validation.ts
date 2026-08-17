import languageCodes from './language-codes.json';

interface LanguageCodesMap {
  [key: string]: string;
}

interface ValidationResult {
  isValid: boolean;
  validCodes: string[];
  invalidCodes: string[];
  message?: string;
}

/**
 * The ISO 639-1 list is bundled rather than fetched. It never changes, and the
 * remote copy this used to read is rate-limited by its host — the same
 * dependency that made Content Alchemist reject every language-aware request.
 */
class LanguageValidator {
  private readonly languageCodes: LanguageCodesMap = languageCodes;

  private parseLanguageCodes(input: string): string[] {
    if (!input.trim()) {
      return [];
    }

    return input
      .split(',')
      .map(code => code.trim().toLowerCase())
      .filter(code => code.length > 0)
      .filter((code, index, array) => array.indexOf(code) === index); // Remove duplicates
  }

  private isValidLanguageCodeFormat(code: string): boolean {
    // Basic format validation: 2-3 character codes
    return /^[a-z]{2,3}$/.test(code);
  }

  async validateLanguageCodes(input: string): Promise<ValidationResult> {
    const codes = this.parseLanguageCodes(input);

    // If empty, it's valid (optional field)
    if (codes.length === 0) {
      return {
        isValid: true,
        validCodes: [],
        invalidCodes: []
      };
    }

    // Basic format validation first
    const formatInvalidCodes = codes.filter(code => !this.isValidLanguageCodeFormat(code));
    if (formatInvalidCodes.length > 0) {
      return {
        isValid: false,
        validCodes: codes.filter(code => this.isValidLanguageCodeFormat(code)),
        invalidCodes: formatInvalidCodes,
        message: `Invalid format for language codes: ${formatInvalidCodes.join(', ')}. Use 2-3 letter codes like 'en', 'uk', 'fr'.`
      };
    }

    const validCodes: string[] = [];
    const invalidCodes: string[] = [];

    codes.forEach(code => {
      if (this.languageCodes[code]) {
        validCodes.push(code);
      } else {
        invalidCodes.push(code);
      }
    });

    const isValid = invalidCodes.length === 0;

    return {
      isValid,
      validCodes,
      invalidCodes,
      message: isValid
        ? undefined
        : `Invalid language codes: ${invalidCodes.join(', ')}. Please use valid ISO 639-1 language codes.`
    };
  }

  // Get available language codes for suggestions (optional feature)
  async getAvailableLanguages(): Promise<LanguageCodesMap> {
    return this.languageCodes;
  }
}

// Export singleton instance
export const languageValidator = new LanguageValidator();

// Export types for use in components
export type { ValidationResult, LanguageCodesMap };

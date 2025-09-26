interface LanguageCodesMap {
  [key: string]: string;
}

interface ValidationResult {
  isValid: boolean;
  validCodes: string[];
  invalidCodes: string[];
  message?: string;
}

class LanguageValidator {
  private languageCodes: LanguageCodesMap | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private readonly API_URL = 'https://gist.githubusercontent.com/Josantonius/b455e315bc7f790d14b136d61d9ae469/raw/language-codes.json';

  private async fetchLanguageCodes(): Promise<LanguageCodesMap> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.languageCodes && now < this.cacheExpiry) {
      return this.languageCodes;
    }

    try {
      const response = await fetch(this.API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.languageCodes = data;
      this.cacheExpiry = now + this.CACHE_DURATION;
      
      return data;
    } catch (error) {
      console.error('Failed to fetch language codes:', error);
      
      // If we have cached data, use it even if expired
      if (this.languageCodes) {
        return this.languageCodes;
      }
      
      // Fallback to basic validation without API
      throw new Error('Unable to fetch language codes for validation');
    }
  }

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

    try {
      const languageCodes = await this.fetchLanguageCodes();
      const validCodes: string[] = [];
      const invalidCodes: string[] = [];

      codes.forEach(code => {
        if (languageCodes[code]) {
          validCodes.push(code);
        } else {
          invalidCodes.push(code);
        }
      });

      const isValid = invalidCodes.length === 0;
      let message: string | undefined;

      if (!isValid) {
        message = `Invalid language codes: ${invalidCodes.join(', ')}. Please use valid ISO 639-1 language codes.`;
      }

      return {
        isValid,
        validCodes,
        invalidCodes,
        message
      };
    } catch (error) {
      // Fallback to basic format validation if API fails
      console.warn('Language validation API unavailable, using basic validation:', error);
      
      return {
        isValid: true,
        validCodes: codes,
        invalidCodes: [],
        message: 'Language codes validation unavailable. Basic format validation passed.'
      };
    }
  }

  // Get available language codes for suggestions (optional feature)
  async getAvailableLanguages(): Promise<LanguageCodesMap | null> {
    try {
      return await this.fetchLanguageCodes();
    } catch (error) {
      console.error('Failed to get available languages:', error);
      return null;
    }
  }
}

// Export singleton instance
export const languageValidator = new LanguageValidator();

// Export types for use in components
export type { ValidationResult, LanguageCodesMap };
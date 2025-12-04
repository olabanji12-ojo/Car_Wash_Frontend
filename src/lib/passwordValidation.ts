/**
 * Password Validation Utility
 * Enforces strong password requirements for security
 */

export interface PasswordValidation {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
}

export const validatePassword = (password: string): PasswordValidation => {
    const errors: string[] = [];

    // Minimum length check
    if (password.length < 8) {
        errors.push('At least 8 characters');
    }

    // Uppercase letter check
    if (!/[A-Z]/.test(password)) {
        errors.push('One uppercase letter');
    }

    // Lowercase letter check
    if (!/[a-z]/.test(password)) {
        errors.push('One lowercase letter');
    }

    // Number check
    if (!/[0-9]/.test(password)) {
        errors.push('One number');
    }

    // Special character check (optional but recommended)
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('One special character (!@#$%^&*)');
    }

    // Calculate strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (errors.length === 0) {
        strength = 'strong';
    } else if (errors.length <= 2) {
        strength = 'medium';
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength
    };
};

/**
 * Get password strength color for UI
 */
export const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
        case 'weak':
            return 'text-red-500';
        case 'medium':
            return 'text-yellow-500';
        case 'strong':
            return 'text-green-500';
        default:
            return 'text-gray-500';
    }
};

/**
 * Get password strength background color for progress bar
 */
export const getPasswordStrengthBg = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
        case 'weak':
            return 'bg-red-500';
        case 'medium':
            return 'bg-yellow-500';
        case 'strong':
            return 'bg-green-500';
        default:
            return 'bg-gray-300';
    }
};

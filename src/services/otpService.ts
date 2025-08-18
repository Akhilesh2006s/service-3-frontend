// Note: This service is for reference only
// The actual OTP functionality is handled by the backend server
// Frontend should use APIService to interact with the backend

interface OTPData {
  phone: string;
  otp: string;
  expiresAt: Date;
}

// In-memory storage (replace with Redis/Database in production)
const otpStorage = new Map<string, OTPData>();

export class OTPService {
  // Generate 6-digit OTP
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via SMS - This is a mock implementation
  // In a real app, this would be handled by the backend
  static async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in memory (for demonstration only)
      otpStorage.set(phone, {
        phone,
        otp,
        expiresAt
      });

      console.log(`Mock SMS OTP for ${phone}: ${otp}`);
      
      return {
        success: true,
        message: 'OTP sent successfully (mock)'
      };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        message: 'Failed to send OTP'
      };
    }
  }

  // Verify OTP
  static verifyOTP(phone: string, otp: string): { success: boolean; message: string } {
    const storedData = otpStorage.get(phone);
    
    if (!storedData) {
      return {
        success: false,
        message: 'OTP not found'
      };
    }

    if (new Date() > storedData.expiresAt) {
      otpStorage.delete(phone);
      return {
        success: false,
        message: 'OTP expired'
      };
    }

    if (storedData.otp !== otp) {
      return {
        success: false,
        message: 'Invalid OTP'
      };
    }

    // Clear OTP after successful verification
    otpStorage.delete(phone);
    
    return {
      success: true,
      message: 'OTP verified successfully'
    };
  }

  // Send email OTP - This is a mock implementation
  // In a real app, this would be handled by the backend
  static async sendEmailOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in memory (for demonstration only)
      otpStorage.set(email, {
        phone: email, // Using phone field for email
        otp,
        expiresAt
      });

      // Log the OTP for demonstration purposes
      console.log(`Mock Email OTP for ${email}: ${otp}`);
      
      return {
        success: true,
        message: 'Email OTP sent successfully (mock)'
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        message: 'Failed to send email OTP'
      };
    }
  }
}
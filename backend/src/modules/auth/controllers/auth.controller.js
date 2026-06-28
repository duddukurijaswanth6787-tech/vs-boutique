const authService = require('../services/auth.service');

class AuthController {
  login = async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      return res.json(result);
    } catch (error) {
      console.error('Login Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  resetPassword = async (req, res) => {
    try {
      const { password } = req.body;
      const { token } = req.params;
      const result = await authService.resetPassword(token, password);
      return res.json(result);
    } catch (error) {
      console.error('Reset Password Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  sendOtp = async (req, res) => {
    try {
      const { phone } = req.body;
      const result = await authService.sendOtp(phone);
      return res.json(result);
    } catch (error) {
      console.error('Send OTP Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  verifyOtp = async (req, res) => {
    try {
      const { phone, otp } = req.body;
      const result = await authService.verifyOtp(phone, otp);
      return res.json(result);
    } catch (error) {
      console.error('Verify OTP Error:', error);
      const status = error.status || 500;
      if (error.responseData) {
        return res.status(status).json(error.responseData);
      }
      const message = error.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  getDevOtpMetadata = async (req, res) => {
    try {
      const { phone } = req.params;
      const result = await authService.getDevOtpMetadata(phone);
      return res.json(result);
    } catch (error) {
      console.error('Get Dev OTP Metadata Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  setPassword = async (req, res) => {
    try {
      const { token, password } = req.body;
      const result = await authService.setPassword(token, password);
      return res.json(result);
    } catch (error) {
      console.error('Set Password Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };
}

module.exports = new AuthController();

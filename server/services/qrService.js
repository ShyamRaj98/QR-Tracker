const QRCodeLib = require('qrcode');

/**
 * Generate a QR code as a base64 data URL pointing to the redirect URL
 */
const generateQRDataURL = async (shortUrl, style = {}) => {
  const options = {
    errorCorrectionLevel: style.errorCorrectionLevel || 'M',
    margin: style.margin ?? 4,
    width: 400,
    color: {
      dark: style.foregroundColor || '#000000',
      light: style.backgroundColor || '#ffffff',
    },
  };
  return QRCodeLib.toDataURL(shortUrl, options);
};

/**
 * Generate QR as SVG string
 */
const generateQRSVG = async (shortUrl, style = {}) => {
  const options = {
    errorCorrectionLevel: style.errorCorrectionLevel || 'M',
    margin: style.margin ?? 4,
    color: {
      dark: style.foregroundColor || '#000000',
      light: style.backgroundColor || '#ffffff',
    },
  };
  return QRCodeLib.toString(shortUrl, { ...options, type: 'svg' });
};

module.exports = { generateQRDataURL, generateQRSVG };

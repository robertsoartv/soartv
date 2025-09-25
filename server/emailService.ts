import { MailService } from '@sendgrid/mail';

// Initialize SendGrid
const sgMail = new MailService();

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailVerificationParams {
  to: string;
  userName: string;
  verificationLink: string;
}

// SoarTV-branded email template inspired by Tubi's design
const createSoarTVEmailTemplate = (userName: string, verificationLink: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SoarTV - Verify Your Email</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: white;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            min-height: 100vh;
            padding: 20px 0;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            padding: 60px 40px;
            text-align: center;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        
        .logo {
            font-size: 48px;
            font-weight: bold;
            color: #00d9ff;
            margin-bottom: 40px;
            text-shadow: 0 0 20px rgba(0, 217, 255, 0.5);
            letter-spacing: -1px;
        }
        
        .tagline {
            font-size: 20px;
            color: #a0a0a0;
            margin-bottom: 20px;
            font-weight: 300;
        }
        
        .main-title {
            font-size: 48px;
            font-weight: 800;
            color: white;
            margin-bottom: 30px;
            line-height: 1.1;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        
        .greeting {
            font-size: 24px;
            color: #00d9ff;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .message {
            font-size: 18px;
            color: #e0e0e0;
            margin-bottom: 40px;
            line-height: 1.5;
        }
        
        .verify-button {
            display: inline-block;
            background: linear-gradient(45deg, #00d9ff, #0099cc);
            color: #000;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 40px;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(0, 217, 255, 0.3);
        }
        
        .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(0, 217, 255, 0.4);
        }
        
        .support-text {
            font-size: 16px;
            color: #b0b0b0;
            margin-bottom: 30px;
        }
        
        .support-link {
            color: #00d9ff;
            text-decoration: underline;
        }
        
        .terms-text {
            font-size: 14px;
            color: #888;
            margin-bottom: 40px;
            line-height: 1.4;
        }
        
        .terms-link {
            color: #00d9ff;
            text-decoration: underline;
        }
        
        .social-section {
            margin-bottom: 40px;
        }
        
        .social-title {
            font-size: 24px;
            color: white;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .social-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .social-icon {
            width: 50px;
            height: 50px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: white;
            font-size: 24px;
            transition: all 0.3s ease;
        }
        
        .social-icon:hover {
            background: rgba(0, 217, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .footer {
            font-size: 14px;
            color: #777;
            line-height: 1.4;
        }
        
        .footer-highlight {
            color: #00d9ff;
            font-weight: 600;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 40px 20px;
            }
            
            .main-title {
                font-size: 36px;
            }
            
            .logo {
                font-size: 36px;
            }
            
            .social-links {
                flex-wrap: wrap;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">SoarTV</div>
        
        <div class="tagline">You're only one step away</div>
        
        <h1 class="main-title">Verify Your<br>Email Address</h1>
        
        <div class="greeting">Hi ${userName}!</div>
        
        <div class="message">
            Thank you for creating a SoarTV account!<br>
            To complete registration, please verify your email below.
        </div>
        
        <a href="${verificationLink}" class="verify-button">Verify Your Email</a>
        
        <div class="support-text">
            If you experience any issues, please <a href="mailto:support@soartv.com" class="support-link">contact support</a>.
        </div>
        
        <div class="terms-text">
            By registering, you agree to SoarTV's <a href="#" class="terms-link">terms of service</a> and <a href="#" class="terms-link">privacy policy</a>.
        </div>
        
        <div class="social-section">
            <div class="social-title">Let's be social</div>
            <div class="social-links">
                <a href="#" class="social-icon">📱</a>
                <a href="#" class="social-icon">📸</a>
                <a href="#" class="social-icon">🐦</a>
                <a href="#" class="social-icon">📘</a>
            </div>
        </div>
        
        <div class="footer">
            You're receiving this email because you're a valued member of<br>
            the <span class="footer-highlight">SoarTV Community</span>. If you did not enter this email address when<br>
            signing up for SoarTV, please disregard this message.<br><br>
            
            <strong>Sent from SoarTV Inc.</strong><br>
            Streaming Platform • Worldwide<br>
            Copyright 2025. All Rights Reserved.
        </div>
    </div>
</body>
</html>
  `;
};

export async function sendVerificationEmail({ to, userName, verificationLink }: EmailVerificationParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY not configured. Using fallback email verification.');
    return false;
  }

  try {
    const htmlTemplate = createSoarTVEmailTemplate(userName, verificationLink);
    
    const msg = {
      to,
      from: {
        email: 'noreply@soartv.com',
        name: 'SoarTV Team'
      },
      subject: 'Welcome to SoarTV - Verify Your Email 🎬',
      html: htmlTemplate,
      text: `Hi ${userName}! Welcome to SoarTV! Please verify your email by clicking this link: ${verificationLink}`,
    };

    await sgMail.send(msg);
    console.log('✅ Custom SoarTV verification email sent to:', to);
    return true;
  } catch (error) {
    console.error('❌ SendGrid email error:', error);
    return false;
  }
}

export default { sendVerificationEmail };
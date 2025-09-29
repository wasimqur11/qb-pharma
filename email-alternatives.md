# Email Service Alternatives for QB Pharma

## Recommended Solutions (No firewall issues)

### 1. SendGrid (Most Popular)
- **Free tier**: 100 emails/day
- **Pricing**: $19.95/month for 50,000 emails
- **Setup**: Easy API integration
- **Benefits**: Reliable delivery, analytics

### 2. Mailgun
- **Free tier**: 5,000 emails/month for 3 months
- **Pricing**: $35/month for 50,000 emails
- **Benefits**: Powerful API, good for transactional emails

### 3. Amazon SES
- **Pricing**: $0.10 per 1,000 emails
- **Benefits**: Very cheap, reliable, integrates with AWS

### 4. SMTP2GO
- **Free tier**: 1,000 emails/month
- **Pricing**: $10/month for 10,000 emails
- **Benefits**: Simple setup, good deliverability

## Quick Setup Instructions

### For SendGrid:
1. Sign up at sendgrid.com
2. Get API key
3. Update QB Pharma config:
   - SMTP Host: smtp.sendgrid.net
   - Port: 587
   - Username: apikey
   - Password: [your-api-key]

### For Mailgun:
1. Sign up at mailgun.com
2. Verify domain
3. Get SMTP credentials
4. Update QB Pharma config accordingly
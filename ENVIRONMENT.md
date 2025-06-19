# Environment Configuration Guide

This document provides comprehensive guidance on setting up environment variables for the ChatGPT
Clone application.

## 🚀 Quick Start

1. **Copy the example file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual values** in `.env.local`

3. **Never commit `.env.local`** to version control (it's already in `.gitignore`)

## 📋 Required Environment Variables

### 🔐 Clerk Authentication

**Required for user authentication and management**

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**How to obtain:**

1. Sign up at [https://clerk.com/](https://clerk.com/)
2. Create a new application
3. Go to **Dashboard > API Keys**
4. Copy both the Publishable Key and Secret Key

**Security Notes:**

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is safe for client-side use
- `CLERK_SECRET_KEY` must be kept secure and only used server-side

### 🗄️ Database Configuration

**Required for storing chat conversations and user data**

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatgpt-clone
```

**How to obtain:**

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier available)
2. Create a new cluster
3. Go to **Database > Connect > Connect your application**
4. Copy the connection string and replace `<password>` with your actual password

**Alternative (Local Development):**

```bash
MONGODB_URI=mongodb://localhost:27017/chatgpt-clone
```

### 🤖 OpenAI API

**Required for GPT model access**

```bash
OPENAI_API_KEY=sk-...
```

**How to obtain:**

1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Add a payment method (required for API access)
3. Go to [API Keys](https://platform.openai.com/api-keys)
4. Create a new secret key

**Important:**

- Always starts with `sk-`
- This provides access to paid API services - keep it secure!
- Monitor your usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)

## 📁 File Storage Providers

**At least one storage provider is required for file uploads**

### ☁️ Cloudinary (Recommended)

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to obtain:**

1. Sign up at [Cloudinary](https://cloudinary.com/) (free tier available)
2. Go to your **Dashboard**
3. Find your Cloud name, API Key, and API Secret

**Features:**

- Advanced image/video processing
- CDN delivery
- Automatic optimization
- Free tier: 25GB storage, 25GB bandwidth

### 📤 Uploadcare (Alternative)

```bash
UPLOADCARE_PUBLIC_KEY=xxxxxxxxxxxxxxxx
UPLOADCARE_SECRET_KEY=xxxxxxxxxxxxxxxx
```

**How to obtain:**

1. Sign up at [Uploadcare](https://uploadcare.com/)
2. Go to **Dashboard > Settings > API keys**
3. Copy your Public Key and Secret Key

**Features:**

- Simple file uploading
- Built-in file processing
- CDN delivery
- Free tier: 3GB storage, 3GB traffic

## ⚙️ Application Configuration

### Required Variables

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional Variables

```bash
# Storage Configuration
DEFAULT_STORAGE_PROVIDER=cloudinary
ENABLE_FILE_UPLOADS=true
MAX_FILE_SIZE=10485760

# Development Settings
DEBUG_MODE=true
DISABLE_AUTH_IN_DEV=false
MOCK_EXTERNAL_APIS=false

# Build Settings
BUILD_STANDALONE=false
ANALYZE=false
```

## 🔒 Security Best Practices

### ✅ Do's

- **Use strong, unique passwords** for all services
- **Enable 2FA** on all accounts (Clerk, MongoDB, OpenAI, etc.)
- **Regularly rotate API keys** (especially in production)
- **Use environment-specific keys** (separate keys for dev/staging/prod)
- **Monitor API usage** to detect unusual activity
- **Use HTTPS** in production for all API endpoints
- **Restrict API key permissions** where possible

### ❌ Don'ts

- **Never commit** `.env.local` or any file containing secrets
- **Never share** API keys in chat, email, or documentation
- **Don't use** production keys in development
- **Don't hardcode** secrets in your source code
- **Don't expose** secret keys in client-side code
- **Don't ignore** security warnings from services

### 🛡️ Additional Security Measures

1. **IP Restrictions:** Configure IP allowlists where supported
2. **Rate Limiting:** Implement proper rate limiting in your application
3. **Monitoring:** Set up alerts for unusual API usage patterns
4. **Backup:** Regularly backup your database
5. **Updates:** Keep all dependencies updated

## 🌍 Environment-Specific Considerations

### Development Environment

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEBUG_MODE=true
```

**Characteristics:**

- Uses development/test API keys
- Enhanced logging and debugging
- Hot reloading enabled
- Authentication can be bypassed for testing (if configured)

### Staging Environment

```bash
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
DEBUG_MODE=false
```

**Characteristics:**

- Production-like environment for testing
- Separate database from production
- Limited API quotas
- Real authentication required

### Production Environment

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
DEBUG_MODE=false
DISABLE_AUTH_IN_DEV=false
MOCK_EXTERNAL_APIS=false
```

**Characteristics:**

- Maximum security settings
- Performance optimizations enabled
- Comprehensive logging and monitoring
- All features fully functional

## 🔧 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

**Symptoms:** App crashes with "Environment variable X is required"

**Solutions:**

- Ensure `.env.local` exists in the project root
- Check variable names match exactly (case-sensitive)
- Restart the development server after changes
- Verify no extra spaces around the `=` sign

#### 2. Invalid API Keys

**Symptoms:** Authentication or API errors

**Solutions:**

- Double-check keys are copied correctly (no extra characters)
- Ensure keys haven't expired
- Verify account has proper permissions/billing setup
- Check if IP restrictions are blocking your requests

#### 3. Database Connection Issues

**Symptoms:** MongoDB connection errors

**Solutions:**

- Verify MongoDB cluster is running
- Check database user permissions
- Ensure IP address is whitelisted (MongoDB Atlas)
- Test connection string format

#### 4. File Upload Issues

**Symptoms:** File uploads fail or return errors

**Solutions:**

- Verify at least one storage provider is configured
- Check API keys and permissions
- Ensure file size is within limits
- Verify storage account has sufficient quota

### Debug Commands

```bash
# Test environment validation
npm run dev  # Will show environment summary in console

# Check specific environment variables
echo $NEXT_PUBLIC_APP_URL
```

### Getting Help

1. **Check the logs** - Environment validation errors are detailed
2. **Review .env.example** - Ensure all required variables are set
3. **Test individual services** - Verify each API key works independently
4. **Check service status** - Ensure third-party services are operational

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Clerk Documentation](https://clerk.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Uploadcare Documentation](https://uploadcare.com/docs/)

## 🔄 Environment Validation

The application includes automatic environment validation that:

- **Validates all required variables** on startup
- **Provides clear error messages** for missing/invalid values
- **Checks configuration consistency** (e.g., storage providers)
- **Warns about development-specific settings** in production
- **Logs configuration summary** in development mode

This ensures your application fails fast with clear error messages rather than mysterious runtime
errors.

---

**Remember:** Keep your environment variables secure and never commit them to version control!

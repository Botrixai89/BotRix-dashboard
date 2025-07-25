# Cloudinary Setup Guide for Botrix

This guide will help you set up Cloudinary for image uploads in your Botrix application.

## 🚀 Step 1: Create Cloudinary Account

1. **Visit [cloudinary.com](https://cloudinary.com)**
2. **Click "Sign Up For Free"**
3. **Fill in your details:**
   - Email address
   - Password
   - Account name (this becomes your cloud name)
4. **Verify your email address**

## 🔑 Step 2: Get Your Credentials

After signing up and logging in, you'll need these credentials:

### Cloud Name
- **Location**: Top-right corner of your dashboard
- **Example**: `mycompany123`
- **What it is**: Your unique account identifier

### API Key & Secret
1. **Go to Settings** → **Access Keys**
2. **Copy your API Key**
3. **Copy your API Secret**
4. **Keep these secure** - they're like passwords

### Upload Preset
1. **Go to Settings** → **Upload**
2. **Scroll to "Upload presets"**
3. **Click "Add upload preset"**
4. **Configure the preset:**
   - **Name**: `botrix_uploads`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `botrix-logos` (optional)
   - **Transformation**: `f_auto,q_auto` (auto format & quality)
5. **Click "Save"**

## ⚙️ Step 3: Environment Variables

### Local Development (.env.local)
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_UPLOAD_PRESET=botrix_uploads
```

### Vercel Production
1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Settings** → **Environment Variables**
4. **Add these variables:**
   - `CLOUDINARY_CLOUD_NAME` = `your_cloud_name`
   - `CLOUDINARY_API_KEY` = `your_api_key`
   - `CLOUDINARY_API_SECRET` = `your_api_secret`
   - `CLOUDINARY_UPLOAD_PRESET` = `botrix_uploads`

## 🧪 Step 4: Test the Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Go to your create bot page**
3. **Try uploading a logo**
4. **Check the console for upload logs**

## 📊 Step 5: Monitor Usage

### Cloudinary Dashboard
- **Go to [cloudinary.com/console](https://cloudinary.com/console)**
- **Check your usage statistics**
- **View uploaded images in Media Library**

### Free Tier Limits
- **25 GB storage**
- **25 GB bandwidth per month**
- **25,000 transformations per month**

## 🔧 Troubleshooting

### Common Issues

#### "Upload preset not found"
- **Solution**: Make sure the upload preset name matches exactly
- **Check**: Settings → Upload → Upload presets

#### "Invalid API key"
- **Solution**: Verify your API key and secret
- **Check**: Settings → Access Keys

#### "Cloud name not found"
- **Solution**: Verify your cloud name
- **Check**: Top-right corner of dashboard

### Debug Mode
Add this to your `.env.local` for detailed logs:
```env
DEBUG_CLOUDINARY=true
```

## 🎯 Benefits You'll Get

✅ **Automatic image optimization**  
✅ **Global CDN for fast loading**  
✅ **Multiple image formats** (WebP, AVIF)  
✅ **Automatic resizing**  
✅ **Better performance** than base64 storage  
✅ **Professional image handling**  

## 💰 Pricing

### Free Tier (Perfect for starting)
- **25 GB storage**
- **25 GB bandwidth/month**
- **25,000 transformations/month**
- **No credit card required**

### Paid Plans (When you scale)
- **Pay-as-you-go**: $0.04 per GB storage
- **Bandwidth**: $0.04 per GB
- **Transformations**: $0.04 per 1,000

## 🔄 Fallback Strategy

If Cloudinary is not configured:
- ✅ **Development**: Files saved locally
- ✅ **Production**: Images converted to base64 (stored in MongoDB)
- ✅ **No downtime**: Always works

## 📞 Support

- **Cloudinary Docs**: [cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Cloudinary Support**: [support.cloudinary.com](https://support.cloudinary.com)
- **Botrix Issues**: Create an issue in this repository

---

**Need help?** The setup should take about 5-10 minutes. If you get stuck, check the troubleshooting section above! 
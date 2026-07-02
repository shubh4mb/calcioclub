const mongoose = require('mongoose');
const fs = require('fs');
const { cloudinary, isConfigured } = require('./cloudinary');
const Jersey = require('../models/Jersey');

const seedData = [
  {
    name: "Real Madrid 2023/24 Home Jersey",
    description: "The classic white kit with gold details. Climachill technology, slim fit, and premium embroidery.",
    price: 89.99,
    localPath: "C:/Users/leno2/.gemini/antigravity/brain/52bab4b2-6711-447a-945e-a11fd09a97b9/real_madrid_jersey_1781178381250.png",
    fallbackImage: "https://images.unsplash.com/photo-1628253747716-0c4f5c99f7a9?q=80&w=600&auto=format&fit=crop",
    category: "Club",
    sizes: ["S", "M", "L", "XL"],
    inStock: true
  },
  {
    name: "Argentina 2022 Champions Jersey",
    description: "Official three-star jersey commemorating the historic World Cup victory. Breathable fabric and gold champion's badge.",
    price: 99.99,
    localPath: "C:/Users/leno2/.gemini/antigravity/brain/52bab4b2-6711-447a-945e-a11fd09a97b9/argentina_jersey_1781178396956.png",
    fallbackImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
    category: "National",
    sizes: ["S", "M", "L", "XL"],
    inStock: true
  },
  {
    name: "AC Milan 1996 Retro Jersey",
    description: "Iconic red and black stripes, classic collar. Premium vintage feel and heavy knit polyester.",
    price: 119.99,
    localPath: "C:/Users/leno2/.gemini/antigravity/brain/52bab4b2-6711-447a-945e-a11fd09a97b9/ac_milan_jersey_1781178412033.png",
    fallbackImage: "https://images.unsplash.com/photo-1614632537190-23e414d40940?q=80&w=600&auto=format&fit=crop",
    category: "Retro",
    sizes: ["M", "L", "XL"],
    inStock: true
  },
  {
    name: "Japan 2022 Special Edition",
    description: "Stunning blue origami-inspired design, custom commemorative graphics, and light performance build.",
    price: 109.99,
    localPath: "C:/Users/leno2/.gemini/antigravity/brain/52bab4b2-6711-447a-945e-a11fd09a97b9/japan_jersey_1781178426140.png",
    fallbackImage: "https://images.unsplash.com/photo-1579952362874-86d44744f951?q=80&w=600&auto=format&fit=crop",
    category: "Special",
    sizes: ["S", "M", "L"],
    inStock: true
  }
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/calcioclub');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Check if we have successfully seeded Cloudinary images
    const hasCloudinaryImages = await Jersey.findOne({ image: /cloudinary/ });
    if (!hasCloudinaryImages) {
      console.log('No Cloudinary images found in database. Deleting old records and seeding new premium items...');
      await Jersey.deleteMany({});
      
      const preparedJerseys = [];
      for (const item of seedData) {
        let imageUrl = item.fallbackImage;
        if (isConfigured && fs.existsSync(item.localPath)) {
          try {
            console.log(`Uploading ${item.name} image to Cloudinary...`);
            const uploadResult = await cloudinary.uploader.upload(item.localPath, {
              folder: 'calcioclub_jerseys'
            });
            imageUrl = uploadResult.secure_url;
            console.log(`Uploaded successfully: ${imageUrl}`);
          } catch (uploadErr) {
            console.error(`Failed to upload ${item.name} to Cloudinary:`, uploadErr.message);
          }
        } else {
          console.warn(`Using fallback image for ${item.name}. (Cloudinary Configured: ${isConfigured}, File Exists: ${fs.existsSync(item.localPath)})`);
        }
        
        preparedJerseys.push({
          name: item.name,
          description: item.description,
          price: item.price,
          image: imageUrl,
          category: item.category,
          sizes: item.sizes,
          inStock: item.inStock
        });
      }
      
      await Jersey.insertMany(preparedJerseys);
      console.log('Successfully seeded database with premium Cloudinary jerseys!');
    }
  } catch (error) {
    console.warn(`DATABASE CONNECTION WARNING: ${error.message}`);
    console.warn('Backend will run in temporary local in-memory fallback database mode.');
  }
};

module.exports = connectDB;

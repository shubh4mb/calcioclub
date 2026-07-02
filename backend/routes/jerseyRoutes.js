const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const Jersey = require('../models/Jersey');
const protect = require('../middleware/auth');
const { cloudinary, isConfigured } = require('../config/cloudinary');

// Setup multer in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const uploadFields = upload.fields([
  { name: 'imageFile', maxCount: 1 },
  { name: 'imageFiles', maxCount: 5 }
]);

// Mock In-Memory Jersey Database for offline/unconnected mode
let mockJerseys = [
  {
    _id: "mock1",
    name: "Real Madrid 2023/24 Home Jersey",
    description: "The classic white kit with gold details. Climachill technology, slim fit.",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?q=80&w=600&auto=format&fit=crop",
    category: "Club",
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    _id: "mock2",
    name: "Argentina 2022 Champions Jersey",
    description: "Official three-star jersey commemorating the historic World Cup victory.",
    price: 99.99,
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
    category: "National",
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  },
  {
    _id: "mock3",
    name: "AC Milan 1996 Retro Jersey",
    description: "Iconic red and black stripes, classic collar. Premium vintage feel.",
    price: 119.99,
    image: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?q=80&w=600&auto=format&fit=crop",
    category: "Retro",
    sizes: ["M", "L", "XL"],
    inStock: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    _id: "mock4",
    name: "Japan 2022 Special Edition",
    description: "Stunning blue origami-inspired design, custom commemorative graphics.",
    price: 109.99,
    image: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=600&auto=format&fit=crop",
    category: "Special",
    sizes: ["S", "M", "L"],
    inStock: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  }
];

// Helper function to stream multer buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'calcioclub_jerseys',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Helper to upload multiple files to Cloudinary
const uploadMultipleToCloudinary = async (files) => {
  if (!files || files.length === 0) return [];
  const uploadPromises = files.map(file => uploadToCloudinary(file.buffer));
  const results = await Promise.all(uploadPromises);
  return results.map(r => r.secure_url);
};

// @desc    Get all jerseys (optional category filter)
// @route   GET /api/jerseys
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    // Check if database is connected, else use mock fallback
    if (mongoose.connection.readyState !== 1) {
      let filtered = [...mockJerseys];
      if (category) {
        filtered = filtered.filter(j => j.category.toLowerCase() === category.toLowerCase());
      }
      return res.json(filtered);
    }

    const filter = {};
    if (category) {
      filter.category = new RegExp(`^${category}$`, 'i');
    }
    const jerseys = await Jersey.find(filter).sort({ createdAt: -1 });
    res.json(jerseys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single jersey details
// @route   GET /api/jerseys/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // Check if database is connected, else use mock fallback
    if (mongoose.connection.readyState !== 1) {
      const jersey = mockJerseys.find(j => j._id === req.params.id);
      if (!jersey) {
        return res.status(404).json({ message: 'Jersey not found' });
      }
      return res.json(jersey);
    }

    const jersey = await Jersey.findById(req.params.id);
    if (!jersey) {
      return res.status(404).json({ message: 'Jersey not found' });
    }
    res.json(jersey);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new jersey
// @route   POST /api/jerseys
// @access  Admin Private
router.post('/', protect, uploadFields, async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    
    // Parse sizes
    let sizes = req.body.sizes;
    if (sizes) {
      if (typeof sizes === 'string') {
        try {
          sizes = JSON.parse(sizes);
        } catch (e) {
          sizes = sizes.split(',').map(s => s.trim());
        }
      }
    } else {
      sizes = ['S', 'M', 'L', 'XL'];
    }

    let imageUrl = req.body.imageUrl || '';
    let additionalImages = [];

    // Parse additional imageUrls if sent as string/array
    if (req.body.imageUrls) {
      if (typeof req.body.imageUrls === 'string') {
        try {
          additionalImages = JSON.parse(req.body.imageUrls);
        } catch (e) {
          additionalImages = req.body.imageUrls.split(',').map(u => u.trim()).filter(Boolean);
        }
      } else if (Array.isArray(req.body.imageUrls)) {
        additionalImages = req.body.imageUrls;
      }
    }

    // Handle image file upload (cover)
    if (req.files && req.files['imageFile'] && req.files['imageFile'][0]) {
      const coverFile = req.files['imageFile'][0];
      if (isConfigured) {
        try {
          const cloudinaryResult = await uploadToCloudinary(coverFile.buffer);
          imageUrl = cloudinaryResult.secure_url;
        } catch (cloudinaryErr) {
          console.error('Cloudinary upload error:', cloudinaryErr);
          return res.status(500).json({ message: 'Cloudinary upload failed' });
        }
      } else {
        imageUrl = 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?q=80&w=600&auto=format&fit=crop';
      }
    }

    // Handle multiple additional files upload
    if (req.files && req.files['imageFiles'] && req.files['imageFiles'].length > 0) {
      if (isConfigured) {
        try {
          const uploadedUrls = await uploadMultipleToCloudinary(req.files['imageFiles']);
          additionalImages = [...additionalImages, ...uploadedUrls];
        } catch (err) {
          console.error('Cloudinary multiple upload error:', err);
          return res.status(500).json({ message: 'Cloudinary additional images upload failed' });
        }
      } else {
        const mockUrls = req.files['imageFiles'].map((_, idx) => `https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?q=80&w=600&auto=format&fit=crop&sig=${idx}`);
        additionalImages = [...additionalImages, ...mockUrls];
      }
    }

    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?q=80&w=600&auto=format&fit=crop';
    }

    // Check if database is connected, else use mock fallback
    if (mongoose.connection.readyState !== 1) {
      const newJersey = {
        _id: 'mock_' + Date.now(),
        name,
        description,
        price: Number(price),
        category,
        sizes,
        image: imageUrl,
        images: additionalImages,
        inStock: req.body.inStock !== 'false' && req.body.inStock !== false,
        createdAt: new Date().toISOString()
      };
      mockJerseys.unshift(newJersey);
      return res.status(201).json(newJersey);
    }

    const jersey = new Jersey({
      name,
      description,
      price: Number(price),
      category,
      sizes,
      image: imageUrl,
      images: additionalImages,
      inStock: req.body.inStock !== 'false'
    });

    const savedJersey = await jersey.save();
    res.status(201).json(savedJersey);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a jersey
// @route   PUT /api/jerseys/:id
// @access  Admin Private
router.put('/:id', protect, uploadFields, async (req, res) => {
  try {
    const { name, description, price, category, inStock } = req.body;
    
    // Parse and update sizes
    let parsedSizes;
    if (req.body.sizes) {
      parsedSizes = req.body.sizes;
      if (typeof parsedSizes === 'string') {
        try {
          parsedSizes = JSON.parse(parsedSizes);
        } catch (e) {
          parsedSizes = parsedSizes.split(',').map(s => s.trim());
        }
      }
    }

    // Handle new image upload
    let imageUrl = req.body.imageUrl || '';
    if (req.files && req.files['imageFile'] && req.files['imageFile'][0]) {
      const coverFile = req.files['imageFile'][0];
      if (isConfigured) {
        try {
          const cloudinaryResult = await uploadToCloudinary(coverFile.buffer);
          imageUrl = cloudinaryResult.secure_url;
        } catch (cloudinaryErr) {
          console.error('Cloudinary upload error:', cloudinaryErr);
          return res.status(500).json({ message: 'Cloudinary upload failed' });
        }
      } else {
        imageUrl = 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?q=80&w=600&auto=format&fit=crop';
      }
    }

    // Parse and update additional images
    let additionalImages;
    if (req.body.imageUrls) {
      if (typeof req.body.imageUrls === 'string') {
        try {
          additionalImages = JSON.parse(req.body.imageUrls);
        } catch (e) {
          additionalImages = req.body.imageUrls.split(',').map(u => u.trim()).filter(Boolean);
        }
      } else if (Array.isArray(req.body.imageUrls)) {
        additionalImages = req.body.imageUrls;
      }
    }

    // Check database connection for fallback or Mongoose
    const dbConnected = mongoose.connection.readyState === 1;

    // Handle multiple additional files upload
    if (req.files && req.files['imageFiles'] && req.files['imageFiles'].length > 0) {
      let uploadedUrls = [];
      if (isConfigured) {
        try {
          uploadedUrls = await uploadMultipleToCloudinary(req.files['imageFiles']);
        } catch (err) {
          console.error('Cloudinary multiple upload error:', err);
          return res.status(500).json({ message: 'Cloudinary additional images upload failed' });
        }
      } else {
        uploadedUrls = req.files['imageFiles'].map((_, idx) => `https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?q=80&w=600&auto=format&fit=crop&sig=${Date.now()}_${idx}`);
      }
      
      const existingImages = additionalImages || (dbConnected ? [] : []);
      additionalImages = [...existingImages, ...uploadedUrls];
    }

    // Fallback Mock database update
    if (!dbConnected) {
      const index = mockJerseys.findIndex(j => j._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Jersey not found' });
      }

      const updated = {
        ...mockJerseys[index],
        name: name || mockJerseys[index].name,
        description: description !== undefined ? description : mockJerseys[index].description,
        price: price ? Number(price) : mockJerseys[index].price,
        category: category || mockJerseys[index].category,
        inStock: inStock !== undefined ? (inStock === 'true' || inStock === true) : mockJerseys[index].inStock,
        sizes: parsedSizes || mockJerseys[index].sizes,
        image: imageUrl || mockJerseys[index].image,
        images: additionalImages !== undefined ? additionalImages : mockJerseys[index].images || []
      };
      mockJerseys[index] = updated;
      return res.json(updated);
    }

    const jersey = await Jersey.findById(req.params.id);
    if (!jersey) {
      return res.status(404).json({ message: 'Jersey not found' });
    }

    if (name) jersey.name = name;
    if (description !== undefined) jersey.description = description;
    if (price) jersey.price = Number(price);
    if (category) jersey.category = category;
    if (inStock !== undefined) jersey.inStock = inStock === 'true' || inStock === true;
    if (parsedSizes) jersey.sizes = parsedSizes;
    if (imageUrl) jersey.image = imageUrl;
    if (additionalImages !== undefined) {
      jersey.images = additionalImages;
    }

    const updatedJersey = await jersey.save();
    res.json(updatedJersey);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a jersey
// @route   DELETE /api/jerseys/:id
// @access  Admin Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // Check if database is connected, else use mock fallback
    if (mongoose.connection.readyState !== 1) {
      const index = mockJerseys.findIndex(j => j._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Jersey not found' });
      }
      mockJerseys.splice(index, 1);
      return res.json({ message: 'Jersey removed successfully' });
    }

    const jersey = await Jersey.findById(req.params.id);
    if (!jersey) {
      return res.status(404).json({ message: 'Jersey not found' });
    }
    await jersey.deleteOne();
    res.json({ message: 'Jersey removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

import Product from "../models/product.model.js";
import Category from "../models/category.model.js";

// Helper to check admin role in user data
const isAdmin = (req) => {
    return req.user && (
        req.user.admin === true || 
        req.user.admin === 'true' ||
        req.user.role === 'admin' ||
        (req.user.roles && req.user.roles.includes('admin'))
    );
};

export const createProduct = async (req, res) => {
    try {
        // admin only
        if (!isAdmin(req)) return res.status(403).json({ error: "Admin privileges required" });

        const payload = req.body;
        // If category is provided as name, try to resolve to id
        if (payload.categoryName && !payload.category) {
          const slug = payload.categoryName.toLowerCase().replace(/\s+/g, '-');
          let category = await Category.findOne({ slug });
          if (!category) {
            category = new Category({ name: payload.categoryName, slug });
            await category.save();
          }
          payload.category = category._id;
        }

        const product = new Product(payload);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      fabricType,
      region,
      minPrice,
      maxPrice,
      searchTerm,
      sort,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (fabricType) filter.fabricType = fabricType;
    if (region) filter.region = region;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Text search
    let query = Product.find(filter);
    if (searchTerm) {
      // use text index if available
      query = Product.find({ $text: { $search: searchTerm }, ...filter });
    }

    // Sorting
    if (sort) {
      if (sort === 'price_asc') query = query.sort({ price: 1 });
      else if (sort === 'price_desc') query = query.sort({ price: -1 });
      else if (sort === 'newest') query = query.sort({ createdAt: -1 });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const productsPromise = query.skip(skip).limit(Number(limit)).populate('category').exec();
    const countPromise = Product.countDocuments(filter).exec();

    const [products, totalItems] = await Promise.all([productsPromise, countPromise]);
    const totalPages = Math.ceil(totalItems / Number(limit));

    res.json({ page: Number(page), limit: Number(limit), totalItems, totalPages, products });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category').exec();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


export const updateProduct = async (req, res) => {
    try {
        // admin only
        if (!isAdmin(req)) return res.status(403).json({ error: "Admin privileges required" });

        const payload = req.body;
        // handle categoryName -> category id if provided
        if (payload.categoryName && !payload.category) {
          const slug = payload.categoryName.toLowerCase().replace(/\s+/g, '-');
          let category = await Category.findOne({ slug });
          if (!category) {
            category = new Category({ name: payload.categoryName, slug });
            await category.save();
          }
          payload.category = category._id;
        }

        const product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true });
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        // admin only
        if (!isAdmin(req)) return res.status(403).json({ error: "Admin privileges required" });

        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.json({ message: "Product deleted" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).exec();
    res.json(categories);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const categoryId = req.params.id;
    const productsPromise = Product.find({ category: categoryId }).skip(skip).limit(Number(limit)).populate('category').exec();
    const countPromise = Product.countDocuments({ category: categoryId }).exec();
    const [products, totalItems] = await Promise.all([productsPromise, countPromise]);
    const totalPages = Math.ceil(totalItems / Number(limit));
    res.json({ page: Number(page), limit: Number(limit), totalItems, totalPages, products });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await Product.find({ featured: true }).limit(Number(limit)).populate('category').exec();
    res.json(products);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
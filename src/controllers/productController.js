const Product = require('../models/Product');
const { asArray } = require('../utils/formatters');

async function listProducts(req, res) {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    return res.status(200).json(asArray(products).map((product) => product.toClient()));
  } catch (error) {
    console.error('Products GET error:', error);
    return res.status(500).json({ message: 'Error fetching products', error: error.message, data: [] });
  }
}

async function createProduct(req, res) {
  try {
    const body = req.body || {};
    const name = body.name || body.title;
    if (!name || body.price === undefined || body.price === null || body.price === '') {
      return res.status(400).json({ message: 'Product name and price are required.' });
    }
    if (!Number.isFinite(Number(body.price)) || Number(body.price) < 0) {
      return res.status(400).json({ message: 'Product price must be a non-negative number.' });
    }

    const product = await Product.create({
      name,
      title: body.title || name,
      price: Number(body.price),
      image: body.image || body.image_url || 'https://placehold.co/600x600?text=Product',
      image_url: body.image_url || body.image || '',
      category: body.category || 'All',
      stock: Number(body.stock || 0),
      description: body.description || '',
      rating: Number(body.rating || 4.5),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      color: body.color || 'black',
      sizes: asArray(body.sizes).length ? body.sizes : ['S', 'M', 'L', 'XL'],
    });

    return res.status(201).json({ message: 'Product added successfully!', product: product.toClient() });
  } catch (error) {
    console.error('Product POST error:', error);
    return res.status(500).json({ message: 'Error saving product', error: error.message });
  }
}

async function updateProduct(req, res) {
  try {
    const body = req.body || {};
    const updates = {
      ...(body.name || body.title ? { name: body.name || body.title, title: body.title || body.name } : {}),
      ...(body.price !== undefined ? { price: Number(body.price) } : {}),
      ...(body.stock !== undefined ? { stock: Number(body.stock) } : {}),
      ...(body.category ? { category: body.category } : {}),
      ...(body.image || body.image_url
        ? { image: body.image || body.image_url, image_url: body.image_url || body.image }
        : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
    };

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    return res.json({ message: 'Product updated.', product: product.toClient() });
  } catch (error) {
    console.error('Product PUT error:', error);
    return res.status(500).json({ message: 'Error updating product', error: error.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    return res.json({ message: 'Product deleted.' });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
}

module.exports = { listProducts, createProduct, updateProduct, deleteProduct };

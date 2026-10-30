const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: 'https://placehold.co/600x600?text=Product' },
    image_url: { type: String },
    category: { type: String, default: 'All' },
    stock: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
    rating: { type: Number, default: 4.5 },
    originalPrice: { type: Number },
    color: { type: String, default: 'black' },
    sizes: { type: [String], default: ['S', 'M', 'L', 'XL'] },
  },
  { timestamps: true }
);

productSchema.methods.toClient = function toClient() {
  const name = this.name || this.title || 'Untitled';

  return {
    id: String(this._id),
    _id: String(this._id),
    name,
    title: this.title || name,
    price: this.price,
    image: this.image || this.image_url || 'https://placehold.co/600x600?text=Product',
    image_url: this.image_url || this.image || null,
    category: this.category || 'All',
    stock: this.stock ?? 0,
    description: this.description || '',
    rating: this.rating ?? 4.5,
    originalPrice: this.originalPrice,
    color: this.color || 'black',
    sizes: Array.isArray(this.sizes) && this.sizes.length ? this.sizes : ['S', 'M', 'L', 'XL'],
    created_at: this.createdAt,
  };
};

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);

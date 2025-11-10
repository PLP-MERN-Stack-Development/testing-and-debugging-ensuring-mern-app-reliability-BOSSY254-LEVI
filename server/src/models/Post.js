const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [10, 'Content must be at least 10 characters'],
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  featured: {
    type: Boolean,
    default: false,
  },
  meta: {
    description: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    keywords: [String],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ slug: 1 });
postSchema.index({ tags: 1 });

// Pre-save middleware to generate slug
postSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    // Generate slug from title
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }
  next();
});

// Virtual for reading time estimation
postSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const words = this.content.split(' ').length;
  return Math.ceil(words / wordsPerMinute);
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

// Static method to find published posts
postSchema.statics.findPublished = function() {
  return this.find({ status: 'published' }).populate('author', 'username').populate('category', 'name');
};

// Static method to find posts by category
postSchema.statics.findByCategory = function(categoryId) {
  return this.find({ category: categoryId, status: 'published' })
    .populate('author', 'username')
    .populate('category', 'name')
    .sort({ publishedAt: -1 });
};

// Static method to find posts by author
postSchema.statics.findByAuthor = function(authorId) {
  return this.find({ author: authorId, status: 'published' })
    .populate('author', 'username')
    .populate('category', 'name')
    .sort({ publishedAt: -1 });
};

// Instance method to add a like
postSchema.methods.addLike = function(userId) {
  if (!this.likes.some(like => like.user.toString() === userId.toString())) {
    this.likes.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove a like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Instance method to add a comment
postSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content.trim(),
  });
  return this.save();
};

module.exports = mongoose.model('Post', postSchema);

const Post = require('../models/Post');
const Category = require('../models/Category');
const { performanceLogger, errorLogger, dbLogger } = require('../utils/logger');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const startTime = Date.now();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { status: 'published' };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.author) {
      filter.author = req.query.author;
    }

    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const posts = await Post.find(filter)
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    performanceLogger('getPosts', startTime, { count: posts.length, total });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    errorLogger(error, { context: 'Get posts', query: req.query });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving posts',
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res) => {
  try {
    const startTime = Date.now();

    const post = await Post.findById(req.params.id)
      .populate('author', 'username profile')
      .populate('category', 'name')
      .populate('comments.user', 'username');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Increment view count
    post.views += 1;
    await post.save({ validateBeforeSave: false });

    performanceLogger('getPost', startTime, { postId: req.params.id });

    res.json({
      success: true,
      data: {
        post,
      },
    });
  } catch (error) {
    errorLogger(error, { context: 'Get post', postId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving post',
    });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const startTime = Date.now();

    const { title, content, category, tags, status } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    const post = await Post.create({
      title,
      content,
      category,
      author: req.user._id,
      tags: tags || [],
      status: status || 'published',
    });

    await post.populate('author', 'username');
    await post.populate('category', 'name');

    // Update category post count
    await categoryExists.updatePostCount();

    dbLogger('create', 'posts', { title, author: req.user._id }, post._id);
    performanceLogger('createPost', startTime, { postId: post._id });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post,
      },
    });
  } catch (error) {
    errorLogger(error, { context: 'Create post', body: req.body, userId: req.user._id });
    res.status(500).json({
      success: false,
      message: 'Server error creating post',
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const startTime = Date.now();

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check ownership
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post',
      });
    }

    const { title, content, category, tags, status } = req.body;

    // Verify category if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category',
        });
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        category,
        tags,
        status,
      },
      { new: true, runValidators: true }
    ).populate('author', 'username').populate('category', 'name');

    dbLogger('update', 'posts', { postId: req.params.id }, updatedPost._id);
    performanceLogger('updatePost', startTime, { postId: req.params.id });

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post: updatedPost,
      },
    });
  } catch (error) {
    errorLogger(error, { context: 'Update post', postId: req.params.id, body: req.body });
    res.status(500).json({
      success: false,
      message: 'Server error updating post',
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const startTime = Date.now();

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check ownership
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    // Update category post count
    const category = await Category.findById(post.category);
    if (category) {
      await category.updatePostCount();
    }

    dbLogger('delete', 'posts', { postId: req.params.id });
    performanceLogger('deletePost', startTime, { postId: req.params.id });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    errorLogger(error, { context: 'Delete post', postId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error deleting post',
    });
  }
};

// @desc    Add like to post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await post.addLike(req.user._id);

    res.json({
      success: true,
      message: 'Post liked successfully',
      data: {
        likes: post.likeCount,
      },
    });
  } catch (error) {
    errorLogger(error, { context: 'Like post', postId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error liking post',
    });
  }
};

// @desc    Remove like from post
// @route   DELETE /api/posts/:id/like
// @access  Private
const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await post.removeLike(req.user._id);

    res.json({
      success: true,
      message: 'Post unliked successfully',
      data: {
        likes: post.likeCount,
      },
    });
  } catch (error) {
    errorLogger(error, { context: 'Unlike post', postId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error unliking post',
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { content } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await post.addComment(req.user._id, content);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comments: post.commentCount,
      },
    });
  } catch (error) {
    errorLogger(error, { context: 'Add comment', postId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error adding comment',
    });
  }
};

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
};

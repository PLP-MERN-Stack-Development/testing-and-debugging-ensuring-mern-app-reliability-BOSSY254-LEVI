const express = require('express');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
} = require('../controllers/postController');
const { authenticate } = require('../utils/auth');
const {
  validatePostCreation,
  validatePostUpdate,
  validateObjectId,
  validatePagination,
  validatePostFilters,
  validateComment,
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', validatePagination, validatePostFilters, getPosts);
router.get('/:id', validateObjectId, getPost);

// Protected routes
router.post('/', authenticate, validatePostCreation, createPost);
router.put('/:id', authenticate, validateObjectId, validatePostUpdate, updatePost);
router.delete('/:id', authenticate, validateObjectId, deletePost);

// Like/Unlike routes
router.post('/:id/like', authenticate, validateObjectId, likePost);
router.delete('/:id/like', authenticate, validateObjectId, unlikePost);

// Comment routes
router.post('/:id/comments', authenticate, validateObjectId, validateComment, addComment);

module.exports = router;

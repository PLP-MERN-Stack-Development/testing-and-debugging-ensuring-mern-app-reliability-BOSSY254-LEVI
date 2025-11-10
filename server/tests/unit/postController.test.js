const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Post = require('../../src/models/Post');
const Category = require('../../src/models/Category');

describe('Post Controller', () => {
  let token;
  let user;
  let category;

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Post.deleteMany({});
    await Category.deleteMany({});

    // Create test user
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
    });

    // Create test category
    category = await Category.create({
      name: 'Technology',
      description: 'Tech related posts',
    });

    // Generate token
    const jwt = require('jsonwebtoken');
    token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      // Create test posts
      await Post.create([
        {
          title: 'Post 1',
          content: 'Content for post 1',
          author: user._id,
          category: category._id,
          status: 'published',
        },
        {
          title: 'Post 2',
          content: 'Content for post 2',
          author: user._id,
          category: category._id,
          status: 'draft',
        },
      ]);
    });

    it('should get all published posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.posts[0].title).toBe('Post 1');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should filter posts by category', async () => {
      const response = await request(app)
        .get(`/api/posts?category=${category._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(1);
    });

    it('should search posts by title and content', async () => {
      const response = await request(app)
        .get('/api/posts?search=post%201')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.posts[0].title).toBe('Post 1');
    });

    it('should paginate results', async () => {
      // Create more posts
      await Post.create([
        {
          title: 'Post 3',
          content: 'Content for post 3',
          author: user._id,
          category: category._id,
          status: 'published',
        },
        {
          title: 'Post 4',
          content: 'Content for post 4',
          author: user._id,
          category: category._id,
          status: 'published',
        },
      ]);

      const response = await request(app)
        .get('/api/posts?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.total).toBe(3);
    });
  });

  describe('GET /api/posts/:id', () => {
    let post;

    beforeEach(async () => {
      post = await Post.create({
        title: 'Test Post',
        content: 'Test content',
        author: user._id,
        category: category._id,
        status: 'published',
      });
    });

    it('should get single post by id', async () => {
      const response = await request(app)
        .get(`/api/posts/${post._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.post.title).toBe('Test Post');
      expect(response.body.data.post.views).toBe(1); // Should increment views
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/posts/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Post not found');
    });
  });

  describe('POST /api/posts', () => {
    it('should create new post with valid data', async () => {
      const postData = {
        title: 'New Post',
        content: 'This is the content of the new post',
        category: category._id.toString(),
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.post.title).toBe('New Post');
      expect(response.body.data.post.author.username).toBe('testuser');
    });

    it('should not create post without authentication', async () => {
      const postData = {
        title: 'New Post',
        content: 'Content',
        category: category._id.toString(),
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should not create post with invalid category', async () => {
      const fakeCategoryId = new mongoose.Types.ObjectId();
      const postData = {
        title: 'New Post',
        content: 'Content',
        category: fakeCategoryId.toString(),
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('PUT /api/posts/:id', () => {
    let post;

    beforeEach(async () => {
      post = await Post.create({
        title: 'Original Post',
        content: 'Original content',
        author: user._id,
        category: category._id,
        status: 'published',
      });
    });

    it('should update post with valid data', async () => {
      const updateData = {
        title: 'Updated Post',
        content: 'Updated content',
      };

      const response = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.post.title).toBe('Updated Post');
    });

    it('should not update post of another user', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'Password123',
      });

      const jwt = require('jsonwebtoken');
      const anotherToken = jwt.sign({ userId: anotherUser._id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

      const updateData = {
        title: 'Hacked Title',
      };

      const response = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized to update this post');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Post not found');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    let post;

    beforeEach(async () => {
      post = await Post.create({
        title: 'Post to Delete',
        content: 'This is a longer content that meets the minimum length requirement for validation',
        author: user._id,
        category: category._id,
        status: 'published',
      });
    });

    it('should delete post successfully', async () => {
      const response = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Post deleted successfully');

      // Verify post is deleted
      const deletedPost = await Post.findById(post._id);
      expect(deletedPost).toBeNull();
    });

    it('should not delete post of another user', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'Password123',
      });

      const jwt = require('jsonwebtoken');
      const anotherToken = jwt.sign({ userId: anotherUser._id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

      const response = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized to delete this post');
    });
  });
});

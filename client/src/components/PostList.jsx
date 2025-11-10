import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

const PostList = ({ posts, onEdit, onDelete, isLoading = false }) => {
  if (isLoading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (!posts || posts.length === 0) {
    return <div className="no-posts">No posts found.</div>;
  }

  return (
    <div className="post-list">
      {posts.map(post => (
        <div key={post._id} className="post-card">
          <h3>{post.title}</h3>
          <p className="post-category">Category: {post.category}</p>
          <p className="post-content">{post.content.substring(0, 150)}...</p>
          <div className="post-meta">
            <span>By: {post.author?.username || 'Unknown'}</span>
            <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="post-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(post)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(post._id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

PostList.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      author: PropTypes.shape({
        username: PropTypes.string,
      }),
      createdAt: PropTypes.string.isRequired,
    })
  ),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default PostList;

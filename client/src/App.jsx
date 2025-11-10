import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import PostList from './components/PostList';
import PostForm from './components/PostForm';
import Button from './components/Button';
import usePosts from './hooks/usePosts';
import { login, register } from './utils/api';
import './App.css';

function App() {
  const { posts, loading, error, createPost, updatePost, deletePost } = usePosts();
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
  const [editingPost, setEditingPost] = useState(null);
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login', 'register'
  const [authData, setAuthData] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you'd validate the token with the server
      setUser({ username: 'currentuser' }); // Mock user
    }
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      let response;
      if (authView === 'login') {
        response = await login({
          email: authData.email,
          password: authData.password,
        });
      } else {
        response = await register(authData);
      }

      localStorage.setItem('token', response.token);
      setUser(response.user);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('list');
  };

  const handleCreatePost = async (postData) => {
    try {
      await createPost(postData);
      setCurrentView('list');
    } catch (err) {
      // Error is handled in the hook
    }
  };

  const handleUpdatePost = async (postData) => {
    try {
      await updatePost(editingPost._id, postData);
      setCurrentView('list');
      setEditingPost(null);
    } catch (err) {
      // Error is handled in the hook
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setCurrentView('edit');
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(postId);
      } catch (err) {
        // Error is handled in the hook
      }
    }
  };

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>{authView === 'login' ? 'Login' : 'Register'}</h2>
          <form onSubmit={handleAuthSubmit}>
            {authView === 'register' && (
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={authData.username}
                  onChange={(e) => setAuthData(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={authData.email}
                onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={authData.password}
                onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            {authError && <div className="error-message">{authError}</div>}
            <Button type="submit">Submit</Button>
          </form>
          <Button
            variant="secondary"
            onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')}
          >
            Switch to {authView === 'login' ? 'Register' : 'Login'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <h1>MERN Blog</h1>
          <div className="user-info">
            <span>Welcome, {user.username}!</span>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>

        <nav className="app-nav">
          <Button
            variant={currentView === 'list' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('list')}
          >
            View Posts
          </Button>
          <Button
            variant={currentView === 'create' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('create')}
          >
            Create Post
          </Button>
        </nav>

        <main className="app-main">
          {error && <div className="error-message">{error}</div>}

          {currentView === 'list' && (
            <PostList
              posts={posts}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              isLoading={loading}
            />
          )}

          {currentView === 'create' && (
            <div className="form-container">
              <h2>Create New Post</h2>
              <PostForm onSubmit={handleCreatePost} isLoading={loading} />
            </div>
          )}

          {currentView === 'edit' && editingPost && (
            <div className="form-container">
              <h2>Edit Post</h2>
              <PostForm
                onSubmit={handleUpdatePost}
                initialData={editingPost}
                isLoading={loading}
              />
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;

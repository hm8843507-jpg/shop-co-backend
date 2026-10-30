function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeRole(role) {
  const value = String(role || 'User').trim().toLowerCase();
  if (value === 'admin') return 'Admin';
  if (value === 'editor') return 'Editor';
  return 'User';
}

function publicUser(user) {
  return {
    id: String(user._id),
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar_url: user.avatar_url || null,
    created_at: user.createdAt,
  };
}

module.exports = { asArray, normalizeRole, publicUser };

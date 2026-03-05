exports.sanitizeUser = function(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      parentPhone: user.parentPhone,
      profileImg: user.profileImg,
      role: user.role,
      emailVerified: user.emailVerified,
      active: user.active,
      isBanned: user.isBanned,
    };
  };
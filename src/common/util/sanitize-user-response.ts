export const sanitizeUserResponse = (user: any, email?: string) => {
  const plainUser =
    user && typeof user.toObject === 'function' ? user.toObject() : user;

  if (!plainUser || typeof plainUser !== 'object') {
    return plainUser;
  }

  const auth =
    plainUser.auth && typeof plainUser.auth === 'object'
      ? plainUser.auth
      : null;
  const resolvedEmail = email || auth?.email || plainUser.email;

  delete plainUser.password;
  delete plainUser.resetPasswordToken;
  delete plainUser.resetPasswordExpires;

  if (auth) {
    plainUser.auth = auth.email ? { email: auth.email } : undefined;
  }

  if (resolvedEmail) {
    plainUser.email = resolvedEmail;
  }

  return plainUser;
};

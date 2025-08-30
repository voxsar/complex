export const passwordResetTemplate = (resetLink: string) => ({
  subject: "Password Reset",
  text: `You requested a password reset. Use this link to set a new password: ${resetLink}`,
  html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Reset your password</a></p>`
});

export default passwordResetTemplate;

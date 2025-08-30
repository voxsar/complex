export const verificationTemplate = (verificationLink: string) => ({
  subject: "Verify Your Email",
  text: `Please verify your email by clicking the following link: ${verificationLink}`,
  html: `<p>Please verify your email by clicking <a href="${verificationLink}">this link</a>.</p>`
});

export default verificationTemplate;

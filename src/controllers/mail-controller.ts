import cntrWrapper from '../decorators/ctrlWrapper';
import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

const sendMail = async (req: Request, res: Response) => {
  const { name, email, message } = req.body;

  console.log('Sending mail with data:', { name, email, message });
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // your Gmail
      pass: process.env.GMAIL_APP_PASSWORD, // your Google App Password
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.GMAIL_USER,
    subject: `New Contact Form Submission from ${name}`,
    html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
  };

  await transporter.sendMail(mailOptions);

  res.status(200).json({ success: true, message: 'Message sent!' });
};

export default { sendMail: cntrWrapper(sendMail) };

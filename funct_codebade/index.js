const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'urmepehartie15@gmail.com',
    pass: 'jalq pdro modh ymii'
  }
});

exports.sendApprovalEmail = functions.database
  .ref('/approval_requests/{requestId}')
  .onDelete(async (snapshot) => { // Eliminat context, deoarece nu este utilizat
    const requestData = snapshot.val();
    const status = requestData.status;
    const userEmail = requestData.email;
    const subject = status === 'approved' ?
      'Cererea dumneavoastră a fost aprobată' :
      'Cererea dumneavoastră a fost respinsă';
    const message = status === 'approved' ?
      `Cererea dumneavoastră de încărcare pentru "${requestData.title}" ` +
      `de ${requestData.author} a fost aprobată.` :
      `Cererea dumneavoastră de încărcare pentru "${requestData.title}" ` +
      `de ${requestData.author} a fost respinsă.`;

    const mailOptions = {
      from: 'urmepehartie15@gmail.com',
      to: userEmail,
      subject: subject,
      text: message
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email trimis cu succes');
    } catch (error) {
      console.error('Eroare la trimiterea email-ului:', error);
    }
  });

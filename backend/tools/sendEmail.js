const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

async function sendAppointmentConfirmation({ patient, appointment }) {
  const appointmentDate = new Date(appointment.slot_time).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  const msg = {
    to: patient.email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Your Appointment Confirmation — Kyron Medical',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: #1565C0; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Kyron Medical</h1>
          <p style="color: #90caf9; margin: 8px 0 0;">Appointment Confirmation</p>
        </div>

        <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
          <p style="color: #333; font-size: 16px;">Dear ${patient.first_name} ${patient.last_name},</p>
          <p style="color: #555;">Your appointment has been successfully booked. Here are your details:</p>

          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #888; font-size: 14px; width: 140px;">Provider</td>
                <td style="padding: 10px 0; color: #333; font-weight: 600;">${appointment.provider_name}</td>
              </tr>
              <tr style="border-top: 1px solid #f0f0f0;">
                <td style="padding: 10px 0; color: #888; font-size: 14px;">Specialty</td>
                <td style="padding: 10px 0; color: #333;">${appointment.specialty}</td>
              </tr>
              <tr style="border-top: 1px solid #f0f0f0;">
                <td style="padding: 10px 0; color: #888; font-size: 14px;">Date & Time</td>
                <td style="padding: 10px 0; color: #333; font-weight: 600;">${appointmentDate}</td>
              </tr>
              <tr style="border-top: 1px solid #f0f0f0;">
                <td style="padding: 10px 0; color: #888; font-size: 14px;">Location</td>
                <td style="padding: 10px 0; color: #333;">123 Medical Plaza, Suite 400<br>New York, NY 10001</td>
              </tr>
            </table>
          </div>

          <div style="background: #e3f2fd; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #1565C0; margin: 0; font-size: 14px;">
              <strong>What to bring:</strong> Photo ID, insurance card, and any relevant medical records.
              Please arrive 15 minutes early to complete paperwork.
            </p>
          </div>

          <p style="color: #555; font-size: 14px;">
            Need to reschedule or have questions? Contact us at:<br>
            📞 (212) 555-0100 &nbsp;|&nbsp; 📧 support@kyronassessment.org
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message from Kyron Medical. Do not reply to this email.<br>
            For medical emergencies, call 911.
          </p>
        </div>
      </div>
    `
  }

  await sgMail.send(msg)
  console.log(`Confirmation email sent to ${patient.email}`)
}

module.exports = sendAppointmentConfirmation
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendAppointmenSms({ patient, appointment }) {
  const appointmentDate = new Date(appointment.slot_time).toLocaleString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  );

  const message = `Kyron Medical: Your appointment with ${appointment.provider_name} is confirmed for ${appointmentDate}. Location: 123 Medical Plaza, Suite 400, NY. Questions? Call (212) 555-0100.`;

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: patient.phone.startsWith('+') ? patient.phone : `+1${patient.phone}`
  });

  console.log(`SMS sent to ${patient.phone}`);
}

module.exports = sendAppointmentSms;
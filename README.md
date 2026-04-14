# Kyron Medical — AI Patient Scheduling Assistant

A full-stack AI-powered patient scheduling platform built for physician groups. Patients can schedule appointments, check office information, and seamlessly transition from web chat to a live voice call — all powered by Claude AI and Vogent Voice AI.

---

## Live Demo

- **Patient Portal:** https://kyronassessment.org
- **Admin Dashboard:** https://kyronassessment.org/admin

---

## Features

### Patient-Facing
- **AI Chat Interface** — Intelligent conversational scheduling powered by Claude (Anthropic)
- **Semantic Provider Matching** — AI matches patients to the right specialist based on their condition
- **Real-Time Availability** — Appointment slots fetched live from the database via tool calls
- **Full Booking Flow** — Collects patient info, presents slots, confirms bookings
- **Email Confirmation** — Automated confirmation emails via SendGrid on booking
- **Voice Handoff** — One-click transition from web chat to AI phone call via Vogent, retaining full conversation context
- **Session Persistence** — Conversation history survives page refreshes and reconnects

### Admin Dashboard
- **Provider Management** — View all providers with real-time availability stats
- **Slot Management** — Add, remove, block, and unblock appointment slots
- **Manual Booking** — Book appointments directly from the dashboard
- **Cancel Appointments** — Cancel booked slots and return them to availability
- **Real-Time Updates** — Changes immediately affect AI responses mid-conversation

### Safety & Guardrails
- AI refuses to provide medical advice, diagnoses, or treatment recommendations
- Safety tests cover jailbreak attempts, medical advice requests, and harmful prompts
- Voice AI has identical safety guardrails

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Material UI |
| Backend | Node.js + Express |
| AI Engine | Claude (Anthropic) via `@anthropic-ai/sdk` |
| Voice AI | Vogent |
| Database | PostgreSQL on AWS RDS |
| ORM | Sequelize |
| Email | SendGrid |
| Hosting | AWS EC2 (Ubuntu 24.04) |
| Reverse Proxy | NGINX + Certbot (Let's Encrypt) |
| Process Manager | PM2 |

---

## Project Structure

```
kyron-medical/
├── backend/
│   ├── routes/
│   │   ├── chat.js           # AI chat endpoint with tool loop
│   │   ├── availability.js   # Slot CRUD + provider stats
│   │   ├── conversations.js  # Session history retrieval
│   │   ├── voice.js          # Vogent integration + webhooks
│   │   └── dev.js            # Dev utilities (reset chat)
│   ├── tools/
│   │   ├── getAvailability.js      # Fetch open slots from DB
│   │   ├── bookAppointment.js      # Book slot + trigger notifications
│   │   ├── prescriptionRefill.js   # Refill request handling
│   │   ├── sendEmail.js            # SendGrid email confirmation
│   │   └── sendSms.js              # Twilio SMS confirmation
│   ├── models/
│   │   └── index.js          # Sequelize DB connection
│   ├── tests/
│   │   ├── health.test.js
│   │   ├── chat.test.js
│   │   ├── safety.test.js
│   │   ├── getAvailability.test.js
│   │   ├── bookAppointment.test.js
│   │   ├── availability.test.js
│   │   ├── conversations.test.js
│   │   ├── voice.test.js
│   │   └── nonHappyPath.test.js
│   ├── app.js
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ChatPage.jsx      # Main patient chat interface
│   │   │   └── AdminPage.jsx     # Admin availability dashboard
│   │   ├── components/
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── TypingIndicator.jsx
│   │   │   ├── ProviderCard.jsx
│   │   │   ├── Slot.jsx
│   │   │   └── AppTopBar.jsx
│   │   ├── theme.js
│   │   └── App.jsx
│   └── dist/                 # Production build
└── README.md
```

---

## Database Schema

```sql
-- Patients
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  dob DATE,
  phone VARCHAR(20),
  email VARCHAR(100) UNIQUE,
  sms_opt_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Providers
CREATE TABLE providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  specialty VARCHAR(100),
  body_part VARCHAR(100)
);

-- Availability Slots
CREATE TABLE availability_slots (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES providers(id),
  slot_time TIMESTAMP,
  is_booked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE,
  patient_id INTEGER REFERENCES patients(id),
  messages JSONB DEFAULT '[]',
  appointment_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prescription Refills
CREATE TABLE prescription_refills (
  id SERIAL PRIMARY KEY,
  patient_name VARCHAR(200),
  medication VARCHAR(200),
  pharmacy VARCHAR(300),
  phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Providers (Seeded)

| Provider | Specialty | Treats |
|----------|-----------|--------|
| Dr. Sarah Chen | Cardiologist | Heart conditions |
| Dr. James Ortega | Orthopedist | Bones, joints, muscles |
| Dr. Priya Patel | Dermatologist | Skin conditions |
| Dr. Michael Torres | Neurologist | Brain, nerves, headaches |

---

## Environment Variables

Create a `.env` file in `backend/`:

```env
PORT=3001
DATABASE_URL=postgres://user:password@your-rds-endpoint:5432/kyron
ANTHROPIC_API_KEY=sk-ant-...
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=your@email.com
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
VOGENT_API_KEY=vogent_xxxx
VOGENT_AGENT_ID=xxxx
VOGENT_PHONE_NUMBER_ID=xxxx
VOGENT_PROMPT_ID=xxxx
BASE_URL=https://kyronassessment.org
```

---

## Local Development

### Backend
```bash
cd backend
npm install
npm run dev     # uses nodemon
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # runs on http://localhost:5173
```

Set `VITE_API_URL=https://kyronassessment.org` in `frontend/.env`.

---

## Running Tests

```bash
cd backend
npm test                  # run all tests
npm run test:coverage     # with coverage report
```

**Test suites:**
- Health check
- Chat endpoint + conversation persistence
- AI safety guardrails
- Availability CRUD
- Booking flow
- Voice endpoints
- Non-happy-path scenarios

---

## Deployment

### EC2 Setup
```bash
# Install dependencies
sudo apt update && sudo apt install -y nodejs nginx certbot python3-certbot-nginx git postgresql-client
sudo npm install -g pm2

# Clone and install
git clone https://github.com/yourrepo/kyron-medical.git
cd kyron-medical/backend && npm install

# Start server
pm2 start index.js --name kyron-backend
pm2 save && pm2 startup
```

### Frontend Build
```bash
cd frontend
npm install
npm run build
sudo chmod -R 755 ~/kyron-medical/frontend/dist
sudo chmod o+x /home/ubuntu
```

### NGINX Config
```nginx
server {
    listen 80;
    server_name kyronassessment.org www.kyronassessment.org;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /home/ubuntu/kyron-medical/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### SSL
```bash
sudo certbot --nginx -d kyronassessment.org -d www.kyronassessment.org
```

---

## Architecture Highlights

### AI Tool Loop
Claude uses a multi-turn tool loop during chat. When availability is needed, it calls `get_availability` against the live RDS database. Before every booking it re-fetches availability to prevent double-booking. The full message history (including tool calls) is persisted to Postgres after every turn.

### Voice Context Handoff
When a patient clicks "Switch to Call," the backend serializes the full conversation history, injects it into the Vogent agent's versioned prompt, then dials the patient. The voice AI picks up mid-conversation without re-asking for information already provided.

### Real-Time Admin Updates
Availability changes in the admin dashboard write directly to RDS. Since the AI fetches availability via a live tool call on every relevant message, changes take effect immediately — mid-conversation if needed.

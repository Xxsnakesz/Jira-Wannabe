# Incident Management Dashboard

A real-time incident management dashboard built with Next.js 15, Tailwind CSS, and Supabase. Integrates with n8n automation workflows to receive and manage incident reports from WhatsApp.

## Features

- 🎯 **Kanban Board**: Drag-and-drop interface for managing incident status
- 📊 **Data Table**: Searchable and filterable table view with sorting
- ⚡ **Real-time Updates**: Live sync using Supabase subscriptions
- 🔗 **n8n Integration**: Webhook endpoint for receiving incidents from WhatsApp
- 📱 **Status Notifications**: Automatic notifications back to reporters via n8n

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React

## Getting Started

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the SQL from `supabase/schema.sql`
3. Enable Realtime for the `incidents` table in Table Editor → Realtime

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
WEBHOOK_SECRET=your_webhook_secret_key
N8N_WEBHOOK_URL=your_n8n_webhook_url_for_notifications
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## API Endpoints

### Webhook for n8n (Create Incident)

```
POST /api/webhook/incident
```

**Headers:**
- `Content-Type: application/json`
- `x-webhook-secret: your_webhook_secret` (optional)

**Request Body:**
```json
{
  "incident_id": "INC-20260119-0001",
  "keterangan": "Description of the incident",
  "tipe": "Infrastructure",
  "impact": "High",
  "pic": "John Doe",
  "nomor_wa": "6281234567890",
  "waktu_kejadian": "2026-01-19T10:30:00Z",
  "waktu_chat": "2026-01-19T10:35:00Z"
}
```

### Update Incident Status

```
PATCH /api/incidents/{id}
```

**Request Body:**
```json
{
  "status": "In Progress"
}
```

When status changes, the system automatically sends a notification to the configured `N8N_WEBHOOK_URL` with:
```json
{
  "incident_id": "INC-20260119-0001",
  "phone_number": "6281234567890",
  "old_status": "New",
  "new_status": "In Progress",
  "description": "Description of the incident"
}
```

### Get All Incidents

```
GET /api/incidents
GET /api/incidents?status=New
GET /api/incidents?search=INC-2026
```

### Get Single Incident

```
GET /api/incidents/{id}
```

## n8n Workflow Integration

### Receiving Incidents from WhatsApp

Configure your n8n workflow to POST to `/api/webhook/incident` with the mapped fields:

| n8n Field | Database Column |
|-----------|-----------------|
| incident_id | incident_id |
| keterangan | description |
| tipe | incident_type |
| impact | impact |
| pic | pic |
| nomor_wa | phone_number |
| waktu_kejadian | waktu_kejadian |
| waktu_chat | waktu_chat |

### Sending Status Notifications

Create an n8n webhook receiver to handle status change notifications and send WhatsApp messages back to reporters.

## Database Schema

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| incident_id | TEXT | Unique identifier (INC-YYYYMMDD-XXXX) |
| status | TEXT | New, In Progress, Resolved, Closed |
| description | TEXT | Incident description |
| incident_type | TEXT | Type/category of incident |
| impact | TEXT | Impact level (Critical, High, Medium, Low) |
| pic | TEXT | Person in charge |
| phone_number | TEXT | Reporter's WhatsApp number |
| waktu_kejadian | TIMESTAMPTZ | When the incident occurred |
| waktu_chat | TIMESTAMPTZ | When the report was received |
| created_at | TIMESTAMPTZ | Record creation time |
| updated_at | TIMESTAMPTZ | Record update time |

## License

MIT

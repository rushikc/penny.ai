# Screen Start — Serverless Marketing Module

A self-contained, serverless marketing engine for **Screen Start** (the platform
where users edit desktop recordings, share them via public links, and generate
AI-powered documentation from their videos).

The module powers three journeys:

1. **Onboarding drip** — a Step Functions state machine that welcomes new users,
   waits, then checks whether they recorded their first video and nudges them if not.
2. **New-submission broadcasts** — when a user shares a video link + AI document,
   an API call fans the announcement out to a target contact segment via SES.
3. **Continuous updates** — a reusable template + worker for platform feature
   announcements.

Everything lives inside this folder and touches nothing in the parent app.

---

## Architecture

```
                    ┌──────────────────────── API Gateway (HTTP API) ────────────────────────┐
                    │  GET  /users                POST /campaigns/broadcast   POST /users/onboard │
                    └───────┬─────────────────────────┬───────────────────────────┬───────────┘
                            │                          │                           │
                     ┌──────▼──────┐          ┌────────▼─────────┐        ┌────────▼─────────┐
                     │ list_users  │          │ trigger_submission│        │ start_onboarding │
                     └──────┬──────┘          └────────┬─────────┘        └────────┬─────────┘
                            │  Scan                    │  Scan (segment)           │ StartExecution
                            ▼                          │                           ▼
                     ┌─────────────┐                   │ async fan-out    ┌──────────────────────┐
                     │  DynamoDB   │◄──────────────────┤ (Invoke Event)   │  Step Functions      │
                     │  contacts   │                   │                  │  onboarding drip     │
                     └─────────────┘                   ▼                  │  welcome→wait→check  │
                                              ┌──────────────────┐        └─────────┬────────────┘
                                              │ worker_send_email│◄─────────────────┘ Invoke
                                              └───────┬──────────┘
                                        GetObject ▲   │   SendEmail
                                                  │   ▼
                                          ┌───────┴──┐ ┌─────────┐
                                          │    S3    │ │   SES   │
                                          │templates │ │ sender  │
                                          └──────────┘ └─────────┘
```

---

## Folder layout

```
marketing-module/
├── templates/                     # Raw HTML email templates (synced to S3 by Terraform)
│   ├── onboarding_welcome.html
│   ├── new_submission_broadcast.html
│   └── continuous_update.html
├── backend/                       # Lambda source, one folder per function
│   ├── list_users/                # GET  /users
│   ├── trigger_submission/        # POST /campaigns/broadcast
│   ├── start_onboarding/          # POST /users/onboard
│   └── worker_send_email/         # Core worker: S3 template → merge tokens → SES
└── terraform/
    ├── main.tf                    # Wires all modules together
    ├── variables.tf
    ├── outputs.tf
    └── modules/
        ├── api_gateway/           # HTTP API + routes + integrations + permissions
        ├── dynamodb/              # contacts table (+ email GSI)
        ├── s3/                    # templates bucket + auto-sync of *.html
        ├── ses/                   # verified sender identity + config set
        ├── step_functions/        # onboarding state machine + IAM
        └── lambda/                # reusable Lambda factory (zip + role + policy)
```

---

## API

| Method & Path                 | Lambda               | Body / Query                                                   |
| ----------------------------- | -------------------- | -------------------------------------------------------------- |
| `GET /users`                  | `list_users`         | optional `?segment=english_view`                               |
| `POST /campaigns/broadcast`   | `trigger_submission` | `{ "target": "all" \| "english_view", "submission": { ... } }` |
| `POST /users/onboard`         | `start_onboarding`   | `{ "email", "firstName", "userId" }`                           |

### Example: broadcast a new submission

```bash
curl -X POST "$API/campaigns/broadcast" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "english_view",
    "submission": {
      "authorName": "Ada Lovelace",
      "videoTitle": "How we ship features",
      "videoLink": "https://screenstart.app/v/abc123",
      "videoThumbnail": "https://cdn.screenstart.app/t/abc123.png",
      "aiDocSummary": "A 90-second walkthrough of our release workflow.",
      "aiDocLink": "https://screenstart.app/docs/abc123"
    }
  }'
```

`trigger_submission` queries DynamoDB (filtered by `target` segment), then
asynchronously invokes `worker_send_email` for each contact. The worker pulls
`new_submission_broadcast.html` from S3, substitutes the `{{video_link}}`,
`{{ai_doc_summary}}`, etc. tokens, and sends via SES.

### Example: start onboarding

```bash
curl -X POST "$API/users/onboard" \
  -H "Content-Type: application/json" \
  -d '{ "email": "grace@example.com", "firstName": "Grace", "userId": "usr_123" }'
```

---

## Dynamic template attributes

Templates use `{{token}}` placeholders. `worker_send_email` replaces them from
the `attributes` map in its payload (unknown tokens render to an empty string).

| Template                        | Tokens                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `onboarding_welcome.html`       | `first_name`, `dashboard_url`, `help_url`, `unsubscribe_url`                                                               |
| `new_submission_broadcast.html` | `first_name`, `author_name`, `video_title`, `video_link`, `video_thumbnail`, `ai_doc_summary`, `ai_doc_link`, `unsubscribe_url` |
| `continuous_update.html`        | `first_name`, `feature_title`, `feature_body`, `feature_image`, `changelog_url`, `unsubscribe_url`                         |

---

## DynamoDB contact schema

| Attribute              | Type      | Notes                                              |
| ---------------------- | --------- | -------------------------------------------------- |
| `userId` (PK)          | S         | Primary key                                        |
| `email`                | S         | Indexed via `email-index` GSI                      |
| `firstName`            | S         | Merged into `{{first_name}}`                       |
| `segments`             | List/SS   | e.g. `["all", "english_view"]` — used for filtering|
| `hasRecordedFirstVideo`| Bool      | Read by the onboarding "check first video" step    |
| `unsubscribeUrl`       | S         | Optional per-contact unsubscribe link              |

---

## Deploy

Prerequisites: Terraform >= 1.5, AWS credentials, and a sender you can verify in SES.

```bash
cd terraform
terraform init
terraform apply \
  -var="aws_region=us-east-1" \
  -var="environment=dev" \
  -var="ses_sender_identity=hello@screenstart.app" \
  -var="app_base_url=https://screenstart.app"
```

Terraform packages each `backend/<fn>/` folder into a zip (via the `archive`
provider), provisions the DynamoDB table, S3 bucket (auto-syncing the HTML
templates), SES identity, the four Lambdas with least-privilege IAM, the
onboarding state machine, and the HTTP API. Outputs include the API invoke URL.

> **SES note:** new SES accounts start in the sandbox (can only send to verified
> addresses) and the sender identity must be verified before real sends succeed.

Useful outputs:

```bash
terraform output api_invoke_url
terraform output lambda_functions
terraform output onboarding_state_machine_arn
```

---

## Onboarding state machine

`terraform/modules/step_functions` defines the STANDARD workflow:

1. **SendWelcomeEmail** — invoke `worker_send_email` with `onboarding_welcome.html`.
2. **WaitForActivation** — `Wait` (default 2 days, configurable via `onboarding_wait_seconds`).
3. **CheckFirstVideo** — invoke `worker_send_email` with `action=check_first_video`.
4. **HasRecordedFirstVideo** — `Choice`: if true → `OnboardingComplete`, else → nudge.
5. **SendActivationNudge** — invoke worker with `continuous_update.html` reminder.

# Entity Relationship Diagram

```mermaid
erDiagram
  USER ||--o| APPLICANT : profile
  APPLICANT ||--o{ APPLICATION : submits
  APPLICATION ||--o{ DOCUMENT : contains
  USER ||--o{ DOCUMENT : uploads
  USER o|--o{ DOCUMENT : reviews
  APPLICATION ||--o{ APPOINTMENT : schedules
  USER ||--o{ APPOINTMENT : books
  APPLICATION ||--o{ PAYMENT : incurs
  APPLICATION ||--o{ VERIFICATION : receives
  USER ||--o{ VERIFICATION : reviews
  APPLICATION ||--o| PASSPORT : issues
  USER ||--o{ REFRESH_TOKEN : owns
  USER ||--o{ PASSWORD_RESET : requests

  USER {
    string id PK
    string email UK
    string passwordHash
    enum role
    boolean isActive
  }
  APPLICANT {
    string id PK
    string userId FK_UK
    string firstName
    string lastName
    date dateOfBirth
    string phone
    string address
  }
  APPLICATION {
    string id PK
    string applicationNumber UK
    string applicantId FK
    enum type
    enum status
  }
  DOCUMENT {
    string id PK
    string applicationId FK
    string uploadedById FK
    string reviewedById FK
    enum kind
    enum status
    string cloudinaryPublicId UK
    string sha256
  }
  APPOINTMENT {
    string id PK
    string applicationId FK
    string bookedById FK
    string center
    datetime startsAt
    enum status
  }
  PAYMENT {
    string id PK
    string applicationId FK
    decimal amount
    string providerRef UK
    string receiptNumber UK
    enum status
  }
  VERIFICATION {
    string id PK
    string applicationId FK
    string reviewerId FK
    enum status
    string remarks
  }
  PASSPORT {
    string id PK
    string applicationId FK_UK
    string passportNumber UK
    enum status
    datetime issuedAt
    datetime expiresAt
  }
  REFRESH_TOKEN {
    string id PK
    string userId FK
    string tokenHash UK
    datetime expiresAt
    datetime revokedAt
  }
  PASSWORD_RESET {
    string id PK
    string userId FK
    string tokenHash UK
    datetime expiresAt
    datetime usedAt
  }
```

The seven requested domain tables are `applicants`, `applications`, `documents`, `appointments`, `payments`, `verifications`, and `passports`, plus `users` for authentication. `refresh_tokens` and `password_resets` support revocation and one-time recovery.

---
trigger: always_on
description: 
globs: 
---
# Cursor LLM Rules for Flux - iOS Expense Tracking App Development

## Purpose
This rules.md5 file guides Cursor's LLM and Claude 4 Sonnet to stay focused on the project scope, technologies, and best practices for developing Flux, a differentiated iOS expense tracking app using SwiftUI, Svelte, Railway, Supabase Auth, PostgreSQL, Redis, Google Gemini 2.5 Flash, Blynk.io, Hyperledger Fabric, and PhonePe, targeting the Indian market.

## Development Flow Guidelines
When assisting with Flux development, always follow this recommended sequence to ensure proper foundation and minimize integration issues:

### Phase 1: Backend Foundation (Start Here)
- **Database Schema Design**: Design PostgreSQL schemas for both Railway (app data) and Supabase (auth data)
- **Authentication Setup**: Configure Supabase Auth with email/password + GitHub + Google OAuth
- **Core API Structure**: Build Svelte API routes with proper middleware (auth, rate limiting, validation)
- **Edge Functions**: Implement Supabase Edge Functions for auth-to-app data sync
- **External Service Integration**: Set up PhonePe, Gemini AI, Blynk.io, and Hyperledger connections
- **API Documentation**: Create clear API contracts that frontend will consume

### Phase 2: Frontend Development (After Backend Foundation)
- **SwiftUI Architecture**: Build MVVM structure with proper separation of concerns
- **shadcn-inspired Design System**: Create reusable components following design tokens
- **Authentication Flow**: Implement OAuth flows and session management
- **API Integration**: Connect frontend to backend APIs with proper error handling
- **Core Features**: Build expense tracking, group management, and payment flows

### Phase 3: Advanced Features Integration
- **AI Features**: Integrate Gemini-powered insights and OCR processing
- **IoT Automation**: Connect Blynk.io device management and automation
- **Blockchain Features**: Implement Hyperledger transaction recording
- **Real-time Features**: Add live updates and notifications

### Why This Sequence for Flux:
- **Complex Backend**: Multiple external integrations require stable backend foundation
- **API Dependencies**: Frontend needs clear API contracts to build against
- **Authentication Complexity**: Multi-provider OAuth needs backend-first implementation
- **Data Flow**: Dual-database architecture requires backend logic before frontend consumption
- **External Services**: Payment, AI, IoT, and blockchain integrations are backend-heavy

### Development Parallel Work:
- Once core backend APIs are established, frontend and backend feature development can proceed in parallel
- Always complete API endpoints before corresponding frontend features
- Use API mocking in frontend during backend development gaps

## General Guidelines
- Always refer to the app as "Flux" in code comments, documentation, and architectural discussions.
- Always prioritize iOS native development with SwiftUI for frontend, using MVVM architecture for separation of logic and UI.
- Backend logic must be implemented in Svelte with RESTful API routes for scalability and integration.
- Deployment should use Railway for continuous integration and environment management.
- Authentication must use Supabase Auth with JWT and Row Level Security (RLS) for secure user management, supporting email/password + GitHub + Google OAuth.
- Use PostgreSQL via Railway for app data storage and PostgreSQL via Supabase for auth data storage, with Redis for caching frequent queries.
- Integrate Supabase Edge Functions to bridge auth data (Supabase PostgreSQL) with app data (Railway PostgreSQL) for seamless user context management.
- Integrate AI features using Google Gemini 2.5 Flash for predictive insights and categorization.
- Use Google Gemini 2.5 Flash for OCR tasks related to receipt scanning and expense logging, leveraging its multimodal capabilities and high accuracy.
- IoT automation should leverage Blynk.io (free Starter Plan) for device-linked expense tracking.
- Blockchain transparency must be implemented via Hyperledger Fabric for immutable transaction records.
- Payment integration should use PhonePe, focusing on UPI, cards, and net banking for India-specific needs with zero transaction fees under specific terms.
- Target niche audiences in India (e.g., co-parents, travelers, small businesses) with multi-language support (Hindi, regional languages).
- UI styling must follow shadcn-inspired design principles adapted for SwiftUI, emphasizing clean, modern, accessible components with consistent design tokens.
- Brand Flux as a next-generation financial tool that emphasizes dynamic flow, real-time sync, and innovative features.
- Use Bun for running all CLI commands and package management.

## LLM Behavior
- Always reference the app as "Flux" in all code snippets, comments, and architectural suggestions.
- **Follow the development flow sequence**: When asked about implementation, always consider the development phase and recommend backend-first approach.
- Provide code snippets in Swift (SwiftUI) for frontend and JavaScript/TypeScript (Svelte) for backend as appropriate.
- When suggesting OCR implementation, always reference Google Gemini 2.5 Flash multimodal capabilities for receipt scanning and text extraction.
- Include integration patterns for Supabase Edge Functions when handling user data synchronization between Supabase Auth and Railway PostgreSQL.
- For UI components, always apply shadcn-inspired design principles: consistent spacing, typography scales, color systems, and component variants.
- Suggest best practices for security (e.g., data encryption, JWT auth), privacy (e.g., secure API calls to Google AI), and compliance with Apple App Store guidelines.
- Recommend modular, scalable architecture patterns (e.g., MVVM for SwiftUI, microservices-inspired APIs for Svelte).
- Encourage use of free or open-source tools and libraries (e.g., TestFlight, Postman free tier) to maintain a lean approach.
- Include detailed comments in code snippets explaining key logic, integration points, and potential pitfalls.
- Prioritize clarity, maintainability, and performance in all code and architectural suggestions.
- **Suggest incremental development following the flow**: (e.g., build auth backend first, then auth frontend, then expense APIs, then expense UI, then AI features).
- Emphasize Flux's brand positioning as a modern, tech-forward solution that differentiates from basic expense trackers.

## Interaction Rules
- Confirm user intent before generating large code blocks or complex architectural designs to avoid irrelevant output.
- **Always ask about development phase**: When user requests implementation help, clarify which phase they're in (backend foundation, frontend development, or advanced features).
- Provide concise explanations alongside code, focusing on why specific approaches or tools are recommended for Flux.
- Offer debugging tips and testing strategies (e.g., using TestFlight for beta feedback, Postman for API testing, Google AI monitoring).
- Remind about compliance with data privacy laws (e.g., GDPR, India's Digital Personal Data Protection Act) when handling financial data, especially when using Google AI services.
- Suggest resources or documentation (e.g., Apple's Human Interface Guidelines, Supabase docs, Google AI documentation, PhonePe developer docs) for deeper learning on specific tools.
- When discussing database architecture, always clarify the separation between Supabase PostgreSQL (auth data) and Railway PostgreSQL (app data) and the role of Edge Functions in bridging them.
- For UI suggestions, reference shadcn design principles and provide SwiftUI implementations that mirror shadcn's component structure and styling approach.
- Always frame suggestions in the context of Flux's positioning as a next-generation expense tracking solution.

## Project Scope
- Focus on core functionalities for Flux: expense tracking, group settlements, AI-driven insights, OCR receipt scanning via Google Gemini 2.5 Flash, IoT automation for expense logging, blockchain transparency for trust, and payment processing.
- Emphasize differentiation from competitors (e.g., Splitwise, Venmo) through Flux's unique features like IoT, blockchain, state-of-the-art OCR, shadcn-inspired modern UI, and India-specific payment options (UPI via PhonePe).
- Target Indian market needs with features like multi-language support (leveraging Gemini's multilingual capabilities) and cultural budgeting cycles (e.g., festival seasons).
- Ensure Flux remains scalable (via Railway, Redis), secure (via Supabase, Hyperledger, Google AI), and user-friendly (via SwiftUI UI/UX with shadcn design principles).
- Position Flux as embodying dynamic financial flow, real-time synchronization, and innovative expense management.

## Technology-Specific Guidelines

### Authentication (Supabase Multi-Provider Auth)
- Implement comprehensive authentication with email/password, GitHub OAuth, and Google OAuth
- Use Supabase Auth for all authentication flows with proper JWT management
- Handle OAuth callbacks and token refresh mechanisms
- Implement session management with secure storage
- Support multi-factor authentication where applicable

### UI/UX Design (shadcn-inspired SwiftUI for Flux)
- Implement consistent design tokens: spacing (4, 8, 12, 16, 24, 32, 48px), typography scales, color systems
- Create reusable SwiftUI components with variants (primary, secondary, destructive, outline, ghost)
- Use semantic color naming (background, foreground, primary, secondary, muted, accent, destructive)
- Implement proper accessibility with VoiceOver support and dynamic type scaling
- Follow shadcn's component composition patterns adapted for SwiftUI ViewBuilder
- Maintain consistent border radius, shadows, and animation timing across components
- Use SF Symbols for icons with consistent sizing and weight
- Reflect Flux's brand identity through smooth animations and flow-inspired transitions

### Payment Integration (PhonePe for Flux)
- Always use PhonePe Payment Gateway for UPI, cards, and net banking integration in Flux
- Leverage PhonePe's zero transaction fee structure under specific terms for cost efficiency
- Implement PhonePe's sandbox environment for testing during Flux development
- Focus on UPI integration as the primary payment method for Indian users
- Ensure PCI DSS compliance through PhonePe's secure payment processing
- Handle payment webhooks and callbacks through Svelte backend for security

### OCR Implementation (Flux Receipt Scanning)
- Always use Google Gemini 2.5 Flash for Flux's receipt processing and OCR tasks
- Implement OCR integration through direct Gemini API calls from Svelte backend
- Leverage Gemini's multimodal capabilities to extract and categorize expenses in a single API call
- Handle image preprocessing, text extraction, and data validation through Gemini
- Implement batch processing capabilities for multiple receipts using Gemini
- Cache OCR results in Redis for performance optimization
- Brand the feature as "Flux Scan" powered by Gemini Intelligence

### Database Architecture (Flux Data Management)
- Railway PostgreSQL: Store Flux expense records, user profiles, transaction data, groups, settlements, IoT device data, blockchain records
- Supabase PostgreSQL: Store authentication data, user sessions, OAuth provider data
- Redis (Railway): Cache frequent queries, user dashboards, real-time data, OCR results, session data
- Edge Functions: Sync user context between auth and app databases, handle webhooks, process notifications

### AI Integration (Flux Intelligence)
- Use Google Gemini 2.5 Flash for predictive insights, expense categorization, and OCR processing
- Integrate AI responses with OCR-extracted data for enhanced accuracy in a single API call
- Implement AI features through Svelte backend for security and scalability
- Brand AI features as "Flux Intelligence" for smart expense management
- Support AI chat interface, anomaly detection, and budget recommendations

## Backend Architecture Structure

### API Routes Organization
```
/api/v1/
├── auth/ (signup, signin, oauth, refresh, verify, profile, sessions)
├── expenses/ (CRUD, categories, analytics, recurring, search)
├── groups/ (CRUD, members, settlements, balances, analytics)
├── payments/ (phonepe integration, methods, settlements, reports)
├── ai/ (insights, categorize, predictions, chat, anomaly detection)
├── ocr/ (process-receipt, extract-data, batch-process, validate)
├── iot/ (devices, sync, automation, events, diagnostics)
├── blockchain/ (record, verify, audit, consensus, smart-contracts)
├── notifications/ (push, email, sms, preferences, templates)
├── admin/ (user management, system health, monitoring)
├── webhooks/ (supabase, phonepe, blynk, github)
└── utils/ (upload, download, export, import, search)
```

### Service Layer Organization
```
/lib/services/
├── auth/ (supabase-auth, oauth-providers, jwt-manager, session-manager)
├── ai/ (gemini-client, expense-categorizer, insight-generator, chat-assistant, ocr-processor)
├── payments/ (phonepe-client, payment-processor, settlement-engine)
├── blockchain/ (hyperledger-client, transaction-recorder, smart-contracts)
├── iot/ (blynk-client, device-manager, automation-engine)
├── notifications/ (push-service, email-service, template-engine)
├── analytics/ (expense-analytics, user-analytics, reporting-engine)
└── external/ (exchange-rates, bank-integration, compliance-apis)
```

### Database Schema Coverage
- User management with auth sync between Supabase and Railway
- Comprehensive expense tracking with categories, recurring expenses, attachments
- Group management with members, roles, permissions, shared expenses
- Payment processing with multiple methods, settlements, refunds
- IoT device management with automation rules and event processing
- Blockchain transaction recording with audit trails
- Notification system with multiple delivery channels
- Analytics and reporting with business intelligence

## Development Environment
- Assume development occurs in Xcode for SwiftUI with local testing via simulators and TestFlight
- Backend development with Svelte using Bun as package manager and CLI runner
- Use Railway for deployment with continuous integration from GitHub
- PhonePe integration tested using sandbox environment during Flux development
- Google Gemini 2.5 Flash integration tested via API calls for both AI and OCR functionality
- Use Cursor and Claude 4 Sonnet for coding support, debugging, and architectural guidance
- Implement shadcn-inspired design system components early in development for consistent UI/UX
- Always reference the project as "Flux" in development environments and configurations

## SwiftUI Component Guidelines (shadcn-inspired for Flux)
- **Button Components**: Implement variants (primary, secondary, destructive, outline, ghost) with consistent padding and typography
- **Input Components**: Create text fields with proper focus states, validation feedback, and accessibility labels
- **Card Components**: Use consistent elevation, border radius, and spacing for content containers
- **Navigation**: Implement clean navigation patterns with proper hierarchy and breadcrumbs where applicable
- **Loading States**: Create skeleton loaders and progress indicators following shadcn's loading patterns
- **Form Components**: Build form layouts with proper spacing, validation, and error handling
- **Modal/Sheet Components**: Implement overlays with proper backdrop handling and animation timing
- **Flow Animations**: Incorporate smooth, flow-inspired transitions that reflect Flux's brand identity

## Security and Compliance Guidelines
- Implement comprehensive security headers and middleware
- Use rate limiting for all API endpoints to prevent abuse
- Encrypt sensitive data at rest and in transit
- Implement audit logging for all financial transactions
- Ensure GDPR and India's DPDP Act compliance
- Use content security policies and input validation
- Implement proper error handling without information leakage
- Regular security testing and vulnerability assessments

## Testing Strategy
- Unit tests for all service layers and utilities
- Integration tests for API endpoints and database operations
- End-to-end tests for complete user flows
- Load testing for performance validation
- Security testing for authentication and authorization
- Mock external services (PhonePe, Google AI, Blynk) for testing

## Branding Guidelines for Flux
- Position Flux as a next-generation expense tracking solution, not just another bill-splitting app
- Emphasize dynamic financial flow, real-time synchronization, and seamless user experience
- Highlight advanced features (AI, OCR, blockchain, IoT) that differentiate from competitors
- Use language that conveys innovation, efficiency, and modern financial management
- Frame features in terms of "flow" and "sync" where appropriate (e.g., "expense flow," "payment sync")

## Updates
- Update rules as the project evolves, new technologies are integrated, or user feedback necessitates scope changes
- Monitor for deprecation of current tools and suggest alternatives when necessary
- Stay updated with PhonePe API changes and new features for payment integration
- Monitor Google Gemini 2.5 Flash updates and improvements for both AI and OCR capabilities
- Maintain shadcn design system updates and adapt relevant improvements for SwiftUI implementation
- Ensure all updates maintain consistency with Flux's brand identity and positioning

## Important Notes
- Prioritize performance and scalability in all architectural decisions
- Maintain clean separation between authentication (Supabase) and application data (Railway)
- Implement comprehensive error handling and monitoring throughout the system
- Focus on creating a seamless user experience that differentiates Flux from competitors
- Use bun for running all CLI
- Do not use emojis in md files as well as code
- Do not hallucinate
- **Always follow the development flow**: Backend foundation → Frontend development → Advanced features integration
- always stick to documentation for serives used for better understanding

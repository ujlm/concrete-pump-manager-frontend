# Concrete Pump Management System - Product Specification

## Overview
A comprehensive multi-tenant web application for planning and managing concrete pump services, merging two older applications with modern, sleek styling. The system supports multiple concrete pump companies with complete data isolation and is designed for large screens with responsive support for tablets and smartphones.

## Technical Stack
- **Framework**: Next.js 15.5.3 (App Router)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with organization-based access control
- **Styling**: Tailwind CSS v4 + Shadcn/ui
- **Internationalization**: next-intl (English default, Dutch translation)
- **Data Visualization**: Chart.js
- **Excel Export**: xlsx
- **Maps**: Google Maps API + Waze SDK
- **Messaging**: WhatsApp API (via Supabase Edge Functions)
- **Multi-tenancy**: Organization-based data isolation with RLS policies

## Core Features

### 0. Organization Management

#### Organizations (`/admin/organizations`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | String | Organization name |
| `slug` | String | URL-friendly identifier (unique) |
| `domain` | String | Optional custom domain |
| `logo_url` | String | Organization logo |
| `primary_color` | String | Brand color (hex) |
| `secondary_color` | String | Secondary brand color (hex) |
| `address` | String | Organization address |
| `phone` | String | Contact phone |
| `email` | String | Contact email |
| `is_active` | Boolean | Active status |
| `subscription_tier` | Enum | "basic", "premium", "enterprise" |
| `max_users` | Integer | User limit based on subscription |
| `max_pumps` | Integer | Pump limit based on subscription |
| `created_at` | DateTime | Auto-generated |
| `updated_at` | DateTime | Auto-generated |

#### Organization Setup
- **Super Admin**: Can create new organizations
- **Organization Admin**: Can manage their organization settings
- **Onboarding Flow**: Guided setup for new organizations
- **Data Isolation**: Complete separation between organizations

#### User Authentication & Management
- **User Registration**: Admins can create users and invite them via email
- **Email Invitations**: Users receive invitation emails with organization access
- **Password Management**: Individual users can reset their own passwords; admins can reset any user's password
- **Two-Factor Authentication**: 2FA support via Supabase Auth MFA
- **Single Organization**: Users can only belong to one organization
- **User Deactivation**: Not implemented in initial version

#### Organization Onboarding Process
1. **Organization Creation**
   - Super admin creates organization with basic details
   - System generates unique slug and subdomain
   - Initial admin user is created and invited

2. **Initial Setup**
   - Organization branding (logo, colors)
   - Basic configuration (address, contact info)
   - Subscription tier selection
   - User limits configuration

3. **Data Import** (Optional)
   - CSV import for existing clients, users, machines
   - Data validation and error handling
   - Preview before final import

4. **User Invitation**
   - Email invitations with role assignment
   - Self-registration with organization code
   - Bulk user import from CSV

5. **Go-Live Checklist**
   - All required data populated
   - Users trained and active
   - Integrations configured (WhatsApp, Maps)
   - Backup and monitoring setup

### 1. Planning Calendar (`/planning`)

#### Calendar Views
Three distinct calendar views with drivers as columns and time slots as rows (15-minute granularity):

1. **Planned Jobs Only** (Voorlopige Planning)
   - Grey: Job assigned to definitive planning
   - Green: Job cancelled
   - Allows overlap with warnings

2. **Assigned Jobs Only** (Definitieve Planning)
   - No overlaps allowed
   - Clear visual distinction

3. **Split View**
   - Top: Assigned jobs
   - Bottom: Planned jobs
   - Aligned columns for easy comparison

#### Calendar Navigation
- Next 10 workdays clickable
- Date picker for alternative navigation
- "Go to Today" button
- Complete daily overview

#### Job Interaction
- **Double-click/drag empty space**: Create new job
- **Click job**: Select for movement
- **Drag job**: Move to different time/driver
- **Status transitions**: Planned → Assigned (greys out planned version)

#### Visual Elements
- Travel time: Striped pattern
- Job time: Solid color
- Overlap warnings with confirmation prompts

### 2. Job Management

#### Job Data Fields
| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | UUID | Primary key | System |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `departure_time` | DateTime | Auto-calculated via Waze (90 km/h max) | Before start_time |
| `start_time` | DateTime | User-set job start | After departure_time |
| `end_time` | DateTime | User-set job end | Min 1 hour duration |
| `pump_type` | Foreign Key | Selected from pump types | Required |
| `pump_type_requested` | Foreign Key | May differ from pump_type | Optional |
| `pumpist` | Foreign Key | Selected from users (role: Pompist) | Required |
| `client` | Foreign Key | Selected from clients | Required |
| `price_list` | Foreign Key | Selected from price lists | Required |
| `address` | String | Google Maps autocomplete | Required |
| `yard` | String | May differ from address | Optional |
| `phone` | String | Optional contact | Optional |
| `concrete_supplier` | Foreign Key | Selected from suppliers | Optional |
| `concrete_plant` | Foreign Key | Selected from plants | Optional |
| `expected_volume` | Integer | Volume in m³ | Required |
| `pipe_length` | Integer | Length in meters | Required |
| `construction_type` | String | Construction type (code-based values: "Chape", "Funderingen", "Wanden", "Vloeren", "Balkons", "Trappen") | Required |
| `dispatcher_notes` | Text | Private dispatcher notes | Optional |
| `pumpist_notes` | Text | Notes visible to pumpist | Optional |
| `status` | Enum | te_plannen, gepland, gepland_eigen_beton, geannuleerd | Required |
| `created_at` | DateTime | Auto-generated | System |
| `updated_at` | DateTime | Auto-generated | System |

#### Job Status Workflow
1. **te_plannen** (default) → **gepland** (dispatcher assignment)
2. **gepland** → **gepland_eigen_beton** (driver update via WhatsApp)
3. Any status → **geannuleerd** (dispatcher only)

#### Job Tracking (Optional)
- **Actual vs Expected Comparison**: Track actual pumped volume vs expected volume
- **Time Tracking**: Record actual start/end times vs planned times
- **Resource Usage**: Track actual pipe length used vs planned
- **Performance Metrics**: Calculate efficiency and accuracy rates
- **Invoicing Support**: Actual data used for final invoicing calculations
- **User Tracking**: Record who performed the tracking

### 3. Administrative Pages

#### Clients (`/admin/clients`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `client_code` | Integer | Unique identifier within organization |
| `name` | String | Client name |
| `price_list` | Foreign Key | Linked price list |
| `is_concrete_supplier` | Boolean | Supplier flag |
| `phone` | String | Contact number |
| `address` | String | Street and number |
| `postal_code` | String | Postal code (flexible format for different countries) |
| `city` | String | City name |
| `country` | String | Default: Belgium |
| `created_at` | DateTime | Auto-generated |
| `updated_at` | DateTime | Auto-generated |

#### Concrete Plants (`/admin/concrete-plants`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `name` | String | Plant name |
| `client` | Foreign Key | Linked client |
| `address` | String | Street and number |
| `postal_code` | String | Postal code (flexible format for different countries) |
| `city` | String | City name |
| `country` | String | Default: Belgium |
| `created_at` | DateTime | Auto-generated |
| `updated_at` | DateTime | Auto-generated |

#### Yards (`/admin/yards`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `name` | String | Unique yard name within organization |
| `client` | Foreign Key | Linked client |
| `contact_person` | String | Yard contact |
| `address` | String | Street and number |
| `postal_code` | String | Postal code (flexible format for different countries) |
| `city` | String | City name |
| `country` | String | Default: Belgium |
| `phone` | String | Optional contact |
| `email` | String | Optional email |
| `created_at` | DateTime | Auto-generated |
| `updated_at` | DateTime | Auto-generated |

#### Price Lists (`/admin/prices`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `name` | String | Unique price list name within organization |
| `is_active` | Boolean | Active status |
| `cement_milk_price` | Float | Price per unit |
| `central_cleaning_rate` | Float | Cleaning price |
| `weekend_surcharge` | Integer | Percentage increase (e.g., 50 = 50%) |
| `cement_bag_price` | Float | Bag price |
| `second_pumpist_rate` | Float | Additional pumpist rate |
| `second_pumpist_pipe_length` | Float | Pipe length threshold |
| `created_at` | DateTime | Auto-generated |
| `updated_at` | DateTime | Auto-generated |

#### Users (`/admin/users`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `auth_user_id` | UUID | Foreign Key to Supabase auth.users | Required |
| `first_name` | String | First name |
| `last_name` | String | Last name |
| `is_active` | Boolean | Active status |
| `email` | String | Optional email |
| `phone` | String | Optional phone |
| `roles` | Array | ["Pompist", "Manager", "Dispatcher", "Accountant"] |
| `created_at` | DateTime | Auto-generated |
| `updated_at` | DateTime | Auto-generated |

#### Machines (`/admin/machines`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `name` | String | Unique machine name within organization |
| `machine_code` | String | Machine identifier |
| `pumpist` | Foreign Key | Linked user (role: Pompist) |
| `invoice_template` | Foreign Key | Linked invoice template |
| `is_active` | Boolean | Active status |
| `license_plate` | String | License plate (flexible format for different countries) |
| `type` | Enum | "Pump" or "Mixer" |
| `pump_type` | Foreign Key | Linked to pump_types table |
| `created_at` | DateTime | Auto-generated |
| `updated_at` | DateTime | Auto-generated |

#### Pump Types (`/admin/pump-types`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `name` | String | Pump type name (e.g., "Pump_leiden", "Pump_32", "Pump_36") |
| `capacity` | Integer | Capacity in m³/hour |
| `is_active` | Boolean | Active status |
| `created_at` | DateTime | Auto-generated |
| `updated_at` | DateTime | Auto-generated |

#### Invoice Templates (`/admin/invoicing`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `name` | String | Template name |
| `template_data` | JSONB | Template configuration and field mappings |
| `is_default` | Boolean | Default template for organization |
| `created_at` | DateTime | Auto-generated |
| `updated_at` | DateTime | Auto-generated |

#### Suppliers (`/admin/suppliers`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `name` | String | Supplier name |
| `contact_person` | String | Contact person name |
| `phone` | String | Contact phone |
| `email` | String | Contact email |
| `address` | String | Street and number |
| `postal_code` | String | Postal code (flexible format for different countries) |
| `city` | String | City name |
| `country` | String | Default: Belgium |
| `is_active` | Boolean | Active status |
| `created_at` | DateTime | Auto-generated |
| `updated_at` | DateTime | Auto-generated |

#### Job Tracking (`/tracking`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `job_id` | UUID | Foreign Key to jobs | Required |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `actual_start_time` | DateTime | Actual job start time |
| `actual_end_time` | DateTime | Actual job end time |
| `actual_volume` | Integer | Actual pumped volume in m³ |
| `actual_pipe_length` | Integer | Actual pipe length used in meters |
| `notes` | Text | Additional tracking notes |
| `tracked_by` | UUID | Foreign Key to users (who tracked this) |
| `created_at` | DateTime | Auto-generated |
| `updated_at` | DateTime | Auto-generated |

#### Audit Logs (`/audit`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign Key to organizations | Required |
| `user_id` | UUID | Foreign Key to users | Required |
| `action` | String | Action performed (CREATE, UPDATE, DELETE) |
| `table_name` | String | Database table affected |
| `record_id` | UUID | ID of the affected record |
| `old_values` | JSONB | Previous values (for updates/deletes) |
| `new_values` | JSONB | New values (for creates/updates) |
| `ip_address` | String | User's IP address |
| `user_agent` | String | User's browser/client info |
| `created_at` | DateTime | Auto-generated |

#### Audit Logs (`/admin/audit`)
- **Action Tracking**: All CREATE, UPDATE, DELETE operations logged
- **User Attribution**: Track which user performed each action
- **Data Changes**: Store old and new values for updates
- **Security Information**: IP address and user agent tracking
- **Organization Isolation**: Logs scoped to organization
- **Search & Filter**: Find specific actions or users
- **Export Capability**: Export audit logs for compliance

### 4. Dashboard (`/dashboard`)

#### Reporting Features
- Customizable date range selection
- Export to Excel functionality
- All tables exportable

#### Reports
1. **Gross Revenue per Client per Workday**
   - Daily breakdown
   - Client totals
   - Grand totals

2. **Number of Jobs per Pumpist per Workday**
   - Daily job counts
   - Pumpist totals
   - Grand totals

3. **Volume per Pump per Workday**
   - Daily volume tracking
   - Pump totals
   - Grand totals

4. **Cancellation Analysis**
   - Pivot table: cancellations per client per workday
   - Client comparison
   - Trend analysis

5. **Job Tracking Performance**
   - Actual vs expected volume comparison
   - Time accuracy (planned vs actual)
   - Resource utilization efficiency
   - Performance metrics per pumpist

### 5. Business Rules & Validation

#### Job Creation Rules
- Jobs always start as "te_plannen"
- Departure time must be before start time
- Minimum job duration: 1 hour
- Address validation via Google Maps
- Travel time calculated using Waze SDK
- Job time is the duration between start_time and end_time

#### Assignment Rules
- Only dispatchers can assign jobs
- Managers can have dispatcher role
- No overlaps in assigned jobs
- Overlaps allowed in planned jobs (with warnings)

#### Pricing Rules
- Each organization has a default price list
- Clients can be assigned to custom price lists by admin
- Weekend/holiday surcharge applied when job is planned for weekends or holidays
- Price calculations based on volume, pipe length, and additional services

#### Permission Matrix
| Role | Planned Jobs | Assigned Jobs | User Management | Organization Settings | Job Tracking | Audit Logs | All Other Data |
|------|-------------|---------------|-----------------|---------------------|--------------|------------|----------------|
| Pompist | View Own Org | View Own Org | None | None | Update Own Jobs | None | Read Only (Own Org) |
| Dispatcher | Full Access (Own Org) | Full Access (Own Org) | None | None | Full Access (Own Org) | Read Only | Full Access (Own Org) |
| Manager | Full Access (Own Org) | Full Access (Own Org) | Full Access (Own Org) | Read Only | Full Access (Own Org) | Full Access (Own Org) | Full Access (Own Org) |
| Accountant | Read Only (Own Org) | Read Only (Own Org) | None | None | Read Only (Own Org) | Read Only (Own Org) | Full Access (Own Org) |
| Organization Admin | Full Access (Own Org) | Full Access (Own Org) | Full Access (Own Org) | Full Access (Own Org) | Full Access (Own Org) | Full Access (Own Org) | Full Access (Own Org) |
| Super Admin | Full Access (All Orgs) | Full Access (All Orgs) | Full Access (All Orgs) | Full Access (All Orgs) | Full Access (All Orgs) | Full Access (All Orgs) | Full Access (All Orgs) |

### 6. Integrations

#### Google Maps
- Address autocomplete
- Route calculation fallback
- Coordinate storage for yards
- Single API key for entire system

#### Waze SDK
- Primary route calculation
- 90 km/h speed limit
- Time-of-day consideration
- Fallback to Google Maps if unavailable
- Implementation in Phase 2

#### WhatsApp API
- Driver notifications
- Job details with formatted message
- Waze link for navigation
- Read receipt tracking (if available)
- Error handling with manual contact fallback
- Implementation in Phase 2

#### Excel Export
- **Job Reports**: Date range, client, pumpist, volume, status
- **Client Reports**: Job history, volume totals, revenue
- **Pumpist Reports**: Job assignments, hours worked, performance
- **Financial Reports**: Revenue by client, pricing analysis
- **Custom Templates**: Organization-specific export formats

### 7. User Experience

#### Responsive Design
- Large screens: Full calendar view
- Tablets: Optimized layout
- Smartphones: Stacked view with navigation

#### Navigation
- Intuitive calendar navigation
- Quick day switching
- "Go to Today" functionality
- Breadcrumb navigation

#### Data Entry
- Searchable dropdowns
- Auto-complete fields
- Validation feedback
- Confirmation dialogs

### 8. Technical Architecture

#### Database Schema
- English field names
- Proper foreign key relationships with organization isolation
- Indexed fields for performance (including organization_id)
- Audit trails (created_at, updated_at)
- Row Level Security (RLS) policies for data isolation
- UUID primary keys for better security

#### Multi-tenancy Implementation
- **Organization-based isolation**: All data scoped to organization_id
- **Row Level Security**: Database-level access control
- **Authentication flow**: User → Organization → Data access
- **URL structure**: `/[unique-organization-name]/...` for organization-specific routes
- **Data migration**: Support for organization data export/import
- **File Storage**: Organization logos stored in Supabase Storage
- **Backup Strategy**: Handled by Supabase with automated backups
- **Error Handling**: All error logs written to database
- **API Rate Limiting**: Global limits applied across all organizations

#### Real-time Features
- Optimistic updates (organization-scoped)
- Conflict detection
- State consistency checks
- Refresh-based updates
- Organization-specific real-time subscriptions

#### Security
- Role-based access control with organization context
- Input validation
- SQL injection prevention
- XSS protection
- Organization data isolation
- Secure multi-tenant authentication
- Always verify organization_id and user role before data access
- Two-factor authentication support

#### Audit Logging
- **Database Logging**: All data-changing actions logged to database
- **Logged Actions**: Create, update, delete operations on all entities
- **User Tracking**: Track which user performed each action
- **Organization Isolation**: Logs scoped to organization
- **Timestamp Tracking**: Precise timing of all actions
- **Action Details**: Detailed information about what was changed

### 9. Future Enhancements

#### Phase 2 Features
- WhatsApp status updates from drivers
- Real-time pump tracking
- Accounting software integration (Yuki)
- Advanced reporting analytics

#### Scalability Considerations
- Database indexing strategy
- Caching implementation
- API rate limiting
- Performance monitoring

## Implementation Phases

### Phase 1: Core Foundation
1. **Multi-tenant database schema setup**
   - Organizations table with RLS policies
   - All tables with organization_id foreign keys
   - Database indexes and constraints
2. **Authentication system with organization support**
   - Supabase auth integration
   - Organization-based user management
   - Role-based access control
3. **Organization management**
   - Organization creation and setup
   - User invitation system
   - Organization settings
4. **Basic calendar views (organization-scoped)**
5. **Job CRUD operations (organization-scoped)**
6. **Admin pages for data management (organization-scoped)**

### Phase 2: Advanced Features
1. Calendar interactions (drag/drop)
2. WhatsApp integration (organization-scoped)
3. Waze/Google Maps integration
4. Dashboard and reporting (organization-scoped)
5. Excel export functionality (organization-scoped)
6. **Organization onboarding flow**
7. **Data migration tools**

### Phase 3: Polish & Optimization
1. Responsive design refinement
2. Performance optimization (multi-tenant)
3. Error handling improvements
4. User experience enhancements
5. Testing and bug fixes
6. **Organization analytics and monitoring**

## Data Migration & Organization Management

### Migration from Existing Systems
- **Legacy Data Import**: Support for importing data from existing concrete pump management systems
- **CSV Import Tools**: Bulk import for clients, users, machines, price lists
- **Data Validation**: Comprehensive validation during import process
- **Error Handling**: Detailed error reporting and correction suggestions
- **Rollback Capability**: Ability to undo imports if issues are discovered

### Organization Lifecycle Management
- **Organization Creation**: Streamlined process for setting up new companies
- **User Management**: Invitation system, role assignment, bulk operations
- **Subscription Management**: Tier upgrades/downgrades, usage monitoring
- **Data Export**: Complete organization data export for backup/migration
- **Organization Deactivation**: Secure data handling when organizations are closed

### Multi-tenant Considerations
- **Performance**: Database indexing strategy for organization-scoped queries
- **Scalability**: Horizontal scaling considerations for multiple organizations
- **Backup Strategy**: Organization-specific backup and recovery procedures
- **Monitoring**: Per-organization usage and performance metrics
- **Compliance**: Data isolation and privacy requirements

### Subscription & Pricing Model
- **Custom Contracts**: Pricing handled through custom contracts with each organization
- **Subscription Tiers**: Basic, Premium, Enterprise tiers with different feature sets
- **Usage Limits**: User and pump limits enforced based on subscription tier
- **Billing**: Custom billing arrangements per organization
- **No API Access**: Single system for all organizations, no separate API access needed

## Success Metrics
- **User adoption rate** (per organization)
- **Job assignment efficiency** (per organization)
- **System uptime** (overall and per organization)
- **User satisfaction scores** (per organization)
- **Data accuracy improvements** (per organization)
- **Organization onboarding success rate**
- **Multi-tenant performance metrics**
- **Data isolation compliance**
- **Organization retention rate**

---

*This specification serves as the foundation for developing a robust, scalable concrete pump management system that streamlines operations and improves efficiency.*

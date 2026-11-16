# PLAN.md - Ice Cream Factory Management Platform

## 1. Project Overview

यह एक production-ready web platform है एक ice cream factory के लिए। इसमें factory का पूरा चक्र कवर होगा: raw material खरीद, ice cream production, stock, hawker (street vendor) के through बिक्री, शादी-विवाह की bulk booking, single-order booking, delivery और live tracking।

**Goals**

- Public storefront जहाँ products सुंदर तरीके से दिखें (carousel, image slider, product listing)
- Customers single order और wedding/event bulk booking कर सकें
- Internal management: orders, stock, production, hawkers, staff, delivery
- Role-based dashboards with charts और live tracking
- Fast, secure, scalable, production-ready deployment

**Tech Stack (Decided)**

- Backend: .NET Core (.NET 10), ASP.NET Core Web API, Clean Architecture
- Database: SQL Server with Entity Framework Core + Dapper (heavy reports के लिए)
- Frontend: React with Next.js (SSR/SEO के लिए), Redux Toolkit, RTK Query
- Realtime: SignalR (live order और delivery tracking)
- Auth: JWT + Refresh Token, ASP.NET Core Identity, role और policy based authorization
- Deployment: Docker, Nginx, CI/CD (GitHub Actions या Azure DevOps), Azure या AWS

---

## 2. User Roles

1. **Super Admin**: पूरा system control, admin बनाना, global settings, audit logs, सारी reports
2. **Admin**: products, pricing, orders, customers, hawkers, staff, reports manage करना
3. **Staff (Manager / Production / Store)**: production batches, raw material stock, order packing, daily tasks
4. **Hawker (Vendor)**: अपना stock लेना, बिक्री entry, हिसाब-किताब, outstanding payment देखना
5. **Delivery Partner**: assigned deliveries देखना, status update, location share, proof of delivery
6. **Customer**: browse, order, wedding booking, payment, order tracking, history

---

## 3. Functional Modules

### 3.1 Public Website (Customer Facing)

- Home page: hero carousel, offers banner, featured products, testimonials
- Product catalog: category, flavour, size, price filter, search, sort
- Product detail: image slider, zoom, description, ingredients, reviews
- Cart और checkout (guest + login)
- Wedding / Event booking page: date, guest count, flavour selection, package, advance payment
- Order tracking page
- Contact, About, FAQ

### 3.2 Customer Module

- Register/Login (email, mobile OTP)
- Profile और multiple addresses
- Order history, reorder
- Booking history, booking status
- Invoice download (PDF)
- Notifications (SMS, WhatsApp, email)

### 3.3 Product और Catalog Management

- Category, Flavour, Product, Variant (size/pack)
- Multiple images, pricing, GST, discount, coupon
- Active/Inactive, stock-linked availability
- Seasonal और combo packages

### 3.4 Order Management

- Order types: Retail (single), Wedding/Bulk, Hawker supply
- Order lifecycle: Placed, Confirmed, In Production, Packed, Out for Delivery, Delivered, Cancelled, Returned
- Payment status: Pending, Partial, Paid, Refunded
- Invoice, credit note, order notes

### 3.5 Wedding / Event Booking

- Event date availability calendar (capacity based)
- Package selection ya custom flavour mix
- Quantity, venue, delivery time slot
- Advance payment aur balance tracking
- Quotation generate karna aur approval
- Booking status: Enquiry, Quoted, Confirmed, Advance Paid, Scheduled, Delivered, Closed

### 3.6 Inventory aur Raw Material

- Raw material master: milk, sugar, cream, flavours, packaging
- Supplier management, purchase orders, goods receipt
- Stock in/out, minimum stock alert, expiry/batch tracking
- Finished goods stock (cold storage wise)

### 3.7 Production Management

- Recipe / BOM: per product raw material formula
- Production batch plan, batch number, yield, wastage
- Raw material auto deduction, finished stock addition
- Daily production report

### 3.8 Hawker Management

- Hawker registration, area/route assignment
- Daily stock issue aur return reconciliation
- Sales entry, commission, ledger, outstanding
- Hawker performance report

### 3.9 Delivery aur Live Tracking

- Delivery assignment (manual + route based)
- Delivery partner mobile-friendly web view
- Live location (SignalR + Maps API)
- Status updates, OTP ya photo proof of delivery
- Customer ko tracking link

### 3.10 Payments

- Razorpay ya PhonePe/Paytm gateway, UPI, card, netbanking
- COD, partial/advance payment
- Refund, payment reconciliation, webhook handling

### 3.11 Notifications

- Email (SendGrid/SMTP), SMS (MSG91), WhatsApp (Business API)
- In-app real-time notifications (SignalR)
- Templates: order confirm, dispatch, delivery, payment due, booking reminder

### 3.12 Dashboards aur Reports

- Super Admin / Admin: revenue, orders, top products, wedding bookings, stock alerts, hawker sales, delivery status
- Charts: line, bar, pie, heatmap (Recharts ya ApexCharts)
- Live widgets: today's orders, pending deliveries, low stock
- Export: Excel aur PDF
- Audit log aur activity log

---

## 4. High Level Architecture

```
[React/Next.js Frontend] --> [API Gateway / Nginx] --> [ASP.NET Core Web API]
                                                          |
              +-------------------+-----------------------+-------------------+
              |                   |                       |                   |
         [SQL Server]        [Redis Cache]          [SignalR Hub]      [Background Jobs]
                                                                       (Hangfire)
                                   |
                    [Blob Storage: images/invoices]   [Payment/SMS/Email/Maps APIs]
```

**Backend layers (Clean Architecture)**

- Domain: entities, enums, business rules
- Application: use cases (CQRS + MediatR), DTOs, validators (FluentValidation), interfaces
- Infrastructure: EF Core, repositories, external services, identity
- API: controllers, middleware, filters, SignalR hubs

**Frontend structure**

- Next.js App Router, feature-based folders
- Redux Toolkit store, RTK Query for API calls
- Role-based route guards
- UI library: MUI ya Ant Design ya Tailwind + shadcn
- Carousel: Swiper.js, forms: React Hook Form + Zod

---

## 5. Dashboards, Charts aur Live Tracking (Role wise)

| Role | Dashboard widgets | Charts | Live features |
| --- | --- | --- | --- |
| Super Admin | Total revenue, orders, active users, system health, audit log | Revenue trend (line), branch/area sales (bar), role-wise users (pie) | Live activity feed, error alerts |
| Admin | Today's orders, pending deliveries, wedding bookings, low stock, hawker outstanding | Daily/monthly sales (line), top products (bar), category share (pie), booking calendar heatmap | Live new-order counter, delivery status board |
| Staff | Today's production plan, packing queue, raw material alerts | Batch yield (bar), wastage trend (line) | New order notification, stock alert |
| Hawker | Stock issued, sold, returned, amount due | Daily sales (bar), weekly trend (line) | Stock approval status |
| Delivery Partner | Assigned deliveries, route list, completed today | Deliveries per day (bar) | Live GPS sharing, status buttons, OTP verify |
| Customer | Active orders, upcoming wedding booking, past orders | None | Live order tracking timeline and map |

**Live tracking flow**: Order Placed, Confirmed, In Production, Packed, Out for Delivery, Delivered. हर status change पर SignalR से customer और admin screen तुरंत update होगी। Delivery partner की location हर 10-15 सेकंड में Google Maps पर दिखेगी।

---

## 6. Third Party Integrations

| Purpose | Options |
| --- | --- |
| Payment | Razorpay (UPI, card, netbanking), webhook verification |
| SMS / OTP | MSG91 ya Twilio |
| WhatsApp | WhatsApp Business API (order aur booking updates) |
| Email | SendGrid ya SMTP |
| Maps / Tracking | Google Maps JavaScript API, Distance Matrix |
| File storage | Azure Blob ya AWS S3 (product images, invoices) |
| Image CDN | Cloudinary ya Azure CDN (fast image loading) |
| Charts | Recharts ya ApexCharts |
| Carousel / Slider | Swiper.js |
| PDF / Excel | QuestPDF, ClosedXML |
| Background jobs | Hangfire |
| Cache | Redis |
| Logging / Monitoring | Serilog, Seq ya Application Insights, Sentry (frontend) |

---

## 7. Frontend Low Level Plan (React + Next.js)

- **State**: Redux Toolkit slices (auth, cart, ui), RTK Query for server data aur caching
- **Folders**: app/ (routes), features/ (products, orders, bookings, hawkers, dashboard), components/ (shared UI), services/, hooks/, utils/
- **Routing**: public routes, customer routes, aur role-wise protected admin routes
- **Performance**: SSR/ISR for product pages, lazy loading, next/image, code splitting, skeleton loaders
- **UX**: responsive mobile-first, hero carousel, product image slider with zoom, filters, sticky cart, toast notifications
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest, React Testing Library, Playwright (E2E)

---

## 8. Backend Low Level Plan (.NET 10)

- **Projects**: Domain, Application, Infrastructure, Api
- **Patterns**: CQRS with MediatR, Repository + Unit of Work, FluentValidation, AutoMapper
- **API**: REST, versioning (v1), Swagger/OpenAPI, global exception middleware, rate limiting, pagination
- **Auth**: JWT + refresh token, role aur policy based authorization, audit trail on every write
- **Realtime**: SignalR hubs for orders aur delivery location
- **Jobs**: Hangfire for reminders, low-stock alerts, daily reports
- **Testing**: xUnit, Moq, integration tests with Testcontainers

### Core Database Tables (SQL Server)

Users, Roles, Customers, Addresses, Categories, Products, ProductVariants, ProductImages, Cart, Orders, OrderItems, Payments, Bookings (wedding), BookingItems, RawMaterials, Suppliers, PurchaseOrders, StockLedger, Recipes, ProductionBatches, Hawkers, HawkerStockIssues, HawkerSales, Deliveries, DeliveryLocations, Notifications, AuditLogs.

---

## 9. Security aur Production Readiness

- HTTPS everywhere, CORS policy, secure headers, input validation
- Password hashing, account lockout, OTP rate limit
- Secrets in Key Vault ya environment variables, never in code
- Soft delete aur audit logs
- Daily database backup aur restore test
- Health checks, structured logging, alerting
- GST compliant invoice, data privacy basics

---

## 10. Deployment aur DevOps

- Docker containers for API aur frontend, Nginx reverse proxy
- Environments: Dev, Staging, Production
- CI/CD: build, test, security scan, deploy via GitHub Actions ya Azure DevOps
- EF Core migrations in pipeline, zero downtime deploy
- Monitoring: Application Insights ya Grafana + Seq

---

## 11. Phase wise Roadmap

1. **Phase 1 (Weeks 1-3)**: Setup, architecture, auth aur roles, product catalog, admin basics
2. **Phase 2 (Weeks 4-6)**: Public website, cart, checkout, payments, customer account
3. **Phase 3 (Weeks 7-9)**: Wedding booking, quotation, advance payment, order management
4. **Phase 4 (Weeks 10-12)**: Inventory, production, hawker module
5. **Phase 5 (Weeks 13-15)**: Delivery, live tracking, notifications, dashboards aur charts
6. **Phase 6 (Weeks 16-18)**: Testing, performance tuning, security review, deployment, go-live

---

## 12. Next Steps

- [ ] Requirements finalize करना (pricing rules, wedding packages, GST)
- [ ] UI wireframes aur design system
- [ ] Repo setup (backend + frontend) aur CI/CD skeleton
- [ ] Database ERD finalize करना
- [ ] Phase 1 sprint planning

---

# PART B: Development Ready Detailed Specification

नीचे का हिस्सा सीधे development शुरू करने के लिए है: database schema, API endpoints, frontend pages, folder structure और coding rules।

---

## 13. Database Schema (SQL Server)

**Common columns (हर table में)**: Id (BIGINT identity, PK), CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, IsDeleted (soft delete), RowVersion (concurrency). नीचे के tables में इन्हें दोबारा नहीं लिखा।

### 13.1 Identity aur Users

| Table | Key columns |
| --- | --- |
| Users | Id, FullName, Email (unique), Mobile (unique), PasswordHash, IsActive, LastLoginAt, FailedLoginCount, LockoutEnd |
| Roles | Id, Name (SuperAdmin, Admin, Staff, Hawker, Delivery, Customer) |
| UserRoles | UserId (FK), RoleId (FK) |
| RefreshTokens | Id, UserId (FK), Token, ExpiresAt, RevokedAt, CreatedByIp |
| OtpRequests | Id, Mobile, OtpHash, Purpose, ExpiresAt, AttemptCount, IsUsed |
| Permissions | Id, Code (e.g. orders.view, orders.edit), Description |
| RolePermissions | RoleId (FK), PermissionId (FK) |
| StaffProfiles | Id, UserId (FK), StaffType (Manager/Production/Store/Packing), EmployeeCode, JoinDate |

### 13.2 Customer aur Address

| Table | Key columns |
| --- | --- |
| Customers | Id, UserId (FK, nullable for guest), Name, Mobile, Email, GstNumber (optional) |
| Addresses | Id, CustomerId (FK), Label, Line1, Line2, City, State, Pincode, Latitude, Longitude, IsDefault |

### 13.3 Catalog

| Table | Key columns |
| --- | --- |
| Categories | Id, Name, Slug (unique), ParentId (FK self), ImageUrl, SortOrder, IsActive |
| Products | Id, CategoryId (FK), Name, Slug (unique), ShortDescription, Description, Ingredients, HsnCode, GstPercent, IsVeg, IsFeatured, IsActive, AvgRating |
| ProductVariants | Id, ProductId (FK), Sku (unique), Name (e.g. 500ml tub), Unit, PackSize, Mrp, SellingPrice, WholesalePrice, MinOrderQty, IsActive |
| ProductImages | Id, ProductId (FK), ImageUrl, ThumbUrl, AltText, SortOrder, IsPrimary |
| Coupons | Id, Code (unique), DiscountType (Percent/Flat), Value, MinOrderAmount, MaxDiscount, ValidFrom, ValidTo, UsageLimit, UsedCount |
| Banners | Id, Title, ImageUrl, LinkUrl, Position (Hero/Offer), SortOrder, StartDate, EndDate, IsActive |
| ProductReviews | Id, ProductId (FK), CustomerId (FK), Rating, Comment, IsApproved |
| WeddingPackages | Id, Name, Description, MinGuests, PricePerHead, ImageUrl, IsActive |
| WeddingPackageItems | Id, PackageId (FK), ProductVariantId (FK), QtyPerHead |

### 13.4 Cart, Orders aur Payments

| Table | Key columns |
| --- | --- |
| Carts | Id, CustomerId (FK), SessionId (guest), CouponId (FK, nullable) |
| CartItems | Id, CartId (FK), VariantId (FK), Quantity, UnitPrice |
| Orders | Id, OrderNumber (unique, e.g. ICE-2026-000123), OrderType (Retail/Wedding/Hawker), CustomerId (FK), HawkerId (FK, nullable), BookingId (FK, nullable), AddressId (FK), Status, PaymentStatus, SubTotal, DiscountAmount, GstAmount, DeliveryCharge, GrandTotal, PaidAmount, DeliverySlotStart, DeliverySlotEnd, Notes, CancelReason |
| OrderItems | Id, OrderId (FK), VariantId (FK), ProductName, Sku, Quantity, UnitPrice, GstPercent, LineTotal |
| OrderStatusHistory | Id, OrderId (FK), FromStatus, ToStatus, ChangedBy, ChangedAt, Remark |
| Payments | Id, OrderId (FK), BookingId (FK, nullable), Gateway, GatewayOrderId, GatewayPaymentId, Method, Amount, Status, PaidAt, RawResponse |
| Refunds | Id, PaymentId (FK), Amount, Reason, Status, GatewayRefundId |
| Invoices | Id, OrderId (FK), InvoiceNumber (unique), PdfUrl, IssuedAt |

### 13.5 Wedding Booking

| Table | Key columns |
| --- | --- |
| Bookings | Id, BookingNumber (unique), CustomerId (FK), EventType (Wedding/Reception/Party), EventDate, EventTimeSlot, VenueName, VenueAddress, GuestCount, PackageId (FK, nullable), Status (Enquiry/Quoted/Confirmed/AdvancePaid/Scheduled/Delivered/Closed/Cancelled), QuotedAmount, AdvanceAmount, BalanceAmount, SpecialRequest |
| BookingItems | Id, BookingId (FK), VariantId (FK), Quantity, UnitPrice, LineTotal |
| BookingQuotes | Id, BookingId (FK), Version, TotalAmount, ValidTill, PdfUrl, Status (Sent/Accepted/Rejected) |
| DailyCapacity | Id, Date (unique), MaxLitres, BookedLitres, IsBlocked |

### 13.6 Inventory aur Production

| Table | Key columns |
| --- | --- |
| Suppliers | Id, Name, Contact, Mobile, GstNumber, Address |
| RawMaterials | Id, Name, Unit (kg/litre/piece), MinStockLevel, CurrentStock, IsPerishable |
| PurchaseOrders | Id, PoNumber (unique), SupplierId (FK), Status, OrderDate, ExpectedDate, TotalAmount |
| PurchaseOrderItems | Id, PoId (FK), RawMaterialId (FK), Qty, Rate, ReceivedQty |
| RawMaterialStockLedger | Id, RawMaterialId (FK), BatchNo, TxnType (In/Out/Wastage/Adjust), Quantity, ExpiryDate, RefType, RefId, BalanceAfter |
| Recipes | Id, VariantId (FK), Version, OutputQty, IsActive |
| RecipeItems | Id, RecipeId (FK), RawMaterialId (FK), QtyRequired |
| ProductionBatches | Id, BatchNo (unique), RecipeId (FK), PlannedQty, ProducedQty, WastageQty, Status, StartedAt, CompletedAt, SupervisorId (FK) |
| FinishedStockLedger | Id, VariantId (FK), BatchId (FK), TxnType, Quantity, ExpiryDate, BalanceAfter, StorageLocation |

### 13.7 Hawker, Delivery aur Notifications

| Table | Key columns |
| --- | --- |
| Hawkers | Id, UserId (FK), Name, Mobile, AreaOrRoute, CommissionPercent, CreditLimit, OutstandingAmount, IsActive |
| HawkerStockIssues | Id, HawkerId (FK), IssueDate, Status, TotalValue |
| HawkerStockIssueItems | Id, IssueId (FK), VariantId (FK), IssuedQty, SoldQty, ReturnedQty, DamagedQty, Rate |
| HawkerSales | Id, HawkerId (FK), SaleDate, TotalSale, CashCollected, OnlineCollected, Commission |
| HawkerLedger | Id, HawkerId (FK), EntryDate, EntryType (Issue/Sale/Payment/Adjust), Debit, Credit, BalanceAfter |
| DeliveryPartners | Id, UserId (FK), VehicleType, VehicleNumber, IsAvailable |
| Deliveries | Id, OrderId (FK), PartnerId (FK), Status (Assigned/PickedUp/OnTheWay/Delivered/Failed), AssignedAt, PickedAt, DeliveredAt, DeliveryOtp, ProofPhotoUrl, FailReason |
| DeliveryLocations | Id, DeliveryId (FK), Latitude, Longitude, Speed, RecordedAt |
| Notifications | Id, UserId (FK), Channel (InApp/Email/Sms/WhatsApp), Title, Body, IsRead, SentAt, Status |
| AuditLogs | Id, UserId, Action, EntityName, EntityId, OldValues (JSON), NewValues (JSON), IpAddress, At |
| Settings | Id, Key (unique), Value, Description |

### 13.8 Relationships aur Indexes

- Orders 1:N OrderItems; Orders 1:N OrderStatusHistory; Orders 1:1 Deliveries; Orders 1:N Payments
- Bookings 1:N BookingItems; Bookings 1:N BookingQuotes; Bookings 1:N Orders (delivery batches)
- Products 1:N ProductVariants 1:N ProductImages; Recipes N:1 ProductVariants
- Index: Orders(CustomerId, Status, CreatedAt), Orders(OrderNumber), Products(Slug), ProductVariants(Sku), DeliveryLocations(DeliveryId, RecordedAt), Bookings(EventDate, Status), RawMaterialStockLedger(RawMaterialId, ExpiryDate)
- Unique filtered indexes जहाँ IsDeleted = 0
- Reports के लिए SQL views या indexed views, aur DeliveryLocations को हर रात archive/purge (30 दिन से पुराना)

---

## 14. API Endpoints (REST, base: /api/v1)

**Standard response**: { success, message, data, errors, pagination }. List APIs में page, pageSize, search, sortBy, sortDir. हर protected API पर Bearer JWT ज़रूरी।

### 14.1 Auth

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | /auth/register | Public | Customer registration |
| POST | /auth/login | Public | Email/mobile + password login |
| POST | /auth/otp/send | Public | Mobile OTP bhejna |
| POST | /auth/otp/verify | Public | OTP verify aur login |
| POST | /auth/refresh | Public | New access token |
| POST | /auth/logout | Any | Refresh token revoke |
| POST | /auth/forgot-password | Public | Reset link/OTP |
| POST | /auth/reset-password | Public | Naya password set |
| GET | /auth/me | Any | Current user aur permissions |

### 14.2 Catalog (Public + Admin)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | /categories | Public | Category tree |
| GET | /products | Public | List with filters (category, price, veg, search, sort) |
| GET | /products/{slug} | Public | Detail with variants, images, reviews |
| GET | /products/featured | Public | Home page featured |
| GET | /banners | Public | Hero carousel aur offer banners |
| GET | /wedding-packages | Public | Package list |
| POST | /admin/products | Admin | Product create |
| PUT | /admin/products/{id} | Admin | Product update |
| DELETE | /admin/products/{id} | Admin | Soft delete |
| POST | /admin/products/{id}/images | Admin | Image upload (multipart) |
| PATCH | /admin/products/{id}/status | Admin | Active/Inactive |
| CRUD | /admin/categories, /admin/variants, /admin/banners, /admin/coupons, /admin/wedding-packages | Admin | Master management |

### 14.3 Cart aur Checkout

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | /cart | Customer/Guest | Current cart |
| POST | /cart/items | Customer/Guest | Add item |
| PUT | /cart/items/{id} | Customer/Guest | Quantity change |
| DELETE | /cart/items/{id} | Customer/Guest | Remove |
| POST | /cart/coupon | Customer/Guest | Apply coupon |
| POST | /checkout/summary | Customer/Guest | Totals, GST, delivery charge |
| POST | /orders | Customer/Guest | Place order |
| POST | /payments/create | Customer | Gateway order create |
| POST | /payments/verify | Customer | Signature verify |
| POST | /payments/webhook | Gateway | Razorpay webhook (signature checked) |

### 14.4 Orders

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | /me/orders | Customer | My orders |
| GET | /orders/{id} | Owner/Staff | Order detail with timeline |
| GET | /orders/track/{orderNumber} | Public (with mobile OTP) | Tracking page |
| POST | /orders/{id}/cancel | Customer/Admin | Cancel with reason |
| GET | /admin/orders | Admin/Staff | List aur filters (status, date, type) |
| PATCH | /admin/orders/{id}/status | Admin/Staff | Status change |
| POST | /admin/orders/{id}/assign-delivery | Admin | Delivery partner assign |
| GET | /orders/{id}/invoice | Owner/Admin | PDF download |
| POST | /admin/orders/manual | Admin | Phone/offline order entry |

### 14.5 Wedding Booking

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | /bookings/availability?month= | Public | Date wise capacity |
| POST | /bookings/enquiry | Customer | Enquiry/booking request |
| GET | /me/bookings | Customer | My bookings |
| GET | /bookings/{id} | Owner/Admin | Detail |
| POST | /bookings/{id}/quotes/{quoteId}/accept | Customer | Quote accept |
| POST | /bookings/{id}/pay-advance | Customer | Advance payment |
| GET | /admin/bookings | Admin | List aur calendar view |
| POST | /admin/bookings/{id}/quote | Admin | Quote banana/bhejna |
| PATCH | /admin/bookings/{id}/status | Admin | Status change |
| PUT | /admin/capacity/{date} | Admin | Capacity set/block |

### 14.6 Inventory aur Production

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| CRUD | /admin/suppliers, /admin/raw-materials | Admin/Staff | Masters |
| POST | /admin/purchase-orders | Admin/Staff | PO create |
| POST | /admin/purchase-orders/{id}/receive | Staff | Goods receipt aur stock in |
| GET | /admin/stock/raw | Admin/Staff | Raw stock aur low stock alerts |
| GET | /admin/stock/finished | Admin/Staff | Finished goods stock |
| CRUD | /admin/recipes | Admin | Recipe/BOM |
| POST | /admin/production/batches | Staff | Batch plan |
| POST | /admin/production/batches/{id}/start | Staff | Raw material auto deduct |
| POST | /admin/production/batches/{id}/complete | Staff | Produced and wastage qty, finished stock add |

### 14.7 Hawker

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| CRUD | /admin/hawkers | Admin | Hawker management |
| POST | /admin/hawkers/{id}/issue-stock | Admin/Staff | Daily stock issue |
| POST | /hawker/sales | Hawker | Sale entry |
| POST | /admin/hawkers/{id}/settle | Admin/Staff | Return aur payment reconcile |
| GET | /hawker/me/stock | Hawker | My stock today |
| GET | /hawker/me/ledger | Hawker | Ledger aur outstanding |

### 14.8 Delivery

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | /delivery/me/tasks | Delivery | Assigned deliveries |
| PATCH | /delivery/{id}/status | Delivery | PickedUp, OnTheWay, Delivered, Failed |
| POST | /delivery/{id}/location | Delivery | GPS point (batched) |
| POST | /delivery/{id}/verify-otp | Delivery | Customer OTP se proof |
| POST | /delivery/{id}/proof-photo | Delivery | Photo upload |

### 14.9 Dashboard, Reports aur Super Admin

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | /dashboard/admin/summary | Admin | KPI cards |
| GET | /dashboard/admin/sales-trend?range= | Admin | Line chart data |
| GET | /dashboard/admin/top-products | Admin | Bar chart data |
| GET | /dashboard/admin/category-share | Admin | Pie chart data |
| GET | /dashboard/admin/delivery-board | Admin | Live delivery status |
| GET | /reports/sales, /reports/stock, /reports/hawker, /reports/production | Admin | With Excel/PDF export |
| CRUD | /superadmin/users, /superadmin/roles, /superadmin/permissions | SuperAdmin | User aur role management |
| GET | /superadmin/audit-logs | SuperAdmin | Audit trail |
| GET/PUT | /superadmin/settings | SuperAdmin | Global settings |

### 14.10 SignalR Hubs

| Hub | Events |
| --- | --- |
| /hubs/orders | OrderCreated, OrderStatusChanged (groups: order-{id}, admins) |
| /hubs/delivery | LocationUpdated, DeliveryStatusChanged (group: delivery-{id}) |
| /hubs/notifications | NewNotification (group: user-{id}) |

---

## 15. Business Rules (कोड लिखने से पहले ये तय हों)

- **Order status flow**: Placed, Confirmed, InProduction, Packed, OutForDelivery, Delivered. Cancel सिर्फ Packed से पहले। Backward status change सिर्फ Admin के लिए remark के साथ।
- **Stock**: Order confirm पर finished stock reserve, deliver पर deduct, cancel पर release।
- **Production**: Batch start पर recipe के हिसाब से raw material automatic deduct; stock कम हो तो batch start block।
- **Wedding booking**: Event date से कम से कम 7 दिन पहले booking; advance कम से कम 30 percent confirm होने के लिए; DailyCapacity से ज्यादा booking नहीं। (ये आंकड़े आप अपने business के हिसाब से बदल सकते हैं)
- **Cancellation refund**: Event से 48 घंटे पहले तक advance refund पूरा/आंशिक, बाद में नहीं (policy business decide करेगा)।
- **Hawker**: Credit limit से ज्यादा outstanding हो तो नया stock issue block। Daily settlement में issued = sold + returned + damaged मिलना चाहिए।
- **Delivery**: Delivered mark करने के लिए customer OTP या photo proof ज़रूरी।
- **GST**: Product wise GST percent, invoice में CGST/SGST या IGST split state के हिसाब से।
- **Order number format**: ICE-YYYY-000001 (yearly sequence). Booking: BKG-YYYY-000001.

---

## 16. Frontend Pages aur Routes (Next.js App Router)

### 16.1 Public aur Customer

| Route | Page | Key UI |
| --- | --- | --- |
| / | Home | Hero carousel (Swiper), offer banners, featured products slider, categories grid, wedding CTA, testimonials |
| /products | Product listing | Filter sidebar, search, sort, grid/list toggle, infinite scroll ya pagination, skeleton loader |
| /products/\[slug\] | Product detail | Image gallery slider with zoom, variant selector, price, add to cart, reviews, related products |
| /cart | Cart | Items, quantity, coupon, price summary |
| /checkout | Checkout | Address, delivery slot, payment (Razorpay), order summary |
| /order-success/\[id\] | Confirmation | Order number, tracking link |
| /track/\[orderNumber\] | Live tracking | Status timeline, live map, delivery partner info |
| /wedding | Wedding landing | Packages, gallery, how it works |
| /wedding/book | Booking form (stepper) | Step 1 date + calendar availability, Step 2 guests + venue, Step 3 package/flavours, Step 4 review + advance pay |
| /login, /register | Auth | Password + OTP login |
| /account/profile, /account/addresses | Account | Profile, address book |
| /account/orders, /account/orders/\[id\] | Orders | History, invoice, reorder |
| /account/bookings, /account/bookings/\[id\] | Bookings | Status, quote accept, balance pay |
| /about, /contact, /faq | Static | Content pages |

### 16.2 Admin Panel (/admin)

| Route | Page | Roles |
| --- | --- | --- |
| /admin/dashboard | KPI cards, sales line chart, top products bar, category pie, live delivery board | Admin, SuperAdmin |
| /admin/orders, /admin/orders/\[id\] | Order table with filters, detail, status change, assign delivery | Admin, Staff |
| /admin/orders/new | Manual order entry | Admin |
| /admin/bookings, /admin/bookings/calendar | Booking list aur calendar | Admin |
| /admin/bookings/\[id\] | Quote builder aur status | Admin |
| /admin/products, /admin/products/new, /admin/products/\[id\] | Product CRUD, variants, image uploader (drag drop, reorder) | Admin |
| /admin/categories, /admin/banners, /admin/coupons, /admin/packages | Masters | Admin |
| /admin/inventory/raw, /admin/inventory/finished | Stock tables with alerts | Admin, Staff |
| /admin/purchase-orders | PO list, create, receive | Admin, Staff |
| /admin/recipes | Recipe builder | Admin |
| /admin/production | Batch board (planned, running, completed) | Admin, Staff |
| /admin/hawkers, /admin/hawkers/\[id\] | Hawker list, stock issue, settlement, ledger | Admin, Staff |
| /admin/deliveries | Live map of all partners aur status board | Admin |
| /admin/reports | Sales, stock, hawker, production with export | Admin |
| /admin/customers | Customer list aur history | Admin |
| /admin/staff | Staff management | Admin |
| /superadmin/users, /roles, /audit-logs, /settings | System control | SuperAdmin |

### 16.3 Hawker aur Delivery (mobile first)

| Route | Page |
| --- | --- |
| /hawker/home | Today's stock, quick sale entry, amount due |
| /hawker/sales | Sales history aur new sale |
| /hawker/ledger | Ledger |
| /delivery/tasks | Assigned deliveries list |
| /delivery/tasks/\[id\] | Navigate button, status buttons, OTP, photo proof, location sharing on |

---

## 17. Project Folder Structure

### 17.1 Backend (.NET 10)

```
IceCream.sln
  src/
    IceCream.Domain/            Entities, Enums, ValueObjects, DomainEvents
    IceCream.Application/       Features/ (Orders, Bookings, Products, ...) -> Commands, Queries, Handlers, Validators, DTOs
                                Common/ (Interfaces, Behaviours, Mappings, Exceptions)
    IceCream.Infrastructure/    Persistence/ (DbContext, Configurations, Migrations, Repositories)
                                Identity/, Payments/, Notifications/, Storage/, Maps/, Jobs/
    IceCream.Api/               Controllers/, Hubs/, Middleware/, Filters/, Program.cs, appsettings.*.json
  tests/
    IceCream.UnitTests/
    IceCream.IntegrationTests/
```

### 17.2 Frontend (Next.js)

```
frontend/
  src/
    app/                (public)/, (customer)/, admin/, superadmin/, hawker/, delivery/
    features/           products/, cart/, orders/, bookings/, inventory/, production/, hawkers/, deliveries/, dashboard/, auth/
                        (each: api.ts (RTK Query), slice.ts, components/, types.ts, schemas.ts)
    components/         ui/, layout/, charts/, carousel/, tables/, forms/
    store/              store.ts, rootReducer, middleware
    lib/                axios/fetch client, signalr.ts, auth helpers, formatters
    hooks/              useAuth, useDebounce, useSignalR
    styles/
  public/
  tests/ (unit + e2e)
```

---

## 18. Key Technical Decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Architecture | Modular monolith (Clean Architecture), microservices नहीं | Simple deploy, छोटी team, बाद में split आसान |
| ORM | EF Core for writes, Dapper for dashboard/report queries | Speed aur productivity dono |
| Frontend | Next.js + Redux Toolkit + RTK Query | SEO for products, caching, simple state |
| UI | Tailwind CSS + shadcn/ui ya MUI | Fast, consistent design |
| Auth | JWT access (15 min) + refresh token (7 days, httpOnly cookie) | Secure aur scalable |
| Realtime | SignalR with Redis backplane | Scale-out ready |
| Maps | Google Maps (live tracking) | Reliable |
| Hosting | Docker on Azure App Service/VM ya AWS | Fast setup |

---

## 19. Coding Standards aur Definition of Done

- Naming: C# PascalCase, React components PascalCase, files kebab-case
- Branching: main, develop, feature/\*; PR review mandatory, squash merge
- Commits: conventional commits (feat, fix, chore)
- API: DTOs only (entities expose नहीं), FluentValidation हर command पर
- No secrets in repo; appsettings per environment
- **Definition of Done**: code reviewed, unit tests pass (coverage 70 percent+ on business logic), API Swagger documented, no console errors, responsive checked, logs aur error handling added

---

## 20. Sprint 1 Task Breakdown (Weeks 1-3)

- [ ] Backend solution create (4 projects), NuGet packages, Serilog, Swagger
- [ ] SQL Server DB, EF Core DbContext, base entity, first migration
- [ ] Identity: Users, Roles, JWT login, refresh token, role policies
- [ ] Seed data: SuperAdmin user, roles, permissions, sample categories
- [ ] Global exception middleware, validation pipeline, response wrapper
- [ ] Catalog APIs: category, product, variant, image upload
- [ ] Next.js setup, Tailwind, Redux Toolkit store, RTK Query base client
- [ ] Login/register pages, auth guard, role based layout
- [ ] Admin layout (sidebar, header) aur product list/create/edit pages
- [ ] Docker compose (api, web, sqlserver, redis), GitHub Actions build pipeline

---

## 21. Open Questions (आपसे चाहिए)

- [ ] Branches/multiple factory locations होंगे या एक ही?
- [ ] Delivery charge rule (distance, flat, free above amount)?
- [ ] Wedding booking: minimum advance percent, cancellation policy, capacity (litres per day)?
- [ ] Hawker commission: flat percent ya product wise?
- [ ] Payment gateway: Razorpay final या कोई और?
- [ ] WhatsApp notifications ज़रूरी हैं या सिर्फ SMS/Email?
- [ ] Hosting: Azure, AWS या on-premise server?
- [ ] Languages: केवल English या Hindi UI भी?

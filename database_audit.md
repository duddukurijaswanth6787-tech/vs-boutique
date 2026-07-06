# Database Audit Report

**Project:** VS Boutique  
**Date:** 2 July 2026  
**Auditor:** Automated Audit / Laptop Migration

---

## 1. Migration Destination Database (Office Laptop)

| Property | Value |
|---|---|
| **Database Type** | PostgreSQL (managed via pgAdmin 4) |
| **Host** | `localhost` |
| **Port** | `5432` |
| **Database Name** | `vs_boutique` |
| **SSL Mode** | Disabled (not required for local environment) |
| **Default User** | `postgres` |

---

## 2. ORM Used

| Property | Value |
|---|---|
| **ORM** | Prisma ORM |
| **Prisma Version** | `^6.19.3` (@prisma/client + prisma) |
| **Generator** | `prisma-client-js` |
| **Datasource Provider** | `postgresql` |
| **Additional DB Driver** | `pg` (^8.21.0) — available for direct SQL queries |

---

## 3. Total Models/Tables — 173 Models (with CMS & Operating System additions)

Includes core business, commerce, CMS engines, AI Agent Operating System, validation, and developer platform schema models.

| # | Model Name | Table Name | Description |
|---|---|---|---|
| 1 | `User` | `users` | Customer users |
| 2 | `Boutique` | `boutiques` | Boutique stores |
| 3 | `Owner` | `owners` | Boutique owners & admins |
| 4 | `Design` | `designs` | Tailoring designs |
| 5 | `Order` | `orders` | Tailoring orders |
| 6 | `OrderHistory` | `order_histories` | Order status history |
| 7 | `Booking` | `bookings` | Appointments |
| 8 | `Measurement` | `measurements` | Customer body measurements |
| 9 | `Notification` | `notifications` | Notifications to owners/users |
| 10 | `Payment` | `payments` | Tailoring payments |
| 11 | `Activity` | `activities` | Activity feed |
| 12 | `AuditLog` | `audit_logs` | Change tracking |
| 13 | `CustomerAddress` | `customer_addresses` | Customer saved addresses |
| 14 | `Payout` | `payouts` | Owner payouts |
| 15 | `Review` | `reviews` | Boutique reviews |
| 16 | `Wishlist` | `wishlists` | Design wishlists |
| 17 | `BookingHistory` | `booking_histories` | Booking status history |
| 18 | `SupportTicket` | `support_tickets` | Support tickets |
| 19 | `SupportTicketMessage` | `support_ticket_messages` | Ticket messages |
| 20 | `SupportTicketAdminNote` | `support_ticket_admin_notes` | Admin notes on tickets |
| 21 | `NotificationTemplate` | `notification_templates` | Notification templates |
| 22 | `NotificationCampaign` | `notification_campaigns` | Broadcast campaigns |
| 23 | `PlatformSetting` | `PlatformSetting` | Global platform config |
| 24 | `SubscriptionPlan` | `subscription_plans` | Plans |
| 25 | `BoutiqueSubscription` | `boutique_subscriptions` | Boutique subscriptions |
| 26 | `SubscriptionBillingHistory` | `subscription_billing_history` | Schema model representing subscription billing history |
| 27 | `Category` | `categories` | Product categories |
| 28 | `SubCategory` | `sub_categories` | Product subcategories |
| 29 | `NotificationReceipt` | `notification_receipts` | Delivery receipts |
| 30 | `OwnerFeaturePermission` | `owner_feature_permissions` | Owner permission overrides |
| 31 | `CustomPlanRequest` | `custom_plan_requests` | Custom plan requests |
| 32 | `ProductBrand` | `product_brands` | Product brands |
| 33 | `ProductTag` | `product_tags` | Product tags |
| 34 | `Product` | `products` | Ready-made products |
| 35 | `ProductImage` | `product_images` | Product images |
| 36 | `ProductVariantAttribute` | `product_variant_attributes` | Variant attributes |
| 37 | `ProductVariant` | `product_variants` | Product variants |
| 38 | `ProductInventory` | `product_inventory` | Stock levels |
| 39 | `ProductInventoryLog` | `product_inventory_logs` | Inventory changes |
| 40 | `ProductAnalytics` | `product_analytics` | Product analytics |
| 41 | `ProductWishlist` | `product_wishlists` | Product wishlists |
| 42 | `Cart` | `carts` | Shopping carts |
| 43 | `CartItem` | `cart_items` | Cart line items |
| 44 | `ShippingAddress` | `shipping_addresses` | Shipping addresses |
| 45 | `CommerceOrder` | `commerce_orders` | Direct selling orders |
| 46 | `CommerceOrderItem` | `commerce_order_items` | Order line items |
| 47 | `CommerceOrderHistory` | `commerce_order_histories` | Order history |
| 48 | `Coupon` | `coupons` | Discount coupons |
| 49 | `ProductReview` | `product_reviews` | Product reviews |
| 50 | `DeliveryTracking` | `delivery_tracking` | Delivery tracking |
| 51 | `DeliveryTrackingHistory` | `delivery_tracking_history` | Delivery status history |
| 52 | `CommercePayment` | `commerce_payments` | Commerce payments |
| 53 | `CouponUsage` | `coupon_usages` | Coupon usage tracking |
| 54 | `ReturnRequest` | `return_requests` | Return requests |
| 55 | `ExchangeRequest` | `exchange_requests` | Exchange requests |
| 56 | `OrderSequence` | `order_sequences` | Order ID sequence |
| 57 | `CustomerNotification` | `customer_notifications` | Customer notifications |
| 58 | `AdminNotification` | `admin_notifications` | Admin notifications |
| 59 | `ProductToProductTag` | `_ProductToProductTag` | Schema model representing product to product tag |
| 60 | `AIKnowledgeBase` | `AIKnowledgeBase` | Platform AI knowledge bases |
| 61 | `AIContext` | `AIContext` | AI conversation context documents |
| 62 | `AIConversation` | `AIConversation` | Active AI assistant conversation threads |
| 63 | `AIArtifact` | `AIArtifact` | Generated code and report artifacts |
| 64 | `AITool` | `AITool` | Registered tools for AI execution |
| 65 | `ApprovalRequest` | `ApprovalRequest` | Admin approval workflow requests |
| 66 | `ApprovalHistory` | `ApprovalHistory` | Audit logs of admin approval decisions |
| 67 | `AICacheRecord` | `AICacheRecord` | Cached LLM responses and embeddings |
| 68 | `AIAgent` | `AIAgent` | Core platform AI agent definitions |
| 69 | `PromptTemplate` | `PromptTemplate` | Platform generic prompt templates |
| 70 | `PromptHistory` | `PromptHistory` | History of platform prompt usage |
| 71 | `AISession` | `AISession` | Active AI execution session logs |
| 72 | `AIExecution` | `AIExecution` | Running AI task executions |
| 73 | `AIExecutionLog` | `AIExecutionLog` | Detailed console/execution logs for AI runs |
| 74 | `Tenant` | `tenants` | Multi-tenant database configuration |
| 75 | `Business` | `businesses` | Tailoring businesses / boutique organizations |
| 76 | `Website` | `websites` | Boutique online storefront instances |
| 77 | `MobileApp` | `mobile_apps` | Boutique mobile application configurations |
| 78 | `UniversalContent` | `UniversalContent` | Boutique custom contents and copy keys |
| 79 | `ContentTranslation` | `content_translations` | Localized copy key translations |
| 80 | `AssetLibrary` | `AssetLibrary` | Uploaded media and file asset libraries |
| 81 | `AIAgentRegistry` | `AIAgentRegistry` | Central repository of active AI agents |
| 82 | `WorkflowDefinition` | `workflow_definitions` | Core platform workflow definitions |
| 83 | `WorkflowStage` | `workflow_stages` | Platform workflow execution stages |
| 84 | `WorkflowTask` | `workflow_tasks` | Platform workflow tasks |
| 85 | `WorkflowExecution` | `workflow_executions` | Running platform workflow executions |
| 86 | `BoutiqueTheme` | `boutique_themes` | Boutique styling theme configurations |
| 87 | `BoutiquePage` | `boutique_pages` | Custom builder page layouts |
| 88 | `PageComponentNode` | `page_component_nodes` | Component tree structures and styling tokens |
| 89 | `BoutiquePlugin` | `boutique_plugins` | Boutique custom feature plugins |
| 90 | `UserRoleMapping` | `user_role_mappings` | User role permission mappings |
| 91 | `ImmutableRelease` | `immutable_releases` | Immutable backup snapshots of website releases |
| 92 | `AILearningRecord` | `ai_learning_records` | AI agent self-correction learning logs |
| 93 | `CertificationWorkflowDefinition` | `certification_workflow_definitions` | QA certification workflow step definitions |
| 94 | `CertificationWorkflow` | `certification_workflows` | Running QA certification workflow instances |
| 95 | `QAAgentRegistry` | `qa_agent_registries` | Registered QA agent auditors |
| 96 | `CertificationProfile` | `CertificationProfile` | QA compliance certification thresholds |
| 97 | `BoutiqueCertification` | `BoutiqueCertification` | Boutique certification report compliance results |
| 98 | `AutoFixQueueItem` | `autofix_queue_items` | QA Auto-Fix queue optimization tasks |
| 99 | `CertificationChat` | `certification_chat_messages` | Conversational chat logs for certification reports |
| 100 | `MarketplacePublisher` | `marketplace_publishers` | Registered package publishers on the marketplace |
| 101 | `MarketplacePackage` | `marketplace_packages` | Tailoring themes and plugins marketplace packages |
| 102 | `MarketplaceVersion` | `marketplace_versions` | Marketplace package versions |
| 103 | `MarketplaceCapability` | `marketplace_capabilities` | Required system capabilities for packages |
| 104 | `MarketplaceDependency` | `marketplace_dependencies` | Inter-package dependency constraints |
| 105 | `MarketplaceInstallation` | `marketplace_installations` | Installed marketplace packages on boutique stores |
| 106 | `MarketplaceLicense` | `marketplace_licenses` | Purchase licenses and active subscription tiers |
| 107 | `MarketplaceReview` | `marketplace_reviews` | Reviews and feedback on marketplace packages |
| 108 | `CmsStandard` | `cms_standards` | Schema model representing cms standard |
| 109 | `CmsStandardVersion` | `cms_standard_versions` | Schema model representing cms standard version |
| 110 | `CmsBlueprintTemplate` | `cms_blueprint_templates` | Blueprint catalog presets |
| 111 | `CmsBlueprintTemplateVersion` | `cms_blueprint_template_versions` | Schema model representing cms blueprint template version |
| 112 | `CmsBuilderProfile` | `cms_builder_profiles` | Schema model representing cms builder profile |
| 113 | `CmsBuilderProfileVersion` | `cms_builder_profile_versions` | Schema model representing cms builder profile version |
| 114 | `CmsStandardAuditLog` | `cms_standard_audit_logs` | Audit tracking logs |
| 115 | `CmsRequirement` | `cms_requirements` | Requirements checks |
| 116 | `CmsRequirementVersion` | `cms_requirement_versions` | History snapshots |
| 117 | `CmsRequirementRelation` | `cms_requirement_relations` | Schema model representing cms requirement relation |
| 118 | `CmsRequirementTemplate` | `cms_requirement_templates` | Schema model representing cms requirement template |
| 119 | `CmsTemplateRequirementJoin` | `cms_template_requirement_joins` | Schema model representing cms template requirement join |
| 120 | `CmsBlueprintPage` | `cms_blueprint_pages` | Schema model representing cms blueprint page |
| 121 | `CmsBlueprintComponent` | `cms_blueprint_components` | Schema model representing cms blueprint component |
| 122 | `CmsBlueprintApi` | `cms_blueprint_apis` | Schema model representing cms blueprint api |
| 123 | `CmsBlueprintFeature` | `cms_blueprint_features` | Schema model representing cms blueprint feature |
| 124 | `DeploymentEnvironment` | `deployment_environments` | Schema model representing deployment environment |
| 125 | `Deployment` | `deployments` | Schema model representing deployment |
| 126 | `DeploymentBuildLog` | `deployment_build_logs` | Schema model representing deployment build log |
| 127 | `DeploymentArtifact` | `deployment_artifacts` | Schema model representing deployment artifact |
| 128 | `DeploymentDomain` | `deployment_domains` | Schema model representing deployment domain |
| 129 | `DeploymentEnvironmentVariable` | `deployment_environment_variables` | Schema model representing deployment environment variable |
| 130 | `DeploymentVariableHistory` | `deployment_variable_histories` | Schema model representing deployment variable history |
| 131 | `CmsUpload` | `cms_uploads` | Uploaded website ZIP archives and sandboxed extraction metadata |
| 132 | `CmsAiBuilder` | `cms_ai_builders` | AI Builder configuration profile definitions |
| 133 | `CmsPromptCategory` | `cms_prompt_categories` | Categories for AI prompt templates |
| 134 | `CmsPromptTag` | `cms_prompt_tags` | Tags for prompt organization |
| 135 | `CmsPromptTagPrompt` | `cms_prompt_tag_prompts` | Join table for prompts and tags |
| 136 | `CmsPrompt` | `cms_prompts` | Core prompt template and generation instructions |
| 137 | `CmsPromptVersion` | `cms_prompt_versions` | Historical snapshots and versions of prompt templates |
| 138 | `CmsPromptVariable` | `cms_prompt_variables` | Configurable variables inside a prompt template |
| 139 | `CmsPromptExecution` | `cms_prompt_executions` | Execution logs of rendered prompts against AI engines |
| 140 | `CmsPromptFavorite` | `cms_prompt_favorites` | User favorite prompt selections |
| 141 | `CmsPromptHistory` | `cms_prompt_histories` | Change logs and audit history of prompt templates |
| 142 | `CmsPromptCollection` | `cms_prompt_collections` | Curated groups/collections of prompt templates |
| 143 | `CmsPromptCollectionItem` | `cms_prompt_collection_items` | Individual prompt items inside a collection |
| 144 | `CmsPromptRating` | `cms_prompt_ratings` | User ratings and comments on prompt templates |
| 145 | `CmsPromptUsageAnalytics` | `cms_prompt_usage_analytics` | Analytics and usage counters for prompts |
| 146 | `CmsPromptAuditLog` | `cms_prompt_audit_logs` | Detailed property change audit logs for prompts |
| 147 | `CmsTemplate` | `cms_templates` | CMS template definition metadata and layouts |
| 148 | `CmsTemplateCategory` | `cms_template_categories` | Classification categories for CMS templates |
| 149 | `CmsTemplateTag` | `cms_template_tags` | Search tags for templates |
| 150 | `CmsTemplateTagTemplate` | `cms_template_tag_template` | Join table for templates and tags |
| 151 | `CmsTemplateVersion` | `cms_template_versions` | Release versions and zip artifact assets of templates |
| 152 | `CmsTemplateFavorite` | `cms_template_favorites` | User favorite template mappings |
| 153 | `CmsTemplateRating` | `cms_template_ratings` | User ratings and feedback on templates |
| 154 | `CmsTemplateAnalytics` | `cms_template_analytics` | View/download/assignment action counters for templates |
| 155 | `CmsTemplatePipelineStage` | `cms_template_pipeline_stages` | Build and verification pipeline status for templates |
| 156 | `CmsTemplateBuilderCompatibility` | `cms_template_builder_compat` | Supported builders (Claude, Cursor, Bolt) compatibility matrix |
| 157 | `BusinessTemplateAssignment` | `business_template_assignments` | Enterprise business assignment mapping to templates |
| 158 | `CmsAssignmentConfiguration` | `cms_assignment_configurations` | CMS template assignment business configuration |
| 159 | `CmsAssignmentHistory` | `cms_assignment_histories` | Audit history of CMS template assignments |
| 160 | `CmsValidationReport` | `cms_validation_reports` | Compiled layout validation and certification report |
| 161 | `CmsValidationReportSection` | `CmsValidationReportSection` | Sub-section scores and issues for a validation report |
| 162 | `CmsValidationReportComparison` | `cms_validation_report_comparisons` | Comparison diff analysis between two validation reports |
| 163 | `CmsValidationReportExport` | `cms_validation_report_exports` | Export jobs and downloadable files for validation reports |
| 164 | `CmsValidationReportAnalytics` | `CmsValidationReportAnalytics` | Aggregated analytics and compliance trends over time |
| 165 | `CmsValidationReportHistory` | `CmsValidationReportHistory` | State and status history of validation reports |
| 166 | `CmsAiProvider` | `CmsAiProvider` | Registered AI service providers and keys (Gemini, Claude, OpenAI, etc.) |
| 167 | `CmsAiAgent` | `CmsAiAgent` | Configured AI assistant agents and system prompt templates |
| 168 | `CmsAiWorkflow` | `CmsAiWorkflow` | Multi-stage AI pipeline workflow execution configurations |
| 169 | `CmsAiExecutionStep` | `cms_ai_execution_steps` | Individual step execution log inside an AI workflow |
| 170 | `CmsAiUsage` | `cms_ai_usage` | Token usage metrics and tracking logs for AI services |
| 171 | `CmsAiCost` | `cms_ai_costs` | Cost tracking and accounting logs for AI executions |
| 172 | `CmsAiSettings` | `cms_ai_settings` | Global AI operating system configuration settings |
| 173 | `DeveloperApiKey` | `DeveloperApiKey` | Developer API keys and access scopes for third-party clients |

---

## 4. Connection String (Office Laptop Target)

Configure your local credentials in `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/vs_boutique?schema=public"
```

---

## 5. Risks of Migration & Remediation

* **UUID Generation Extension:**
  * *Risk:* The schema requires the `uuid-ossp` extension to auto-generate primary keys.
  * *Remediation:* Make sure the local PostgreSQL has `uuid-ossp` loaded using `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` prior to running migrations.
* **SSL Settings:**
  * *Risk:* Server startup might crash if connection string enforces SSL.
  * *Remediation:* Remove `sslmode=require` from local DATABASE_URL connection configs.

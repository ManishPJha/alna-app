-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('VIEW', 'ADD_TO_ORDER', 'CUSTOMIZE', 'QUESTION');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED');

-- CreateEnum
CREATE TYPE "public"."AnswerSource" AS ENUM ('FAQ', 'AI', 'MANUAL');

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "accessTokenExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationRequest" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'es',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "logoUrl" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT '#2563eb',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."managers" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'MANAGER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."qr_codes" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "tableNumber" TEXT,
    "qrToken" TEXT NOT NULL,
    "qrImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "lastScanned" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_categories" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_items" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "preparationTime" INTEGER,
    "calories" INTEGER,
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "isSpicy" BOOLEAN NOT NULL DEFAULT false,
    "spiceLevel" INTEGER NOT NULL DEFAULT 0,
    "isBestseller" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customization_groups" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "maxSelections" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customization_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customization_options" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceModifier" DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customization_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_item_customizations" (
    "menuItemId" TEXT NOT NULL,
    "customizationGroupId" TEXT NOT NULL,

    CONSTRAINT "menu_item_customizations_pkey" PRIMARY KEY ("menuItemId","customizationGroupId")
);

-- CreateTable
CREATE TABLE "public"."allergens" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_item_allergens" (
    "menuItemId" TEXT NOT NULL,
    "allergenId" TEXT NOT NULL,

    CONSTRAINT "menu_item_allergens_pkey" PRIMARY KEY ("menuItemId","allergenId")
);

-- CreateTable
CREATE TABLE "public"."ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isAllergen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_item_ingredients" (
    "menuItemId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "isRemovable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_item_ingredients_pkey" PRIMARY KEY ("menuItemId","ingredientId")
);

-- CreateTable
CREATE TABLE "public"."translations" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."faqs" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_questions" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "qrCodeId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "languageCode" TEXT NOT NULL,
    "isAnswered" BOOLEAN NOT NULL DEFAULT false,
    "answerSource" "public"."AnswerSource" NOT NULL DEFAULT 'FAQ',
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "customer_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_sessions" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "qrCodeId" TEXT,
    "sessionToken" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL,
    "customerIp" INET,
    "userAgent" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "sessionId" TEXT,
    "qrCodeId" TEXT,
    "customerLanguage" TEXT NOT NULL,
    "originalLanguage" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "specialRequests" TEXT,
    "translatedSpecialRequests" TEXT,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "specialInstructions" TEXT,
    "translatedInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_item_customizations" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "customizationOptionId" TEXT NOT NULL,
    "priceModifier" DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_customizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_analytics" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "qrCodeId" TEXT,
    "eventType" "public"."EventType" NOT NULL,
    "languageCode" TEXT,
    "sessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."language_usage" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "language_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_providerId_providerAccountId_key" ON "public"."accounts"("providerId", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_accessToken_key" ON "public"."sessions"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRequest_token_key" ON "public"."VerificationRequest"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRequest_identifier_token_key" ON "public"."VerificationRequest"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "managers_email_key" ON "public"."managers"("email");

-- CreateIndex
CREATE INDEX "idx_managers_restaurant_id" ON "public"."managers"("restaurantId");

-- CreateIndex
CREATE INDEX "idx_managers_email" ON "public"."managers"("email");

-- CreateIndex
CREATE INDEX "idx_managers_user_id" ON "public"."managers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_qrToken_key" ON "public"."qr_codes"("qrToken");

-- CreateIndex
CREATE INDEX "idx_qr_codes_restaurant_id" ON "public"."qr_codes"("restaurantId");

-- CreateIndex
CREATE INDEX "idx_qr_codes_token" ON "public"."qr_codes"("qrToken");

-- CreateIndex
CREATE INDEX "idx_qr_codes_active" ON "public"."qr_codes"("isActive");

-- CreateIndex
CREATE INDEX "idx_menu_categories_restaurant_id" ON "public"."menu_categories"("restaurantId");

-- CreateIndex
CREATE INDEX "idx_menu_items_restaurant_id" ON "public"."menu_items"("restaurantId");

-- CreateIndex
CREATE INDEX "idx_menu_items_category_id" ON "public"."menu_items"("categoryId");

-- CreateIndex
CREATE INDEX "idx_menu_items_available" ON "public"."menu_items"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "allergens_name_key" ON "public"."allergens"("name");

-- CreateIndex
CREATE INDEX "idx_translations_entity" ON "public"."translations"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "idx_translations_language" ON "public"."translations"("languageCode");

-- CreateIndex
CREATE INDEX "idx_translations_lookup" ON "public"."translations"("entityType", "entityId", "fieldName", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "translations_entityType_entityId_fieldName_languageCode_key" ON "public"."translations"("entityType", "entityId", "fieldName", "languageCode");

-- CreateIndex
CREATE INDEX "idx_faqs_restaurant_id" ON "public"."faqs"("restaurantId");

-- CreateIndex
CREATE INDEX "idx_faqs_active" ON "public"."faqs"("isActive");

-- CreateIndex
CREATE INDEX "idx_customer_questions_restaurant_id" ON "public"."customer_questions"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_sessions_sessionToken_key" ON "public"."customer_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "idx_customer_sessions_restaurant_id" ON "public"."customer_sessions"("restaurantId");

-- CreateIndex
CREATE INDEX "idx_customer_sessions_token" ON "public"."customer_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "idx_orders_restaurant_id" ON "public"."orders"("restaurantId");

-- CreateIndex
CREATE INDEX "idx_orders_session_id" ON "public"."orders"("sessionId");

-- CreateIndex
CREATE INDEX "idx_order_items_order_id" ON "public"."order_items"("orderId");

-- CreateIndex
CREATE INDEX "idx_menu_analytics_restaurant_id" ON "public"."menu_analytics"("restaurantId");

-- CreateIndex
CREATE INDEX "idx_menu_analytics_created_at" ON "public"."menu_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "idx_language_usage_restaurant_id" ON "public"."language_usage"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "language_usage_restaurantId_languageCode_key" ON "public"."language_usage"("restaurantId", "languageCode");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."managers" ADD CONSTRAINT "managers_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."managers" ADD CONSTRAINT "managers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."qr_codes" ADD CONSTRAINT "qr_codes_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_categories" ADD CONSTRAINT "menu_categories_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_items" ADD CONSTRAINT "menu_items_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_items" ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."menu_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customization_groups" ADD CONSTRAINT "customization_groups_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customization_options" ADD CONSTRAINT "customization_options_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."customization_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_customizations" ADD CONSTRAINT "menu_item_customizations_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_customizations" ADD CONSTRAINT "menu_item_customizations_customizationGroupId_fkey" FOREIGN KEY ("customizationGroupId") REFERENCES "public"."customization_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_allergens" ADD CONSTRAINT "menu_item_allergens_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_allergens" ADD CONSTRAINT "menu_item_allergens_allergenId_fkey" FOREIGN KEY ("allergenId") REFERENCES "public"."allergens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_ingredients" ADD CONSTRAINT "menu_item_ingredients_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_ingredients" ADD CONSTRAINT "menu_item_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "public"."ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."faqs" ADD CONSTRAINT "faqs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_questions" ADD CONSTRAINT "customer_questions_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_questions" ADD CONSTRAINT "customer_questions_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "public"."qr_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_questions" ADD CONSTRAINT "customer_questions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."customer_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_sessions" ADD CONSTRAINT "customer_sessions_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_sessions" ADD CONSTRAINT "customer_sessions_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "public"."qr_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."customer_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "public"."qr_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item_customizations" ADD CONSTRAINT "order_item_customizations_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item_customizations" ADD CONSTRAINT "order_item_customizations_customizationOptionId_fkey" FOREIGN KEY ("customizationOptionId") REFERENCES "public"."customization_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_analytics" ADD CONSTRAINT "menu_analytics_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_analytics" ADD CONSTRAINT "menu_analytics_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_analytics" ADD CONSTRAINT "menu_analytics_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "public"."qr_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."language_usage" ADD CONSTRAINT "language_usage_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

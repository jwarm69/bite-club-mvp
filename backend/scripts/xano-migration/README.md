# Xano to Supabase Migration Tool

This migration tool transfers your existing Xano database to your Bite Club Supabase/PostgreSQL database while preserving data integrity and relationships.

## Overview

The migration process handles:
- **Users** (Students and Restaurant accounts)
- **Restaurants** (Extracted from menu items)
- **Menu Items** with categories and pricing
- **Images** (Migrated from Xano vault to Supabase storage)
- **Data validation** and integrity checks

## Prerequisites

1. **Environment Variables** (add to your `.env` file):
   ```env
   DATABASE_URL="postgresql://..."           # Your Supabase/PostgreSQL connection
   SUPABASE_URL="https://xxx.supabase.co"    # Your Supabase project URL
   SUPABASE_SERVICE_ROLE_KEY="eyJ..."        # Your Supabase service role key
   ```

2. **Xano Export** must be available at:
   ```
   /Users/jackwarman/Downloads/workspace-1-1750959705/
   ```

3. **Install Dependencies**:
   ```bash
   cd /Users/jackwarman/bite-club-mvp/backend
   npm install
   ```

## Migration Commands

### Full Migration (Recommended)
Runs both data and image migration:
```bash
npm run migrate:full
```

### Data Migration Only
Migrates users, restaurants, and menu items:
```bash
npm run migrate:data
```

### Image Migration Only
Migrates images from Xano vault to Supabase storage:
```bash
npm run migrate:images
```

## Migration Process

### Phase 1: Data Migration
1. **School Setup**: Creates/finds "University of Florida" school
2. **User Migration**: 
   - Converts Xano users to Bite Club users
   - Assigns temporary passwords (users will need to reset)
   - Maps student/restaurant roles
   - Converts credit balances from cents to dollars
3. **Restaurant Creation**: 
   - Extracts restaurants from menu item data
   - Creates restaurant entities in Supabase
4. **Menu Item Migration**:
   - Transfers all menu items with pricing and descriptions
   - Maps categories as string fields
   - Preserves availability status

### Phase 2: Image Migration
1. **Storage Setup**: Creates "menu-images" bucket in Supabase
2. **File Transfer**: 
   - Reads images from Xano vault directory
   - Uploads to Supabase storage with optimized names
   - Updates menu item image URLs
3. **Cleanup**: Removes Xano image references

## Data Mapping

### Users
| Xano Field | Bite Club Field | Notes |
|------------|-----------------|-------|
| `id` | `id` | Prefixed with "xano_" |
| `email` | `email` | Validated format |
| `name` | `firstName` | |
| `lastname` | `lastName` | |
| `Phone_Number` | `phone` | Cleaned format |
| `role` | `role` | Uppercase enum |
| `credit_balance` | `creditBalance` | Cents → Dollars |
| `password` | `passwordHash` | New secure hash |

### Menu Items
| Xano Field | Bite Club Field | Notes |
|------------|-----------------|-------|
| `id` | `id` | Prefixed with "xano_item_" |
| `Menu_item_name` | `name` | |
| `Menu_item_description` | `description` | |
| `Menu_item_price` | `price` | Cents → Dollars |
| `Menu_item_image` | `imageUrl` | Migrated to Supabase |
| `available` | `available` | |

### Restaurants
| Source | Bite Club Field | Notes |
|--------|-----------------|-------|
| Extracted from menu items | `name` | From `Restauraunt_Name_aux` |
| Generated | `id` | Prefixed with "xano_restaurant_" |
| Default | `schoolId` | University of Florida |

## Post-Migration Tasks

### 1. Password Management
All users receive temporary passwords and should be prompted to reset:
```typescript
// Example: Send password reset emails
const users = await prisma.user.findMany({
  where: { 
    id: { startsWith: 'xano_' } 
  }
});

for (const user of users) {
  await sendPasswordResetEmail(user.email);
}
```

### 2. Restaurant Ownership
Review and assign restaurant owners:
```typescript
// Example: Assign restaurant ownership
await prisma.restaurant.update({
  where: { id: 'xano_restaurant_8' },
  data: { 
    userId: 'user_id_of_restaurant_owner',
    email: 'restaurant@email.com',
    phone: '+1234567890'
  }
});
```

### 3. Data Validation
```bash
# Check migration results
npm run migrate:validate  # (if you create this script)
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```
   Error: Missing required environment variables: SUPABASE_URL
   ```
   Solution: Add all required env vars to `.env` file

2. **Database Connection Failed**
   ```
   Error: Database connection failed
   ```
   Solution: Verify `DATABASE_URL` and network access

3. **Xano Export Not Found**
   ```
   Error: Xano export not found at: /Users/jackwarman/Downloads/workspace-1-1750959705
   ```
   Solution: Verify export path or update `MIGRATION_CONFIG.XANO_EXPORT_PATH`

4. **Duplicate Email Errors**
   ```
   Error: Unique constraint failed on the fields: (`email`)
   ```
   Solution: Some users may already exist in database

### Recovery

If migration fails, restore from backup:
```bash
# Backup is created automatically
pg_dump $DATABASE_URL > backup-before-migration.sql

# Restore if needed
psql $DATABASE_URL < backup-before-migration.sql
```

## File Structure

```
backend/scripts/xano-migration/
├── README.md                 # This file
├── migration-config.ts       # Configuration and utilities
├── migrate-data.ts          # Main data migration logic
├── migrate-images.ts        # Image migration logic
└── run-migration.ts         # Migration runner and CLI
```

## Validation Queries

After migration, verify data integrity:

```sql
-- Check user counts by role
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check restaurants with menu items
SELECT r.name, COUNT(mi.id) as menu_items 
FROM restaurants r 
LEFT JOIN menu_items mi ON r.id = mi."restaurantId" 
GROUP BY r.id, r.name;

-- Check menu items with images
SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN "imageUrl" IS NOT NULL THEN 1 END) as items_with_images,
  COUNT(CASE WHEN "imageUrl" LIKE 'xano:%' THEN 1 END) as unmigrated_images
FROM menu_items;
```

## Support

For issues or questions:
1. Check the migration logs for specific error messages
2. Verify all prerequisites are met
3. Review the data mapping section for field transformations
4. Test with a small subset of data first if needed

---

**Note**: This migration is designed specifically for transferring data from your Xano food ordering platform to the Bite Club Supabase implementation. Always test on a staging environment first!
#!/usr/bin/env node

// Add full permissions to admin user

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addAdminPermissions() {
  try {
    console.log('🔑 Adding full permissions to admin user...');

    // Define all permissions needed for admin
    const permissions = [
      { module: 'dashboard', actions: ['read'], scope: 'all' },
      { module: 'stakeholders', actions: ['create', 'read', 'update', 'delete'], scope: 'all' },
      { module: 'transactions', actions: ['create', 'read', 'update', 'delete'], scope: 'all' },
      { module: 'users', actions: ['create', 'read', 'update', 'delete'], scope: 'all' },
      { module: 'reports', actions: ['read'], scope: 'all' },
      { module: 'settings', actions: ['read', 'update'], scope: 'all' }
    ];

    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }

    // Clear existing permissions
    await prisma.userPermission.deleteMany({
      where: { userId: adminUser.id }
    });

    // Add all permissions
    for (const permission of permissions) {
      await prisma.userPermission.create({
        data: {
          userId: adminUser.id,
          module: permission.module,
          actions: JSON.stringify(permission.actions),
          scope: permission.scope
        }
      });
    }

    console.log('✅ Admin permissions added successfully');
    console.log(`📊 Total permissions: ${permissions.length}`);
    
    // Verify permissions were added
    const addedPermissions = await prisma.userPermission.findMany({
      where: { userId: adminUser.id }
    });
    
    console.log('\n📋 Admin permissions:');
    addedPermissions.forEach(perm => {
      console.log(`   • ${perm.module}: ${JSON.parse(perm.actions).join(', ')} (${perm.scope})`);
    });

  } catch (error) {
    console.error('❌ Failed to add permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAdminPermissions();
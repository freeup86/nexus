import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function seedDocumentCategories() {
  try {
    const systemCategories = [
      { name: 'Receipt', icon: '🧾', color: '#10B981', description: 'Purchase receipts and proof of payment' },
      { name: 'Invoice', icon: '📄', color: '#3B82F6', description: 'Bills and invoices for payment' },
      { name: 'Contract', icon: '📝', color: '#8B5CF6', description: 'Legal contracts and agreements' },
      { name: 'Warranty', icon: '🛡️', color: '#F59E0B', description: 'Product warranties and guarantees' },
      { name: 'Medical', icon: '🏥', color: '#EF4444', description: 'Medical records and health documents' },
      { name: 'Tax', icon: '💰', color: '#6366F1', description: 'Tax documents and filings' },
      { name: 'Insurance', icon: '🏛️', color: '#14B8A6', description: 'Insurance policies and claims' },
      { name: 'Identity', icon: '🆔', color: '#EC4899', description: 'ID cards, passports, licenses' },
      { name: 'Education', icon: '🎓', color: '#84CC16', description: 'Diplomas, certificates, transcripts' },
      { name: 'Financial', icon: '💳', color: '#F97316', description: 'Bank statements, investments' },
      { name: 'Real Estate', icon: '🏠', color: '#06B6D4', description: 'Property documents and deeds' },
      { name: 'Vehicle', icon: '🚗', color: '#0EA5E9', description: 'Vehicle registration and documentation' },
      { name: 'Travel', icon: '✈️', color: '#D946EF', description: 'Travel bookings and itineraries' },
      { name: 'Utility', icon: '💡', color: '#64748B', description: 'Utility bills and services' },
      { name: 'Other', icon: '📋', color: '#94A3B8', description: 'Miscellaneous documents' }
    ];

    console.log('Seeding document categories...');

    for (const category of systemCategories) {
      await prisma.category.upsert({
        where: {
          name_userId: {
            name: category.name,
            userId: null
          }
        },
        update: {
          icon: category.icon,
          color: category.color,
          description: category.description
        },
        create: {
          name: category.name,
          icon: category.icon,
          color: category.color,
          description: category.description,
          isSystem: true,
          userId: null
        }
      });
      console.log(`✓ Created/Updated category: ${category.name}`);
    }

    console.log('\n✅ Document categories seeded successfully!');
  } catch (error) {
    console.error('Error seeding document categories:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDocumentCategories();
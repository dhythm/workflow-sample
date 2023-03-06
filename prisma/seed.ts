import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const names = ['Alice', 'Bob', 'Carol', "Dave", "Eve"]
  for (const name of names) {
    const user = await prisma.user.upsert({
      where: { email: `${name.toLowerCase()}@prisma.io` },
      update: {},
      create: {
        email: `${name.toLowerCase()}@prisma.io`,
        name
      }
    })
    console.log({ user })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

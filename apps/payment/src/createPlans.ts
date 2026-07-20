import { razorpayInstance } from './lib/razorpay';
import { prisma, type plans } from "@repo/database"



async function create() {
  const bronze = await razorpayInstance.plans.create({
      period: "monthly",
      interval: 3,
      item: {
        name: "Quarterly Bronze",
        description: "Bronze Quota type for 3 months",
        amount: 50000,
        currency: "INR"
      }
    })

  const silver = await razorpayInstance.plans.create({
      period: "monthly",
      interval: 3,
      item: {
        name: "Quarterly Silver",
        description: "Silver Quota type for 3 months",
        amount: 200000,
        currency: "INR"
      }
    });

  const gold = await razorpayInstance.plans.create({
      period: "monthly",
      interval: 3,
      item: {
        name: "Quarterly Gold",
        description: "Gold Quota type for 3 months",
        amount: 350000,
        currency: "INR"
      }
    });

  const platinum = await razorpayInstance.plans.create({
    period: "monthly",
    interval: 3,
    item: {
      name: "Quarterly Platinum",
      description: "Platinum Quota type for 3 months",
      amount: 500000,
      currency: "INR"
    }
  });

  let plans = [];
  plans.push(bronze, silver, gold, platinum)

  try {
    const createdPlans = plans;

    const dbPlans: plans[] = createdPlans.map((plan) => {
      return {
        id: plan.id,
        name: plan.item.name,
        description: plan.item.description as string,
        amount: BigInt(plan.item.amount),
        currency: plan.item.currency,
        interval: plan.interval,
        period: plan.period,
        created_at: new Date(plan.created_at)
      };
    });

    try {
      await prisma.plans.createMany({
        data: dbPlans
      })
    } catch (err) {
      console.log("plans: ", dbPlans)
      console.error("Error creating plans in database", err)
      throw new Error(err as string)
    }

  } catch (err) {
    console.error("Error creating plans: ", err)
    throw new Error(err as string)
  }

}

create()
  .then(() => console.log("Plans created successfully"))
  .catch((err) => console.log("Plans could not be created", err))
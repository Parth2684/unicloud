import { razorpayInstance } from './lib/razorpay';
import { prisma, type plans } from "@repo/database"
import fs from "fs";



async function create() {
  const bronze = razorpayInstance.plans.create({
      period: "monthly",
      interval: 3,
      item: {
        name: "Quarterly Bronze",
        description: "Bronze Quota type for 3 months",
        amount: 50000,
        currency: "INR"
      }
    })

  const silver = razorpayInstance.plans.create({
      period: "monthly",
      interval: 3,
      item: {
        name: "Quarterly Silver",
        description: "Silver Quota type for 3 months",
        amount: 200000,
        currency: "INR"
      }
    });

  const gold = razorpayInstance.plans.create({
      period: "monthly",
      interval: 3,
      item: {
        name: "Quarterly Gold",
        description: "Gold Quota type for 3 months",
        amount: 350000,
        currency: "INR"
      }
    });

  const platinum = razorpayInstance.plans.create({
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
    const createdPlans = await Promise.all(plans)

    const dbPlans: plans[] = createdPlans.map((plan) => {
      return {
        id: plan.id,
        name: plan.item.name,
        description: plan.item.description as string,
        amount: typeof (plan.item.amount) === "string" ? BigInt(plan.item.amount) : BigInt(plan.item.amount),
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
      fs.writeFileSync("./error_plans.txt", dbPlans.toString())
      console.log("plans: ", dbPlans)
      console.error("Error creating plans in database", err)
    }

  } catch (err) {
    console.error("Error creating plans: ", err)
    return;
  }

}

create()
  .then(() => console.log("Plans created successfully"))
  .catch((err) => console.log("Plans could not be created", err))
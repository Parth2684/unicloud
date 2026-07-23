import type { Request, Response } from "express";
import { razorpayInstance } from "../lib/razorpay";
import { z } from "zod/v4";
import { prisma } from "@repo/database";


const CreateSubscriptionBody = z.object({
  planId: z.string().nonempty()
})


export const createSubscription = async (req: Request, res: Response) => {
  const body = req.body;
  const parsedBody = CreateSubscriptionBody.safeParse(body);
  if (!parsedBody.success) {
    res.status(411).json({
      message: "Subscription Id not found in body"
    })
    return
  }
  try {
    const razorpaySubscription = await razorpayInstance.subscriptions.create({
      plan_id: parsedBody.data.planId,
      total_count: 1
    });
    try {
      const dbSubscription = await prisma.subscription.create({
        data: {
          razorpay_subscription_id: razorpaySubscription.id,
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60).toUTCString(),
          user_id: req.user.id,
          plan_id: razorpaySubscription.plan_id
        }
      })
      res.json({
        subscriptionId: dbSubscription.razorpay_subscription_id
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({
        message: "Server error: Error adding subscription to db"
      })
      return
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Server | Razorpay error creating subscription"
    })
    return
  }
  
}

import { Router } from "express";
import { createSubscription } from "../handlers/createSubscription";



const subscriptionRouter: Router = Router();

subscriptionRouter.post("/", createSubscription)


export default subscriptionRouter
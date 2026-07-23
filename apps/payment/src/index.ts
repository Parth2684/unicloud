import express, { type Request, type Response } from "express"
import { authMiddleware } from "./middleware/auth"
import subscriptionRouter from "./routers/subscription"

const port = process.env.PORT!
const app = express()

app.get("/", (_: Request, res: Response) => res.send("Noice"))

app.use(authMiddleware);

app.use("/api/v1/subscription", subscriptionRouter)


app.listen(port, () => console.log(`Payment running on ${port}`))

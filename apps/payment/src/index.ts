import express, { type Request, type Response } from "express"
import { authMiddleware } from "./middleware/auth"

const port = process.env.PORT!
const app = express()

app.get("/", (_: Request, res: Response) => res.send("Noice"))

app.use(authMiddleware);

app.post("/order")


app.listen(port, () => console.log(`Payment running on ${port}`))

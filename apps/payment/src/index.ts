import express, { type Request, type Response } from "express"

const port = process.env.PORT!
const app = express()

app.get("/", (req: Request, res: Response) => res.send("Noice"))


app.listen(port, () => console.log(`Payment running on ${port}`))

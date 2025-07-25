import { Header } from "@repo/ui/header"
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";

export default function Home() {
  return <div className="">
    <Header />
    <Button appName="web" className={"rounded-md p-2 border"}>
          Open alert
        </Button>
  </div>
}

import { redirect } from "next/navigation";

/** 战略罗盘已并入指挥舱：/command/compass */
export default function CompassPage() {
  redirect("/command/compass");
}

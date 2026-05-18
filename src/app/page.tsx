import { redirect } from "next/navigation";

export default function RootPage() {
  // middleware já garante auth — aqui é só o ponteiro.
  redirect("/dashboard");
}

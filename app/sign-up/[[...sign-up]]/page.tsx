import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Sign up",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <SignUp appearance={{ variables: { colorPrimary: "#3b82f6" } }} />
    </div>
  );
}

import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <SignIn appearance={{ variables: { colorPrimary: "#3b82f6" } }} />
    </div>
  );
}

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#00ff88",
            colorBackground: "#111111",
            colorText: "#f5f5f5",
            colorInputBackground: "#1a1a1a",
            colorInputText: "#f5f5f5",
          },
        }}
      />
    </div>
  );
}

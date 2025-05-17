import { JellyfinLogo } from "@/components/logo";
import { SignupForm } from "@/components/signup-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
        {/* Jellyfin Logo and Title */}
        <div className="mb-8 text-center">
          <JellyfinLogo />
          <h1 className="text-2xl font-bold text-white">Jellyfin</h1>
          <p className="text-gray-400 mt-1">Create your streaming account</p>
        </div>

        {/* Signup Form */}
        <SignupForm />

        {/* Login link */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?
          <a href="#" className="text-primary hover:underline font-medium ml-1">
            Sign in
          </a>
        </div>
      </div>

      <footer className="py-6 mt-auto">
        <div className="text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Jellyfin. The Free Software Media System.</p>
        </div>
      </footer>
    </div>
  );
}

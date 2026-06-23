import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { PlayCircle, LogIn } from "lucide-react";
import { createDemoSession, saveSession, type LocalSession } from "../lib/storage";

type AuthProps = {
  onEnter: Dispatch<SetStateAction<LocalSession | null>>;
};

export function Auth({ onEnter }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const name = email.split("@")[0]?.trim() || "Trader";
    const session: LocalSession = {
      mode: "account",
      name,
      email: email.trim().toLowerCase()
    };
    saveSession(session);
    onEnter(session);
  }

  function openDemo() {
    onEnter(createDemoSession());
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 py-10 text-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <img src="/logo.png" alt="Logo" className="h-auto w-56 object-contain" />
        </div>

        <form className="panel p-6" onSubmit={submit}>
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="mt-2 text-sm text-slate-500">Enter your details to open your trading dashboard.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="field"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="field"
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
              />
            </div>
          </div>

          <button className="primary-button mt-6 w-full" type="submit">
            <LogIn size={18} />
            Login
          </button>

          <button className="secondary-button mt-3 w-full" type="button" onClick={openDemo}>
            <PlayCircle size={18} />
            Open Demo Account
          </button>
        </form>
      </div>
    </div>
  );
}

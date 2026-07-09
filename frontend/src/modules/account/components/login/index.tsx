"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { login } from "@lib/data/customer"
import { LogIn } from "lucide-react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="w-full"
      data-testid="login-page"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand)] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[var(--color-brand)]/20">
          <LogIn className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Sign in to your Cartunez account
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Welcome back! Enter your credentials to continue.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-[var(--radius-lg)] border border-gray-100 bg-white p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
        {message?.state === "verification_required" && (
          <div
            className="w-full mb-6 text-center text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] p-4"
            data-testid="login-verification-message"
          >
            We sent a verification link to <strong className="text-gray-900">{message.email}</strong>.
            Please verify your email, then sign in.
          </div>
        )}

        <form className="space-y-5" action={formAction}>
          <div className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              title="Enter a valid email address."
              autoComplete="email"
              required
              data-testid="email-input"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              data-testid="password-input"
            />
          </div>

          <ErrorMessage
            error={message?.state === "error" ? message.error : null}
            data-testid="login-error-message"
          />

          <SubmitButton
            data-testid="sign-in-button"
            className="w-full h-11 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white font-bold text-sm uppercase tracking-wider hover:bg-[var(--color-brand)]/90 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Sign in
          </SubmitButton>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors underline-offset-2 hover:underline"
          data-testid="register-button"
        >
          Create account
        </button>
      </p>
    </div>
  )
}

export default Login
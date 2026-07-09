"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"
import { UserPlus } from "lucide-react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)

  return (
    <div className="w-full" data-testid="register-page">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand)] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[var(--color-brand)]/20">
          <UserPlus className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Create your Cartunez account
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Join the Cartunez community and get an enhanced shopping experience.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-[var(--radius-lg)] border border-gray-100 bg-white p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
        {message?.state === "verification_required" && (
          <div
            className="w-full mb-6 text-center text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] p-4"
            data-testid="register-verification-message"
          >
            We sent a verification link to <strong className="text-gray-900">{message.email}</strong>.
            Please check your inbox to verify your email, then sign in.
          </div>
        )}

        <form action={formAction}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                name="first_name"
                required
                autoComplete="given-name"
                data-testid="first-name-input"
              />
              <Input
                label="Last name"
                name="last_name"
                required
                autoComplete="family-name"
                data-testid="last-name-input"
              />
            </div>
            <Input
              label="Email"
              name="email"
              required
              type="email"
              autoComplete="email"
              data-testid="email-input"
            />
            <Input
              label="Phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              data-testid="phone-input"
            />
            <Input
              label="Password"
              name="password"
              required
              type="password"
              autoComplete="new-password"
              data-testid="password-input"
            />
          </div>

          <ErrorMessage
            error={message?.state === "error" ? message.error : null}
            data-testid="register-error"
          />

          {/* Privacy & Terms */}
          <p className="text-xs text-gray-400 mt-5 leading-relaxed">
            By creating an account, you agree to Cartunez&apos;s{" "}
            <LocalizedClientLink
              href="/content/privacy-policy"
              className="font-medium text-gray-600 underline underline-offset-2 hover:text-[var(--color-brand)] transition-colors"
            >
              Privacy Policy
            </LocalizedClientLink>{" "}
            and{" "}
            <LocalizedClientLink
              href="/content/terms-of-use"
              className="font-medium text-gray-600 underline underline-offset-2 hover:text-[var(--color-brand)] transition-colors"
            >
              Terms of Use
            </LocalizedClientLink>
            .
          </p>

          <SubmitButton
            className="w-full h-11 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white font-bold text-sm uppercase tracking-wider hover:bg-[var(--color-brand)]/90 transition-all duration-200 shadow-sm hover:shadow-md mt-6"
            data-testid="register-button"
          >
            Create account
          </SubmitButton>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Already a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors underline-offset-2 hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}

export default Register
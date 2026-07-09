"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@modules/common/components/ui"
import { confirmEmailVerification } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { MailCheck, MailX, Loader } from "lucide-react"

type VerificationState = "verifying" | "success" | "error"

const VerifyAccount = () => {
  const searchParams = useSearchParams()
  const token = searchParams?.get("token")
  const [state, setState] = useState<VerificationState>("verifying")
  // Guard against the effect running twice in React Strict Mode, which would
  // consume the single-use token before the customer sees the result.
  const confirmed = useRef(false)

  useEffect(() => {
    if (confirmed.current) {
      return
    }
    confirmed.current = true

    if (!token) {
      setState("error")
      return
    }

    confirmEmailVerification(token).then(({ success }) =>
      setState(success ? "success" : "error")
    )
  }, [token])

  return (
    <div
      className="max-w-sm w-full mx-auto flex flex-col items-center text-center gap-y-6 py-12 px-6"
      data-testid="verify-account-page"
    >
      {state === "verifying" && (
        <>
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Loader className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Email verification</h1>
          <p className="text-sm text-gray-500">
            Verifying your email...
          </p>
        </>
      )}

      {state === "success" && (
        <>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <MailCheck className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Email verified!</h1>
          <p className="text-sm text-gray-500">
            Your email is verified. You can now sign in to your account.
          </p>
          <LocalizedClientLink href="/account">
            <Button
              variant="primary"
              className="rounded-[var(--radius-md)] shadow-sm hover:shadow-md transition-all duration-200"
            >
              Go to sign in
            </Button>
          </LocalizedClientLink>
        </>
      )}

      {state === "error" && (
        <>
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
            <MailX className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Verification failed</h1>
          <p className="text-sm text-gray-500">
            This verification link is invalid or has expired. Sign in to receive
            a new verification email.
          </p>
          <LocalizedClientLink href="/account">
            <Button
              variant="secondary"
              className="rounded-[var(--radius-md)]"
            >
              Go to sign in
            </Button>
          </LocalizedClientLink>
        </>
      )}
    </div>
  )
}

export default VerifyAccount
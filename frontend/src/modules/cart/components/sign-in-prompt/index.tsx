import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { LogIn } from "lucide-react"

const SignInPrompt = () => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center shrink-0 mt-0.5">
          <LogIn size={18} className="text-[var(--color-brand)]" />
        </div>
        <div>
          <Heading level="h2" className="text-base font-bold text-gray-900">
            Already have an account?
          </Heading>
          <Text className="text-sm text-gray-500 mt-0.5">
            Sign in for a faster checkout experience.
          </Text>
        </div>
      </div>
      <div className="shrink-0">
        <LocalizedClientLink href="/account">
          <Button
            variant="secondary"
            className="h-10 px-5 rounded-[var(--radius-sm)] text-sm font-semibold"
            data-testid="sign-in-button"
          >
            Sign in
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
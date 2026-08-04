import { Metadata } from "next"
import FitmentAdmin from "@modules/admin/components/fitment-admin"

export const metadata: Metadata = {
  title: "Vehicle Fitment Manager",
  robots: { index: false, follow: false },
}

export default function FitmentAdminPage() {
  return <FitmentAdmin />
}

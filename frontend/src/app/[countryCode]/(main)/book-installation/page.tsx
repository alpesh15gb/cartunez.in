"use client"

import React, { useState, useEffect } from "react"
import { bookInstallation, fetchMakes, fetchModels, type VehicleMake, type VehicleModel } from "@lib/data/fastapi"
import { Button } from "@modules/common/components/ui"
import { Wrench, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function BookInstallationPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [serviceType, setServiceType] = useState("Android Stereo Fitment")
  const [preferredDate, setPreferredDate] = useState("")
  const [preferredTime, setPreferredTime] = useState("morning")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [selectedMake, setSelectedMake] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [notes, setNotes] = useState("")

  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchMakes()
      .then(setMakes)
      .catch((err) => console.error("Failed to load makes for booking:", err))
  }, [])

  useEffect(() => {
    if (!selectedMake) {
      setModels([])
      setSelectedModel("")
      return
    }
    fetchModels(selectedMake)
      .then(setModels)
      .catch((err) => console.error("Failed to load models for booking:", err))
  }, [selectedMake])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim() || !preferredDate || !address.trim() || !city.trim()) return

    setLoading(true)
    setError("")
    setSuccess("")

    const makeName = makes.find((m) => m.id === selectedMake)?.name
    const modelName = models.find((m) => m.id === selectedModel)?.name

    try {
      await bookInstallation({
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        service_type: serviceType,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        address: address.trim(),
        city: city.trim(),
        vehicle_make: makeName,
        vehicle_model: modelName,
        notes: notes.trim(),
      })
      setSuccess("Your installation service booking has been requested successfully! Our crew will call to confirm.")
      setName("")
      setEmail("")
      setPhone("")
      setAddress("")
      setCity("")
      setSelectedMake("")
      setSelectedModel("")
      setNotes("")
      setPreferredDate("")
    } catch (err) {
      console.error("Booking submission failed:", err)
      setError("Booking request failed. Please check details and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content-container py-16 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-carbon">
          <div className="p-2 bg-brand text-white rounded-soft">
            <Wrench size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider">Book Professional Installation</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Schedule doorstep accessory installation by our certified technicians</p>
          </div>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-soft text-xs font-semibold flex items-start gap-2.5">
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-soft text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 border border-gray-150 p-6 sm:p-8 rounded-soft">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-medium"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-medium"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-semibold text-carbon"
              >
                <option value="Android Stereo Fitment">Android Stereo Fitment</option>
                <option value="7D Mat Installation">7D Mat Installation</option>
                <option value="LED Headlight Setup">LED Headlight Setup</option>
                <option value="Premium Seat Covers fitment">Premium Seat Covers fitment</option>
                <option value="General Upgrades">General Upgrades</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preferred Date</label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-semibold text-carbon"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preferred Time</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-semibold text-carbon"
              >
                <option value="morning">Morning (9 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                <option value="evening">Evening (4 PM - 7 PM)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vehicle Make</label>
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-semibold text-carbon"
              >
                <option value="">Choose Make</option>
                {makes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vehicle Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedMake}
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-semibold text-carbon disabled:opacity-50"
              >
                <option value="">Choose Model</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Door no, Street name, Locality"
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-medium"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Additional Notes</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requests or requirements..."
              className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-medium"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !name.trim() || !email.trim() || !phone.trim() || !preferredDate || !address.trim() || !city.trim()}
            className="w-full h-11 flex items-center justify-center gap-2 bg-brand text-white hover:bg-brand-dark rounded-soft text-xs font-bold uppercase tracking-wider"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Scheduling Service...</span>
              </>
            ) : (
              <span>Book Appointment</span>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

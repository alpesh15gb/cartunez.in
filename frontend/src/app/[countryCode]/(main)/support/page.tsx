"use client"

import React, { useState } from "react"
import { createSupportTicket } from "@lib/data/fastapi"
import { Button } from "@modules/common/components/ui"
import { LifeBuoy, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function SupportPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("normal")

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !subject.trim() || !description.trim()) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await createSupportTicket({
        customer_name: name.trim(),
        customer_email: email.trim(),
        subject: subject.trim(),
        description: description.trim(),
        priority,
      })
      setSuccess("Your support ticket has been created successfully. Our team will contact you shortly!")
      setName("")
      setEmail("")
      setSubject("")
      setDescription("")
    } catch (err) {
      console.error("Support ticket submission failed:", err)
      setError("Failed to submit support ticket. Please verify details and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content-container py-16 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-gray-700">
          <div className="p-2 bg-brand text-white rounded-soft">
            <LifeBuoy size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider">Customer Support & Helpdesk</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Submit a ticket for technical help or order queries</p>
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
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What do you need help with?"
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-medium"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-semibold text-gray-900"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Description</label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue or request in detail..."
              className="w-full bg-white border border-gray-200 rounded-soft px-3 py-2.5 text-xs outline-none focus:border-brand transition-all duration-200 font-medium"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !name.trim() || !email.trim() || !subject.trim() || !description.trim()}
            className="w-full h-11 flex items-center justify-center gap-2 bg-brand text-white hover:bg-brand-dark rounded-soft text-xs font-bold uppercase tracking-wider"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Creating Ticket...</span>
              </>
            ) : (
              <span>Submit Ticket</span>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

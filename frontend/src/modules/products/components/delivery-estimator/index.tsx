"use client"
import React, { useState, useEffect } from "react"
import { Truck, CheckCircle, Clock, MapPin } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
const SERVICEABLE_PINCODES = new Set(["500001","500002","500003","500004","500005","560001","560002","560003","560004","560005","400001","400002","400003","400004","400005","110001","110002","110003","110004","110005"])
const METRO_PREFIXES = new Set(["500","560","400","110","600","700","411","380"])
export default function DeliveryEstimator() {
  const [pincode, setPincode] = useState("")
  const [result, setResult] = useState({status:"idle",message:"",days:""})
  useEffect(() => {
    if (pincode.length !== 6) {
      if (result.status !== "idle") setResult({status:"idle",message:"",days:""})
      return
    }
    const timer = setTimeout(() => {
      setResult({status:"checking",message:"Checking...",days:""})
      setTimeout(() => {
        const ok = SERVICEABLE_PINCODES.has(pincode)
        const metro = METRO_PREFIXES.has(pincode.slice(0,3))
        if (ok) setResult({status:"available",message:"Available",days:metro?"2-4 business days":"4-7 business days"})
        else setResult({status:"unavailable",message:"Not serviceable",days:""})
      },600)
    },400)
    return () => clearTimeout(timer)
  },[pincode]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/50 p-5">
      <div className="flex items-center gap-2">
        <Truck size={16} className="text-brand" strokeWidth={1.5} />
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-900">Delivery Estimate</span>
      </div>
      <div className="relative">
        <input type="text" value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter delivery pincode" maxLength={6}
          className="w-full h-11 rounded-xl border border-gray-200 bg-white pl-4 pr-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-brand focus:ring-2 focus:ring-brand/10"
          aria-label="Enter delivery pincode" />
        <MapPin size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
      </div>
      <AnimatePresence mode="wait">
        {result.status === "checking" && (
          <motion.div key="checking" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
            <div className="w-3 h-3 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
            Checking availability...
          </motion.div>
        )}
        {result.status === "available" && (
          <motion.div key="available" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="space-y-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-600" strokeWidth={2} />
              <span className="text-[11px] font-bold text-emerald-800">{result.message}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-medium">
              <Clock size={12} strokeWidth={1.5} />
              <span>Estimated: <strong>{result.days}</strong></span>
            </div>
          </motion.div>
        )}
        {result.status === "unavailable" && (
          <motion.div key="unavailable" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-600" strokeWidth={2} />
              <span className="text-[11px] font-bold text-amber-800">{result.message}</span>
            </div>
            <p className="text-[10px] text-amber-600 font-medium mt-1">Try a nearby pincode or contact support.</p>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-[9px] text-gray-400 font-medium">Free shipping above ₹999. Delivered across India.</p>
    </div>
  )
}

import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "../context/ToastContext";
import { Send, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FormField {
  id: string;
  name: string;
  type: "text" | "email" | "tel" | "date" | "select" | "textarea" | "checkbox";
  label: string;
  required: boolean;
  placeholder: string;
  options?: string;
  width?: "full" | "half" | "third" | "quarter";
}

interface WayficForm {
  id: string;
  title: string;
  header?: string;
  fields: FormField[];
  mailto: string;
  subject: string;
  bodyTemplate: string;
  successMessage: string;
}

interface WayficFormRendererProps {
  formId?: string;
  shortcode?: string; // e.g. '[wayfic-form id="photography-inquiry"]'
}

export default function WayficFormRenderer({ formId, shortcode }: WayficFormRendererProps) {
  const toast = useToast();
  const [targetFormId, setTargetFormId] = useState<string>("");
  const [form, setForm] = useState<WayficForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Resolve formId from prop or shortcode pattern
  useEffect(() => {
    let resolvedId = formId || "";
    
    if (shortcode) {
      const match = shortcode.match(/id=["']([^"']+)["']/);
      if (match && match[1]) {
        resolvedId = match[1];
      }
    }

    if (resolvedId) {
      setTargetFormId(resolvedId);
    } else {
      setLoading(false);
    }
  }, [formId, shortcode]);

  // 2. Load form metadata from database
  useEffect(() => {
    if (!targetFormId) return;

    const loadFormStructure = async () => {
      try {
        setLoading(true);
        const formDoc = await getDoc(doc(db, "wayfic_forms", targetFormId));
        if (formDoc.exists()) {
          const formData = formDoc.data() as WayficForm;
          setForm(formData);
          
          // Set initial form states
          const initialValues: Record<string, any> = {};
          formData.fields?.forEach(field => {
            if (field.type === "checkbox") {
              initialValues[field.name] = [];
            } else {
              initialValues[field.name] = "";
            }
          });
          setFormValues(initialValues);
        } else {
          console.warn(`Wayfic form model index not found: ${targetFormId}`);
        }
      } catch (err) {
        console.error("Failed to load wayfic form:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFormStructure();
  }, [targetFormId]);

  // 2b. Automatically prepopulate from active plan selection if this is the inquiries form ("contact")
  useEffect(() => {
    if (!form || !form.fields) return;

    const applyPlanToFields = (planName: string) => {
      // Find the Campaign Subject Picker field
      const subjectField = form.fields.find(f => 
        f.name === "subject" || 
        f.label === "Campaign Subject Picker" || 
        f.label.toLowerCase().includes("subject")
      );
      
      const messageField = form.fields.find(f => 
        f.name === "message" || 
        f.label.toLowerCase().includes("message") ||
        f.label.toLowerCase().includes("details")
      );

      setFormValues(prev => {
        const updated = { ...prev };
        if (subjectField) {
          updated[subjectField.name] = planName;
        }
        if (messageField) {
          updated[messageField.name] = `Hello JR Photography team, I would like to inquire about the physical and visual details of the "${planName}" package. Please let us know raw dates calendar availability.`;
        }
        return updated;
      });
    };

    // Check if there is a selected plan in global window cache
    if ((window as any).pendingSelectedPlan) {
      applyPlanToFields((window as any).pendingSelectedPlan);
      // Clean it up so it does not persist unexpectedly
      delete (window as any).pendingSelectedPlan;
    }

    // Also register an event listener for live selection updates while the form is on screen
    const handlePlanSelection = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.planName) {
        applyPlanToFields(customEvent.detail.planName);
      }
    };

    window.addEventListener("apply-plan-selection", handlePlanSelection);
    return () => {
      window.removeEventListener("apply-plan-selection", handlePlanSelection);
    };
  }, [form]);

  // 3. Form input state handling
  const handleInputChange = (fieldName: string, value: any, type: string) => {
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });

    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleCheckboxChange = (fieldName: string, option: string, checked: boolean) => {
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });

    setFormValues(prev => {
      const currentVal = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];
      let nextVal = [...currentVal];
      if (checked) {
        if (!nextVal.includes(option)) nextVal.push(option);
      } else {
        nextVal = nextVal.filter(o => o !== option);
      }
      return {
        ...prev,
        [fieldName]: nextVal
      };
    });
  };

  // 4. Client side validation
  const validateForm = (): boolean => {
    if (!form) return false;
    const newErrors: Record<string, string> = {};

    form.fields.forEach(field => {
      const val = formValues[field.name];
      const isEmpty = !val || (Array.isArray(val) && val.length === 0) || String(val).trim() === "";

      if (field.required && isEmpty) {
        newErrors[field.name] = `${field.label} is required.`;
      } else if (field.type === "email" && !isEmpty) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(val))) {
          newErrors[field.name] = "Please enter a valid email address.";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 5. Submit callback to Firestore and SMTP relay
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    if (!validateForm()) {
      toast.error("Please fill in all mandatory fields before transmitting.");
      return;
    }

    setSubmitting(true);
    try {
      // A. Save submission details into Firestore wayfic_submissions
      const subRef = collection(db, "wayfic_submissions");
      await addDoc(subRef, {
        formId: form.id,
        formTitle: form.title,
        data: formValues,
        status: "New",
        createdAt: serverTimestamp()
      });

      // B. Trigger background SMTP dispatch routing to server API proxy
      try {
        const response = await fetch("/api/mail/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            formId: form.id,
            formData: formValues,
            mailSubject: form.subject ? form.subject.replace(/{form_title}/g, form.title) : undefined,
            mailBody: form.bodyTemplate || undefined,
            customRecipient: form.mailto || undefined
          })
        });
        const mailResult = await response.json();
        if (!mailResult.success) {
          console.warn("[Wayfic Form Renderer] SMTP dispatch error reported:", mailResult.message || mailResult.info);
          toast.toast("warning", `Your details were logged in the database, but email routing failed: ${mailResult.message || mailResult.info || "Please check SMTP connection credentials"}`);
        } else {
          toast.success(form.successMessage || "Submission inquiry logged securely.");
        }
      } catch (smtpErr: any) {
        console.error("[Wayfic Form Renderer] Network SMTP dispatch error:", smtpErr);
        toast.toast("warning", `Logged in database, but SMTP network delivery failed: ${smtpErr.message || smtpErr}`);
      }

      setSubmitted(true);
    } catch (saveErr: any) {
      console.error("[Wayfic Form Renderer] Transmission save error:", saveErr);
      toast.error(`Database save issue: ${saveErr.message || saveErr}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 6. UI Rendering scenarios
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3 bg-luxury-black/30 border border-white/5 rounded-3xl p-6">
        <RefreshCw className="w-6 h-6 text-luxury-gold animate-spin" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Constructing form fields...</span>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center gap-3 p-4 bg-rose-955/20 border border-rose-500/10 rounded-2xl text-rose-300 text-xs font-mono">
        <AlertTriangle className="w-5 h-5 col-span-1 border-t shrink-0 text-rose-400" />
        <div>
          <p className="font-bold uppercase tracking-wider text-[10px]">Wayfic Shortcode Error</p>
          <p className="text-zinc-400 text-[10px] mt-0.5">Form block <code>[wayfic-form id="{targetFormId}"]</code> could not be located in database indices.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div 
        className="text-center py-12 p-8 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-4 shadow-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CheckCircle className="w-12 h-12 text-[#cfb53b] mx-auto" />
        <h3 className="font-serif text-lg text-white font-bold uppercase tracking-wider">Transmission Secured</h3>
        <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
          {form.successMessage || "We received your transmission. Thank you for your inquiry."}
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            // Reset fields
            const reset: Record<string, any> = {};
            form.fields.forEach(f => {
              reset[f.name] = f.type === "checkbox" ? [] : "";
            });
            setFormValues(reset);
          }}
          className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-mono text-zinc-300 uppercase tracking-wider transition-all"
        >
          Submit Another Response
        </button>
      </motion.div>
    );
  }

  // Helper to render a single field with exactly matching aesthetic styles
  const renderSingleField = (field: FormField) => {
    const hasError = !!errors[field.name];
    
    return (
      <div key={field.id} className="space-y-2">
        <label htmlFor={`field-${field.name}`} className="text-[9px] font-mono tracking-widest text-[#8594a6] uppercase block pl-1">
          {field.label} {field.required && <span className="text-luxury-gold">*</span>}
        </label>

        {/* Input branch logic */}
        {field.type === "textarea" ? (
          <textarea
            id={`field-${field.name}`}
            rows={5}
            placeholder={field.placeholder}
            value={formValues[field.name] || ""}
            onChange={(e) => handleInputChange(field.name, e.target.value, "textarea")}
            className={`w-full bg-luxury-black border ${
              hasError 
                ? "border-rose-500/50 bg-rose-500/5 focus:border-rose-500" 
                : "border-white/10 focus:border-luxury-gold"
            } rounded-2xl p-4 text-sm text-luxury-cream focus:outline-none transition-colors resize-none`}
          />
        ) : field.type === "select" ? (
          <div className="relative">
            <select
              id={`field-${field.name}`}
              value={formValues[field.name] || ""}
              onChange={(e) => handleInputChange(field.name, e.target.value, "select")}
              className={`w-full bg-luxury-black border ${
                hasError 
                  ? "border-rose-500/50 bg-rose-500/5 focus:border-rose-500" 
                  : "border-white/10 focus:border-luxury-gold"
              } rounded-2xl p-4 text-sm text-luxury-cream focus:outline-none transition-colors appearance-none cursor-pointer`}
            >
              <option value="" className="bg-luxury-black text-zinc-500" disabled>
                {field.placeholder || "Please select..."}
              </option>
              {field.options && field.options.split(",").map(opt => {
                const trimmed = opt.trim();
                return (
                  <option key={trimmed} value={trimmed} className="bg-luxury-black text-luxury-cream">
                    {trimmed}
                  </option>
                );
              })}
            </select>
          </div>
        ) : field.type === "checkbox" ? (
          <div className="space-y-2 py-1 pl-1">
            {field.options && field.options.split(",").map(opt => {
              const optionValue = opt.trim();
              const isChecked = Array.isArray(formValues[field.name]) && formValues[field.name].includes(optionValue);
              
              return (
                <label key={optionValue} className="flex items-center space-x-2.5 text-xs text-zinc-350 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(field.name, optionValue, e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-900/60 text-luxury-gold focus:ring-0 cursor-pointer w-4 h-4"
                  />
                  <span>{optionValue}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <input
            id={`field-${field.name}`}
            type={field.type}
            placeholder={field.placeholder}
            value={formValues[field.name] || ""}
            onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
            min={field.type === "date" ? new Date().toISOString().split('T')[0] : undefined}
            style={field.type === "date" ? { colorScheme: "dark" } : undefined}
            className={`w-full bg-luxury-black border ${
              hasError 
                ? "border-rose-500/50 bg-rose-500/5 focus:border-rose-500" 
                : "border-white/10 focus:border-luxury-gold"
            } rounded-2xl p-4 text-sm text-luxury-cream focus:outline-none transition-colors`}
          />
        )}

        {/* Inline warning */}
        {hasError && (
          <span className="text-[10px] text-[#f43f5e] font-mono block pl-1">
            {errors[field.name]}
          </span>
        )}
      </div>
    );
  };

  // Renders fields in a standard responsive 12-column grid prioritizing explicit custom field width settings
  const renderFieldsLayout = () => {
    const fields = form.fields || [];
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-6 gap-y-6">
        {fields.map((field) => {
          let colSpan = "sm:col-span-12"; // Default full
          if (field.width === "half") colSpan = "sm:col-span-6";
          else if (field.width === "third") colSpan = "sm:col-span-4";
          else if (field.width === "quarter") colSpan = "sm:col-span-3";
          
          return (
            <div key={field.id} className={colSpan}>
              {renderSingleField(field)}
            </div>
          );
        })}
      </div>
    );
  };

  const finalHeader = form.header || (form.id === "contact" ? "SECURE SECRETS INQUIRY PORTAL" : "");

  return (
    <div className="space-y-6">
      {finalHeader && (
        <h3 id={`form-header-${form.id}`} className="font-display text-2xl font-bold uppercase text-luxury-cream mb-2">
          {finalHeader}
        </h3>
      )}
      <form onSubmit={handleSubmit} className="space-y-6 text-left animate-in fade-in duration-300">
        <div>
          {renderFieldsLayout()}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="group w-full py-4 bg-[#2a2c16] hover:bg-[#34371b] text-[#b6b335] disabled:opacity-50 font-mono font-bold text-[11px] tracking-[0.15em] uppercase rounded-full transition-colors flex items-center justify-center space-x-3 shadow-lg cursor-pointer"
        >
          <span>{submitting ? "TRANSMITTING..." : "SECURE TRANSMIT MESSAGE"}</span>
          {!submitting && <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />}
        </button>

      </form>
    </div>
  );
}

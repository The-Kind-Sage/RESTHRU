'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, ArrowRight, UtensilsCrossed, Smartphone, Building2, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { completeGoogleRegistration } from '@/lib/actions/auth';
import { NEPAL_CITIES, RESTAURANT_TYPES, PLANS } from '@/lib/constants';

const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

const step2Schema = z.object({
  restaurantName: z.string().min(2, 'Restaurant name is required'),
  restaurantType: z.string().min(1, 'Restaurant type is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  restaurantPhone: z.string().min(10, 'Valid phone number is required'),
});

const step3Schema = z.object({
  selectedPlan: z.string().min(1, 'Please select a plan'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface FormData {
  step1: Partial<Step1Data>;
  step2: Partial<Step2Data>;
  step3: Partial<Step3Data>;
}

const stepMeta: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'Your account', subtitle: 'Review your details and add a phone number' },
  2: { title: 'Restaurant details', subtitle: 'Tell us about your place' },
  3: { title: 'Start free trial', subtitle: 'Pick the right plan for you' },
};

interface GoogleUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  hasRestaurant?: boolean;
  restaurant?: {
    id: string;
    name: string;
    type: string;
    street?: string;
    city?: string;
    phoneNumber?: string;
  } | null;
}

interface GoogleRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: GoogleUser;
}

export function GoogleRegistrationDialog({ open, onOpenChange, user }: GoogleRegistrationDialogProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    step1: {},
    step2: {},
    step3: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const [usePersonalPhone, setUsePersonalPhone] = useState(false);

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: fullName,
      email: user.email,
      phone: '',
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      restaurantName: user.restaurant?.name || '',
      restaurantType: user.restaurant?.type || '',
      address: user.restaurant?.street || '',
      city: user.restaurant?.city || '',
      restaurantPhone: user.restaurant?.phoneNumber || '',
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { selectedPlan: '' },
  });

  const handleUsePersonalPhone = (checked: boolean) => {
    setUsePersonalPhone(checked);
    if (checked) {
      const personalPhone = step1Form.getValues('phone');
      step2Form.setValue('restaurantPhone', personalPhone);
    } else {
      step2Form.setValue('restaurantPhone', '');
    }
  };

  const resetAndClose = () => {
    setCurrentStep(1);
    setUsePersonalPhone(false);
    setFormData({ step1: {}, step2: {}, step3: {} });
    onOpenChange(false);
  };

  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await step1Form.trigger();
      if (isValid) setFormData((prev) => ({ ...prev, step1: step1Form.getValues() }));
    } else if (currentStep === 2) {
      isValid = await step2Form.trigger();
      if (isValid) setFormData((prev) => ({ ...prev, step2: step2Form.getValues() }));
    } else if (currentStep === 3) {
      isValid = await step3Form.trigger();
      if (isValid) setFormData((prev) => ({ ...prev, step3: step3Form.getValues() }));
    }

    if (isValid) {
      if (currentStep === 3) {
        await handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      resetAndClose();
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await completeGoogleRegistration(user.id, {
        phone: formData.step1.phone,
        restaurantName: formData.step2.restaurantName!,
        restaurantType: formData.step2.restaurantType || 'CASUAL_DINING',
        address: formData.step2.address,
        city: formData.step2.city,
        restaurantPhone: formData.step2.restaurantPhone,
        planId: formData.step3.selectedPlan,
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Account created successfully!');
      setCurrentStep(4);
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const goToDashboard = () => {
    resetAndClose();
    router.push('/owner');
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-0 shadow-soft-lg">
        {/* Brand header */}
        <div className="bg-gradient-to-br from-primary via-primary-hover to-[#064e3b] px-8 pt-7 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />
          </div>
          <div className="relative z-10 flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Resthru</span>
          </div>
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold text-white tracking-tight sr-only">
              Complete registration
            </DialogTitle>
            <DialogDescription className="sr-only">Complete your Resthru account setup</DialogDescription>
          </DialogHeader>

          {/* Step indicators */}
          {currentStep < 4 && (
            <div className="relative z-10 flex items-center gap-2 mt-2">
              {Object.values(stepMeta).map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                return (
                  <div key={idx} className="flex items-center gap-2 flex-1">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 flex-shrink-0 ${
                        isCompleted
                          ? 'bg-white text-primary'
                          : isCurrent
                          ? 'bg-white/25 text-white ring-2 ring-white/40'
                          : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block transition-colors ${isCurrent ? 'text-white' : 'text-white/50'}`}>
                      {step.title}
                    </span>
                    {idx < 2 && (
                      <div className={`flex-1 h-0.5 rounded-full transition-colors ml-2 ${isCompleted ? 'bg-white/50' : 'bg-white/15'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step Header */}
        {currentStep < 4 && stepMeta[currentStep] && (
          <div className="px-8 pt-5">
            <motion.div
              key={`header-${currentStep}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-lg font-bold text-foreground">{stepMeta[currentStep].title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{stepMeta[currentStep].subtitle}</p>
            </motion.div>
          </div>
        )}

        {/* Form Steps */}
        <div className="px-8 pb-7 pt-4">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                <Form {...step1Form}>
                  <form className="space-y-3.5">
                    {/* Google user info display */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      {user.picture ? (
                        <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{fullName}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Google
                      </span>
                    </div>

                    <FormField control={step1Form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" className="h-11 border-border/70 bg-muted/30 focus:bg-white transition-colors mt-1.5" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={step1Form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</FormLabel>
                        <FormControl><Input placeholder="you@example.com" type="email" className="h-11 border-border/70 bg-muted/30 focus:bg-white transition-colors mt-1.5" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={step1Form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</FormLabel>
                        <FormControl><Input placeholder="98XXXXXXXXX" className="h-11 border-border/70 bg-muted/30 focus:bg-white transition-colors mt-1.5" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </form>
                </Form>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                <Form {...step2Form}>
                  <form className="space-y-3.5">
                    <FormField control={step2Form.control} name="restaurantName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Restaurant Name</FormLabel>
                        <FormControl><Input placeholder="Your Restaurant Name" className="h-11 border-border/70 bg-muted/30 focus:bg-white transition-colors mt-1.5" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={step2Form.control} name="restaurantType" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Restaurant Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="h-11 border-border/70 bg-muted/30 focus:bg-white transition-colors mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                          <SelectContent>{RESTAURANT_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={step2Form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</FormLabel>
                        <FormControl><Input placeholder="Street address" className="h-11 border-border/70 bg-muted/30 focus:bg-white transition-colors mt-1.5" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={step2Form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="h-11 border-border/70 bg-muted/30 focus:bg-white transition-colors mt-1.5"><SelectValue placeholder="Select city" /></SelectTrigger></FormControl>
                          <SelectContent>{NEPAL_CITIES.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-2.5 cursor-pointer hover:bg-primary/[0.08] transition-colors mt-1.5" onClick={() => handleUsePersonalPhone(!usePersonalPhone)}>
                        <Checkbox id="usePersonalPhone" checked={usePersonalPhone} onCheckedChange={(val) => handleUsePersonalPhone(val === true)} />
                        <Label htmlFor="usePersonalPhone" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-primary" />
                          Use my personal number as restaurant phone
                        </Label>
                      </div>
                      <FormField control={step2Form.control} name="restaurantPhone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <Building2 className="w-3.5 h-3.5" />
                            Restaurant Phone
                          </FormLabel>
                          <FormControl><Input placeholder="98XXXXXXXXX" className="h-11 border-border/70 bg-muted/30 focus:bg-white transition-colors mt-1.5" disabled={usePersonalPhone} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </form>
                </Form>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                <Form {...step3Form}>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PLANS.map((plan) => (
                        <FormField key={plan.id} control={step3Form.control} name="selectedPlan" render={({ field }) => (
                          <div
                            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                              field.value === plan.id
                                ? 'border-primary bg-primary-light/40 shadow-md shadow-primary/10'
                                : 'border-border/70 hover:border-primary/30 hover:bg-muted/30'
                            }`}
                            onClick={() => field.onChange(plan.id)}
                          >
                            {plan.isPopular && (
                              <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-accent to-accent-light text-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                                Popular
                              </div>
                            )}
                            <h3 className="font-bold text-base mb-1">{plan.name}</h3>
                            <p className="text-xl font-bold text-primary mb-2.5">
                              {plan.price === 0 ? 'Free' : `${plan.price} ${plan.currency}`}
                              {plan.price !== 0 && <span className="text-xs text-muted-foreground font-normal ml-0.5">/mo</span>}
                            </p>
                            <ul className="space-y-1.5">
                              {plan.features.slice(0, 3).map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <Check className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            {field.value === plan.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-3 right-3 bg-primary text-white rounded-full p-1 shadow-sm"
                              >
                                <Check className="w-3 h-3" />
                              </motion.div>
                            )}
                          </div>
                        )} />
                      ))}
                    </div>
                  </form>
                </Form>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                <div className="bg-gradient-to-br from-success/10 to-primary-light/30 rounded-2xl p-8 text-center">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: 2 }}>
                    <div className="w-16 h-16 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-success/20">
                      <Check className="w-8 h-8 text-white" strokeWidth={3} />
                    </div>
                  </motion.div>
                  <h2 className="text-xl font-bold mb-1.5">Welcome to Resthru!</h2>
                  <p className="text-sm text-muted-foreground mb-5">
                    {formData.step2.restaurantName} is all set up and ready to go.
                  </p>
                  <div className="inline-flex flex-col gap-1.5 text-xs text-muted-foreground mb-6 bg-white/60 rounded-lg px-4 py-3">
                    <span className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success" /> Account created</span>
                    <span className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success" /> Restaurant profile set up</span>
                    <span className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success" /> Plan selected</span>
                  </div>
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button onClick={goToDashboard} className="w-full bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success/80 text-white font-semibold h-11 shadow-md shadow-success/20">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex gap-3 mt-5">
              <motion.div whileTap={{ scale: 0.98 }} className="flex-1">
                <Button variant="outline" onClick={handlePreviousStep} disabled={isLoading} className="w-full h-11 border-border/70 font-medium">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {currentStep === 1 ? 'Cancel' : 'Back'}
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.98 }} className="flex-1">
                <Button onClick={handleNextStep} disabled={isLoading} className="w-full h-11 bg-primary hover:bg-primary-hover text-white font-semibold shadow-md shadow-primary/20">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      {currentStep === 3 ? 'Start Free Trial' : 'Continue'}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

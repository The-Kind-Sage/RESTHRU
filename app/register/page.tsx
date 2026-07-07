'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Upload, UtensilsCrossed, ArrowRight, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { createSessionFromSupabaseLogin } from '@/lib/actions/auth';
import { NEPAL_CITIES, RESTAURANT_TYPES, PLANS } from '@/lib/constants';

const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const step2Schema = z.object({
  restaurantName: z.string().min(2, 'Restaurant name is required'),
  restaurantType: z.string().min(1, 'Restaurant type is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  restaurantPhone: z.string().min(10, 'Valid phone number is required'),
});

const step3Schema = z.object({
  panNumber: z.string().optional(),
  vatRegistered: z.boolean().default(false),
  vatNumber: z.string().optional(),
  numberOfTables: z.number().min(1, 'Number of tables is required'),
  openTime: z.string().min(1, 'Open time is required'),
  closeTime: z.string().min(1, 'Close time is required'),
});

const step4Schema = z.object({
  selectedPlan: z.string().min(1, 'Please select a plan'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

interface FormData {
  step1: Partial<Step1Data>;
  step2: Partial<Step2Data>;
  step3: Partial<Step3Data>;
  step4: Partial<Step4Data>;
}

const steps = ['Account', 'Restaurant', 'Business', 'Plan'];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    step1: {},
    step2: {},
    step3: {},
    step4: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const [businessDate, setBusinessDate] = useState<Date | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { restaurantName: '', restaurantType: '', address: '', city: '', restaurantPhone: '' },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      numberOfTables: 10,
      vatRegistered: false,
      panNumber: '',
      vatNumber: '',
      openTime: '',
      closeTime: '',
    },
  });

  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: { selectedPlan: '' },
  });

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
    } else if (currentStep === 4) {
      isValid = await step4Form.trigger();
      if (isValid) setFormData((prev) => ({ ...prev, step4: step4Form.getValues() }));
    }

    if (isValid) {
      if (currentStep === 4) {
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
      router.push('/');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        toast.error('Supabase is not configured. Please set environment variables.');
        return;
      }
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.step1.email!,
        password: formData.step1.password!,
        options: { data: { full_name: formData.step1.fullName, phone: formData.step1.phone } },
      });

      if (authError) {
        toast.error(authError.message || 'Failed to create account');
        return;
      }

      if (!authData.user) {
        toast.error('Failed to create account');
        return;
      }

      let authUser = authData.user;

      if (!authData.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.step1.email!,
          password: formData.step1.password!,
        });

        if (signInError) {
          toast.error('Account created but could not sign in automatically. Please go to the login page.');
          return;
        }

        if (signInData?.user) {
          authUser = signInData.user;
        }
      }

      const sessionResult = await createSessionFromSupabaseLogin(
        authUser.id,
        authUser.email || '',
        formData.step1.fullName
      );
      if (sessionResult?.error) {
        toast.error('Account created but session could not be established.');
        return;
      }

      const slug = (formData.step2.restaurantName ?? '')
        .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).slice(2, 7);

      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .insert([{
          owner_id: authData.user.id,
          name: formData.step2.restaurantName,
          slug,
          type: formData.step2.restaurantType,
          address: formData.step2.address,
          city: formData.step2.city,
          phone: formData.step2.restaurantPhone,
          pan_number: formData.step3.panNumber,
          vat_registered: formData.step3.vatRegistered,
          vat_number: formData.step3.vatNumber,
          num_tables: formData.step3.numberOfTables,
          operating_hours: { open: formData.step3.openTime, close: formData.step3.closeTime },
        }])
        .select('id')
        .single();

      if (restaurantError) {
        toast.error(restaurantError.message || 'Failed to create restaurant');
        return;
      }

      if (restaurantData?.id && formData.step4.selectedPlan) {
        await supabase.from('subscriptions').insert([{
          restaurantId: restaurantData.id,
          planId: formData.step4.selectedPlan,
          status: 'active',
        }]);
      }

      toast.success('Account created successfully!');
      setCurrentStep(5);
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const goToDashboard = () => router.push('/dashboard');

  const stepLabels: Record<number, { title: string; subtitle: string }> = {
    1: { title: 'Create your account', subtitle: 'Enter your details to get started' },
    2: { title: 'Restaurant details', subtitle: 'Tell us about your restaurant' },
    3: { title: 'Business info', subtitle: 'Configure tax and operations' },
    4: { title: 'Choose your plan', subtitle: 'Select the best plan for you' },
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Stepper */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary via-primary-hover to-[#064e3b] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Resthru</span>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-8">Setup in 4 simple steps</h2>
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  idx + 1 === currentStep
                    ? 'bg-white/15'
                    : idx + 1 < currentStep
                    ? 'bg-white/10'
                    : ''
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    idx + 1 < currentStep
                      ? 'bg-white text-primary'
                      : idx + 1 === currentStep
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/40'
                  }`}
                >
                  {idx + 1 < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-sm font-medium ${
                    idx + 1 <= currentStep ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-white/40">Trusted by 500+ restaurants in Nepal</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 lg:px-12 bg-register-gradient">
        <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <UtensilsCrossed className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-primary">Resthru</span>
            </Link>
          </div>

          {/* Progress (mobile) */}
          {currentStep < 5 && (
            <div className="lg:hidden mb-8">
              <div className="flex gap-2 mb-3">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      idx + 1 < currentStep
                        ? 'bg-primary'
                        : idx + 1 === currentStep
                        ? 'bg-primary'
                        : 'bg-border/50'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          )}

          {/* Step Header */}
          {currentStep < 5 && stepLabels[currentStep] && (
            <motion.div
              key={`header-${currentStep}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold">{stepLabels[currentStep].title}</h1>
              <p className="mt-2 text-muted-foreground">{stepLabels[currentStep].subtitle}</p>
            </motion.div>
          )}

          {/* Form Steps */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Card className="border border-border/70 bg-white/90 shadow-lg backdrop-blur">
                  <CardContent className="p-6 sm:p-8">
                    <Form {...step1Form}>
                      <form className="space-y-4">
                        <FormField control={step1Form.control} name="fullName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input placeholder="John Doe" className="h-11" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={step1Form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl><Input placeholder="you@example.com" type="email" className="h-11" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={step1Form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl><Input placeholder="98XXXXXXXXX" className="h-11" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={step1Form.control} name="password" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl><Input placeholder="At least 8 characters" type="password" className="h-11" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={step1Form.control} name="confirmPassword" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl><Input placeholder="Repeat password" type="password" className="h-11" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Card className="border border-border/70 bg-white/90 shadow-lg backdrop-blur">
                  <CardContent className="p-6 sm:p-8">
                    <Form {...step2Form}>
                      <form className="space-y-4">
                        <FormField control={step2Form.control} name="restaurantName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Name</FormLabel>
                            <FormControl><Input placeholder="Your Restaurant Name" className="h-11" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={step2Form.control} name="restaurantType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Type</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl><SelectTrigger className="h-11"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                              <SelectContent>{RESTAURANT_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={step2Form.control} name="address" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl><Input placeholder="Street address" className="h-11" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={step2Form.control} name="city" render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl><SelectTrigger className="h-11"><SelectValue placeholder="Select city" /></SelectTrigger></FormControl>
                              <SelectContent>{NEPAL_CITIES.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={step2Form.control} name="restaurantPhone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Phone</FormLabel>
                            <FormControl><Input placeholder="98XXXXXXXXX" className="h-11" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Card className="border border-border/70 bg-white/90 shadow-lg backdrop-blur">
                  <CardContent className="p-6 sm:p-8">
                    <Form {...step3Form}>
                      <form className="space-y-4">
                        <FormField control={step3Form.control} name="panNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>PAN Number (Optional)</FormLabel>
                            <FormControl><Input placeholder="Your PAN number" className="h-11" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormItem>
                          <FormLabel>Establishment Date (Optional)</FormLabel>
                          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn('w-full justify-start text-left font-normal h-11', !businessDate && 'text-muted-foreground')}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {businessDate ? format(businessDate, 'PPP') : <span>Select date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={businessDate}
                                onSelect={(date) => {
                                  setBusinessDate(date);
                                  setDatePickerOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                        <FormField control={step3Form.control} name="vatRegistered" render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-xl border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">VAT Registered</FormLabel>
                              <p className="text-sm text-muted-foreground">Is your restaurant VAT registered?</p>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                        )} />
                        {step3Form.watch('vatRegistered') && (
                          <FormField control={step3Form.control} name="vatNumber" render={({ field }) => (
                            <FormItem>
                              <FormLabel>VAT Number</FormLabel>
                              <FormControl><Input placeholder="Your VAT number" className="h-11" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        )}
                        <FormField control={step3Form.control} name="numberOfTables" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Tables</FormLabel>
                            <FormControl><Input type="number" placeholder="10" className="h-11" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={step3Form.control} name="openTime" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Opening Time</FormLabel>
                              <FormControl><Input type="time" className="h-11" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={step3Form.control} name="closeTime" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Closing Time</FormLabel>
                              <FormControl><Input type="time" className="h-11" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Card className="border border-border/70 bg-white/90 shadow-lg backdrop-blur">
                  <CardContent className="p-6 sm:p-8">
                    <Form {...step4Form}>
                      <form className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {PLANS.map((plan) => (
                            <FormField key={plan.id} control={step4Form.control} name="selectedPlan" render={({ field }) => (
                              <div
                                className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all ${
                                  field.value === plan.id
                                    ? 'border-primary bg-primary-light/50 shadow-md'
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => field.onChange(plan.id)}
                              >
                                {plan.isPopular && (
                                  <div className="absolute -top-2.5 left-4 bg-primary text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                                    Popular
                                  </div>
                                )}
                                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                                <p className="text-2xl font-bold text-primary mb-3">
                                  {plan.price === 0 ? 'Free' : `${plan.price} ${plan.currency}`}
                                  {plan.price !== 0 && <span className="text-sm text-muted-foreground font-normal">/mo</span>}
                                </p>
                                <ul className="space-y-1.5">
                                  {plan.features.slice(0, 3).map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                                {field.value === plan.id && (
                                  <div className="absolute top-4 right-4 bg-primary text-white rounded-full p-1">
                                    <Check className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            )} />
                          ))}
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-success/10 to-primary-light">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.6, repeat: 2 }}>
                      <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                    </motion.div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                      Welcome to Resthru!
                    </h2>
                    <p className="text-muted-foreground mb-8">
                      {formData.step2.restaurantName} is all set up and ready to go.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground mb-8">
                      <p>Account created successfully</p>
                      <p>Restaurant profile set up</p>
                      <p>Plan selected</p>
                    </div>
                    <Button onClick={goToDashboard} className="w-full sm:w-auto bg-success hover:bg-success/90 text-white font-medium h-11 px-8">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handlePreviousStep} disabled={isLoading} className="flex-1 h-11">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNextStep} disabled={isLoading} className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white">
                {currentStep === 4 ? 'Create Account' : 'Continue'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {currentStep < 5 && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

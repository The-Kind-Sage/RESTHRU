'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { supabase } from '@/lib/supabase';
import { NEPAL_CITIES, RESTAURANT_TYPES, PLANS } from '@/lib/constants';
import Link from 'next/link';

// Validation Schemas for each step
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
  logo: z.any().optional(),
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

const step5Schema = z.object({
  restaurantName: z.string(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type Step5Data = z.infer<typeof step5Schema>;

interface FormData {
  step1: Partial<Step1Data>;
  step2: Partial<Step2Data>;
  step3: Partial<Step3Data>;
  step4: Partial<Step4Data>;
}

const steps = ['Account', 'Restaurant', 'Business', 'Plan', 'Success'];

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

  // Step 1 Form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: formData.step1,
  });

  // Step 2 Form
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: formData.step2,
  });

  // Step 3 Form
  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      ...formData.step3,
      numberOfTables: formData.step3.numberOfTables || 10,
      vatRegistered: formData.step3.vatRegistered || false,
    },
  });

  // Step 4 Form
  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: formData.step4,
  });

  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await step1Form.trigger();
      if (isValid) {
        setFormData((prev) => ({
          ...prev,
          step1: step1Form.getValues(),
        }));
      }
    } else if (currentStep === 2) {
      isValid = await step2Form.trigger();
      if (isValid) {
        setFormData((prev) => ({
          ...prev,
          step2: step2Form.getValues(),
        }));
      }
    } else if (currentStep === 3) {
      isValid = await step3Form.trigger();
      if (isValid) {
        setFormData((prev) => ({
          ...prev,
          step3: step3Form.getValues(),
        }));
      }
    } else if (currentStep === 4) {
      isValid = await step4Form.trigger();
      if (isValid) {
        setFormData((prev) => ({
          ...prev,
          step4: step4Form.getValues(),
        }));
      }
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
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.step1.email!,
        password: formData.step1.password!,
        options: {
          data: {
            full_name: formData.step1.fullName,
            phone: formData.step1.phone,
          },
        },
      });

      if (authError) {
        toast.error(authError.message || 'Failed to create account');
        return;
      }

      if (!authData.user) {
        toast.error('Failed to create account');
        return;
      }

      // Insert restaurant data
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .insert([
          {
            user_id: authData.user.id,
            name: formData.step2.restaurantName,
            type: formData.step2.restaurantType,
            address: formData.step2.address,
            city: formData.step2.city,
            phone: formData.step2.restaurantPhone,
            pan_number: formData.step3.panNumber,
            vat_registered: formData.step3.vatRegistered,
            vat_number: formData.step3.vatNumber,
            number_of_tables: formData.step3.numberOfTables,
            opening_time: formData.step3.openTime,
            closing_time: formData.step3.closeTime,
            plan_id: formData.step4.selectedPlan,
          },
        ]);

      if (restaurantError) {
        toast.error(restaurantError.message || 'Failed to create restaurant');
        return;
      }

      toast.success('Account created successfully!');
      setCurrentStep(5);
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Join Resthru</h1>
          <p className="text-muted-foreground">Build your restaurant management empire</p>
        </div>

        {/* Progress Bar */}
        {currentStep < 5 && (
          <div className="mb-8">
            <div className="flex gap-2 mb-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex-1 relative">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx < currentStep
                        ? 'bg-indigo-600'
                        : idx === currentStep - 1
                          ? 'bg-indigo-600'
                          : 'bg-border'
                    }`}
                  />
                  <p
                    className={`text-xs mt-2 font-medium text-center ${
                      idx < currentStep
                        ? 'text-indigo-600'
                        : idx === currentStep - 1
                          ? 'text-indigo-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>Create your Resthru account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...step1Form}>
                    <form className="space-y-4">
                      <FormField
                        control={step1Form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step1Form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="you@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step1Form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="98XXXXXXXXX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step1Form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input placeholder="At least 8 characters" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step1Form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input placeholder="Repeat your password" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Restaurant Details</CardTitle>
                  <CardDescription>Tell us about your restaurant</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...step2Form}>
                    <form className="space-y-4">
                      <FormField
                        control={step2Form.control}
                        name="restaurantName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Restaurant Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step2Form.control}
                        name="restaurantType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Type</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select restaurant type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {RESTAURANT_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step2Form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step2Form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select city" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {NEPAL_CITIES.map((city) => (
                                  <SelectItem key={city} value={city}>
                                    {city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step2Form.control}
                        name="restaurantPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="98XXXXXXXXX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step2Form.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Logo (Optional)</FormLabel>
                            <FormControl>
                              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-indigo-600 transition-colors">
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Click to upload or drag and drop
                                </p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  {...field}
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      field.onChange(e.target.files[0]);
                                    }
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Business Details</CardTitle>
                  <CardDescription>Additional business information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...step3Form}>
                    <form className="space-y-4">
                      <FormField
                        control={step3Form.control}
                        name="panNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PAN Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Your PAN number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step3Form.control}
                        name="vatRegistered"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">VAT Registered</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Is your restaurant VAT registered?
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {step3Form.watch('vatRegistered') && (
                        <FormField
                          control={step3Form.control}
                          name="vatNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>VAT Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Your VAT number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={step3Form.control}
                        name="numberOfTables"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Tables</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="10"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={step3Form.control}
                          name="openTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Opening Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={step3Form.control}
                          name="closeTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Closing Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Plan</CardTitle>
                  <CardDescription>Select the perfect plan for your restaurant</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...step4Form}>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PLANS.map((plan) => (
                          <FormField
                            key={plan.id}
                            control={step4Form.control}
                            name="selectedPlan"
                            render={({ field }) => (
                              <div
                                className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
                                  field.value === plan.id
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-border hover:border-indigo-300'
                                }`}
                                onClick={() => field.onChange(plan.id)}
                              >
                                {plan.isPopular && (
                                  <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-xs font-semibold py-1 px-3 rounded-t-lg">
                                    Most Popular
                                  </div>
                                )}

                                <div className={plan.isPopular ? 'mt-8' : ''}>
                                  <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
                                  {plan.price !== null ? (
                                    <p className="text-2xl font-bold text-indigo-600 mb-4">
                                      {plan.price === 0 ? 'Free' : `${plan.price} ${plan.currency}`}
                                      {plan.price !== 0 && <span className="text-sm text-muted-foreground">/mo</span>}
                                    </p>
                                  ) : (
                                    <p className="text-2xl font-bold text-indigo-600 mb-4">
                                      Custom pricing
                                    </p>
                                  )}

                                  <ul className="space-y-2">
                                    {plan.features.map((feature, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                      </li>
                                    ))}
                                  </ul>

                                  <input
                                    type="radio"
                                    name="plan"
                                    value={plan.id}
                                    checked={field.value === plan.id}
                                    onChange={() => field.onChange(plan.id)}
                                    className="hidden"
                                  />

                                  {field.value === plan.id && (
                                    <div className="absolute top-4 right-4 bg-indigo-600 text-white rounded-full p-1">
                                      <Check className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          />
                        ))}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center space-y-6">
                    {/* Celebration Animation */}
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: 2,
                      }}
                    >
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                    </motion.div>

                    <div>
                      <h2 className="text-3xl font-bold text-green-900 mb-2">
                        Welcome to Resthru, {formData.step2.restaurantName}!
                      </h2>
                      <p className="text-green-700 text-lg">
                        Your account is ready to go
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-green-700">
                      <p>✓ Account created successfully</p>
                      <p>✓ Restaurant profile set up</p>
                      <p>✓ Plan selected</p>
                    </div>

                    <Button
                      onClick={goToDashboard}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12 text-base mt-4"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 1 || isLoading}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={isLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {currentStep === 4 ? 'Create Account' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Sign In Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

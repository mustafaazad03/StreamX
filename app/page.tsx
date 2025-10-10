'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, QrCode, Zap, Users, TrendingUp, Check, Sparkles, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                StreamX
              </span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/auth/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/register">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-5xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-6">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Real-time Polling Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
            Engage Your Audience
            <br />
            In Real-Time
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create stunning polls in seconds, share with QR codes, and watch responses flow in live.
            Perfect for classrooms, conferences, and events.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/auth/register">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
              <Link href="#features">
                Learn More
              </Link>
            </Button>
          </div>

          <div className="mt-12 text-sm text-gray-500">
            No credit card required • Free plan available • Setup in 60 seconds
          </div>
        </motion.div>

        {/* Hero Image/Demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10 blur-3xl rounded-full"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-gradient-to-r from-gray-200 to-gray-100 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                <div className="space-y-2 mt-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <div className="h-4 w-4 bg-blue-600 rounded"></div>
                      <div className="h-4 flex-1 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="p-8 bg-slate-50 rounded-2xl">
                  <QrCode className="h-48 w-48 text-gray-800" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need for
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Instant Engagement</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for seamless audience interaction
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Zap,
                title: '60-Second Setup',
                description: 'Create beautiful polls in under a minute. No technical knowledge required.',
                color: 'from-yellow-500 to-orange-500',
              },
              {
                icon: QrCode,
                title: 'QR Code Access',
                description: 'Instant participant access via QR codes. No apps, no accounts needed.',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: BarChart3,
                title: 'Live Results',
                description: 'Watch responses flow in real-time with stunning visualizations.',
                color: 'from-purple-500 to-pink-500',
              },
              {
                icon: Users,
                title: 'Unlimited Participants',
                description: 'Scale from classrooms to conferences. Handle 500+ concurrent users.',
                color: 'from-green-500 to-emerald-500',
              },
              {
                icon: TrendingUp,
                title: 'Advanced Analytics',
                description: 'Deep insights into participation, engagement, and response patterns.',
                color: 'from-red-500 to-rose-500',
              },
              {
                icon: Globe,
                title: 'Works Everywhere',
                description: 'Access from any device with a browser. Mobile-optimized interface.',
                color: 'from-indigo-500 to-blue-500',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border"
              >
                <div className={`h-12 w-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                description: 'Perfect for trying out StreamX',
                features: [
                  'Up to 100 participants per poll',
                  '10 polls per month',
                  'Basic analytics',
                  'QR code generation',
                  'Real-time results',
                  'Community support',
                ],
                cta: 'Start Free',
                popular: false,
              },
              {
                name: 'Pro',
                price: '$9.99',
                description: 'For professionals and educators',
                features: [
                  'Unlimited participants',
                  'Unlimited polls',
                  'Advanced analytics',
                  'Custom branding',
                  'Priority support',
                  'Export to CSV/PDF',
                  'Remove StreamX branding',
                ],
                cta: 'Start Pro Trial',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: '$49.99',
                description: 'For organizations and events',
                features: [
                  'Everything in Pro',
                  'White-label options',
                  'Custom domain',
                  'Dedicated support',
                  'Advanced integrations',
                  'SLA guarantee',
                  'Custom development',
                ],
                cta: 'Contact Sales',
                popular: false,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-white p-8 rounded-2xl border-2 ${
                  plan.popular ? 'border-blue-600 shadow-xl' : 'border-gray-200 shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-2">
                    {plan.price}
                    <span className="text-lg text-gray-500">/month</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  asChild
                >
                  <Link href="/auth/register">{plan.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Engage Your Audience?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of educators, speakers, and organizers using StreamX
            </p>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
              <Link href="/auth/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">StreamX</span>
              </div>
              <p className="text-gray-400">
                Real-time polling made simple and beautiful.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition">About</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 StreamX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

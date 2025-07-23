import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, MessageSquare, BarChart3, Users, Sparkles, Zap, Shield, Rocket } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center backdrop-blur-sm bg-white/80 border-b border-gray-200/50 sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="/">
          <div className="flex items-center mr-3">
            <img src="/botrix-logo01.png" alt="Botrix Logo" className="h-8 w-auto" />
          </div>
        </Link>
        <nav className="ml-auto flex gap-3">
          <Link href="/login">
            <Button variant="ghost" className="hover:bg-purple-50">Login</Button>
          </Link>
          <Link href="/signup">
            <Button className="gradient-primary text-white border-0 hover:shadow-lg hover:scale-105 transition-all">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-16 md:py-24 lg:py-32 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 hero-pattern opacity-40"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
          
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Chatbot Platform
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
                  Build Intelligent 
                  <span className="block gradient-text">Chatbots Without Coding</span>
                </h1>
                <p className="mx-auto max-w-[800px] text-gray-600 text-lg md:text-xl leading-relaxed">
                  Create, deploy, and manage powerful chatbots for your website. Handle customer conversations, 
                  automate support, and grow your business with our cutting-edge AI platform.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/signup">
                  <Button size="lg" className="gradient-primary text-white border-0 px-8 py-4 text-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <Rocket className="w-5 h-5 mr-2" />
                    Start Building Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all">
                    <Zap className="w-5 h-5 mr-2" />
                    Watch Demo
                  </Button>
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center gap-8 pt-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  Enterprise Secure
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI-Powered
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  No Code Required
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-slate-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything you need to 
                <span className="gradient-text"> build amazing chatbots</span>
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Powerful features designed to help you create, manage, and optimize chatbots that deliver exceptional user experiences.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="border-0 shadow-sm hover-lift card-glow bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Visual Bot Builder</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    Create sophisticated conversation flows with our intuitive drag-and-drop interface. No coding experience required.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover-lift card-glow bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Live Chat Inbox</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    Handle conversations in real-time with our powerful inbox and seamless team collaboration tools.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover-lift card-glow bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Advanced Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    Track performance, monitor user engagement, and optimize your bot with detailed insights and metrics.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover-lift card-glow bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Team Collaboration</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    Invite team members, manage permissions, and work together seamlessly on your chatbot projects.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 animate-gradient">
          <div className="container px-4 md:px-6">
            <div className="text-center text-white space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to transform your customer experience?
              </h2>
              <p className="text-xl text-purple-100 max-w-2xl mx-auto">
                Join thousands of businesses already using Botrix to automate support and boost engagement.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="px-8 py-4 text-lg font-semibold hover:scale-105 transition-all">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-white/30 text-white hover:bg-white/10 transition-all">
                    Schedule Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex items-center mr-3">
                  <img src="/botrix-logo01.png" alt="Botrix Logo" className="h-8 w-auto" />
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                The most powerful no-code chatbot platform for modern businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Templates</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Community</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Botrix Dashboard. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <Link className="text-gray-400 hover:text-white text-sm transition-colors" href="#">
                Privacy Policy
              </Link>
              <Link className="text-gray-400 hover:text-white text-sm transition-colors" href="#">
                Terms of Service
              </Link>
              <Link className="text-gray-400 hover:text-white text-sm transition-colors" href="#">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 
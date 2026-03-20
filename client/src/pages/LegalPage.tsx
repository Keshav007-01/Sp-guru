import React, { useState } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState("privacy");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-amber-800 mb-2">Legal Information</h1>
        <p className="text-gray-600">
          Important legal information about Divine Mantras
        </p>
      </div>

      <Tabs defaultValue="privacy" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-center mb-6">
          <TabsList className="bg-amber-50 border border-amber-200">
            <TabsTrigger 
              value="privacy" 
              className={`data-[state=active]:bg-amber-200 data-[state=active]:text-amber-800 px-6`}
            >
              Privacy Policy
            </TabsTrigger>
            <TabsTrigger 
              value="terms" 
              className={`data-[state=active]:bg-amber-200 data-[state=active]:text-amber-800 px-6`}
            >
              Terms & Conditions
            </TabsTrigger>
            <TabsTrigger 
              value="disclaimer" 
              className={`data-[state=active]:bg-amber-200 data-[state=active]:text-amber-800 px-6`}
            >
              Disclaimer
            </TabsTrigger>
          </TabsList>
        </div>

        <Card className="border-amber-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-800">
              {activeTab === "privacy" ? "Privacy Policy" : 
               activeTab === "terms" ? "Terms & Conditions" : 
               "Disclaimer"}
            </CardTitle>
            <CardDescription>
              Last updated: April 4, 2025
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TabsContent value="privacy" className="mt-0">
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-amber-700">1. Information We Collect</h3>
                <p>Divine Mantras respects your privacy and is committed to protecting it. This Privacy Policy explains what information we collect, how we use it, and your rights.</p>
                
                <h4 className="text-lg font-medium text-amber-700 mt-4">Personal Information</h4>
                <p>We may collect personal information such as your name and email address when you create an account. This information is used solely for providing you with a personalized experience and enabling features such as favorites and user profiles.</p>
                
                <h4 className="text-lg font-medium text-amber-700 mt-4">Usage Data</h4>
                <p>We collect anonymous usage data to understand how users interact with our application. This helps us improve the user experience and optimize our services.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">2. How We Use Your Information</h3>
                <p>We use your information to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Personalize your experience</li>
                  <li>Communicate with you about updates or changes to our services</li>
                  <li>Monitor and analyze usage patterns and trends</li>
                </ul>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">3. Data Security</h3>
                <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">4. Third-Party Services and Advertising</h3>
                <p>Our website uses Google AdSense to display advertisements. Google and its partners use cookies, web beacons, and similar technologies to collect information about your interactions with our website and other websites across the internet to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Measure and analyze traffic and browsing activity on our site</li>
                  <li>Show you ads that may be more relevant to your interests</li>
                  <li>Limit the number of times you see the same ad</li>
                  <li>Measure the effectiveness of ads you see</li>
                </ul>
                
                <p className="mt-3">Google AdSense may collect and process the following types of data:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>IP addresses</li>
                  <li>Cookie identifiers</li>
                  <li>Website activity</li>
                  <li>Browser information</li>
                  <li>Device information</li>
                </ul>
                
                <p className="mt-3">You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google's Ads Settings</a> or by using the <a href="https://optout.aboutads.info/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance's Consumer Choice Tool</a>.</p>
                
                <p className="mt-3">For more information about how Google uses your data, please visit <a href="https://policies.google.com/technologies/partner-sites" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google's Privacy & Terms page</a>.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">5. Cookies and Similar Technologies</h3>
                <p>We use cookies and similar technologies to enhance your experience on our website. Cookies are small text files that are stored on your device when you visit our website. They help us remember your preferences, understand how you use our site, and improve your experience.</p>
                
                <p className="mt-3">The types of cookies we use include:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Essential cookies:</strong> These are necessary for the website to function properly</li>
                  <li><strong>Preference cookies:</strong> These remember your settings and preferences</li>
                  <li><strong>Analytics cookies:</strong> These help us understand how visitors interact with our website</li>
                  <li><strong>Advertising cookies:</strong> These are used to deliver relevant advertisements and track ad campaign performance</li>
                </ul>
                
                <p className="mt-3">You can control cookies through your browser settings. However, disabling certain cookies may limit your ability to use some features of our website.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">6. Your Rights</h3>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Access, correct, or delete your personal information</li>
                  <li>Object to our processing of your personal information</li>
                  <li>Request a copy of your personal information</li>
                </ul>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">6. Changes to This Privacy Policy</h3>
                <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">7. Contact Us</h3>
                <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:keshav.mohta7@gmail.com" className="text-blue-600 hover:underline">keshav.mohta7@gmail.com</a>.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="terms" className="mt-0">
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-amber-700">1. Acceptance of Terms</h3>
                <p>By accessing or using Divine Mantras, you agree to be bound by these Terms and Conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">2. Use License</h3>
                <p>Permission is granted to temporarily download one copy of the materials on Divine Mantras for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to decompile or reverse engineer any software contained on the website</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                </ul>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">3. Content</h3>
                <p>All mantras, articles, and multimedia content provided on Divine Mantras are for informational and educational purposes only. The content is carefully researched from authentic sources and properly attributed where applicable.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">4. Advertising Content</h3>
                <p>Divine Mantras displays advertisements through Google AdSense. These advertisements are:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Provided by third parties and not directly controlled by Divine Mantras</li>
                  <li>May be personalized based on your browsing history and interests</li>
                  <li>Subject to Google AdSense's own terms and conditions</li>
                </ul>
                
                <p className="mt-3">While we strive to ensure all advertisements displayed on our site are appropriate and relevant, we are not responsible for the content of third-party advertisements. If you encounter an advertisement that you believe is inappropriate, please report it to Google AdSense and notify us at <a href="mailto:keshav.mohta7@gmail.com" className="text-blue-600 hover:underline">keshav.mohta7@gmail.com</a>.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">5. User Content</h3>
                <p>By submitting or sharing content through our services, you grant us a non-exclusive, royalty-free license to use, reproduce, modify, and display such content in connection with the service.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">6. Limitation of Liability</h3>
                <p>In no event shall Divine Mantras or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the website, even if Divine Mantras or a Divine Mantras authorized representative has been notified orally or in writing of the possibility of such damage.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">7. Governing Law</h3>
                <p>These Terms and Conditions shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">8. Changes to Terms</h3>
                <p>Divine Mantras reserves the right to revise these Terms and Conditions at any time without notice. By using this website, you are agreeing to be bound by the current version of these Terms and Conditions.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">9. Contact Us</h3>
                <p>If you have any questions about these Terms and Conditions, please contact us at <a href="mailto:keshav.mohta7@gmail.com" className="text-blue-600 hover:underline">keshav.mohta7@gmail.com</a>.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="disclaimer" className="mt-0">
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-amber-700">1. Spiritual Guidance Disclaimer</h3>
                <p>The spiritual content, mantras, and meditation guidance provided on Divine Mantras are for informational and educational purposes only. They are not intended to replace professional advice, diagnosis, or treatment for any medical, psychological, or spiritual condition.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">2. Original Content</h3>
                <p>We affirm that all content on Divine Mantras is original or appropriately cited from traditional sources. None of the spiritual teachings, mantras, or meditation techniques are plagiarized. We deeply respect the ancient traditions from which these practices originate and strive to present them authentically and respectfully.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">3. No Guarantees</h3>
                <p>While mantras and meditation practices have been associated with various benefits throughout history, we make no guarantees regarding specific outcomes or results from using our content. Individual experiences may vary based on practice, dedication, and personal circumstances.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">4. Religious and Cultural Context</h3>
                <p>The mantras and spiritual practices presented on Divine Mantras come from Hindu traditions. We encourage users to approach these practices with respect for their cultural and religious origins, whether participating as a devotee or simply as someone interested in meditation techniques.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">5. Health Considerations</h3>
                <p>Before beginning any meditation practice, especially if you have any pre-existing physical or mental health conditions, we recommend consulting with appropriate healthcare providers. Some practices may not be suitable for everyone.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">6. External Links</h3>
                <p>Our website may contain links to external sites that are not operated by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party sites or services.</p>
                
                <h3 className="text-xl font-medium text-amber-700 mt-6">7. Contact Us</h3>
                <p>If you have any questions about this Disclaimer, please contact us at <a href="mailto:keshav.mohta7@gmail.com" className="text-blue-600 hover:underline">keshav.mohta7@gmail.com</a>.</p>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm">
          For further information, please <Link href="/about"><span className="text-blue-600 hover:underline cursor-pointer">contact us</span></Link>.
        </p>
      </div>
    </div>
  );
}
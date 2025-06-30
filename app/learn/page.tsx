"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Phone, AlertTriangle, Users, Scale } from "lucide-react"

export default function LearnPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = [
    {
      id: "legal",
      title: "Legal Rights",
      icon: Scale,
      color: "bg-purple-100 text-purple-600",
      content: [
        {
          title: "Your Fundamental Rights",
          content: `As a woman in India, you have constitutional rights that protect you:
          • Right to Equality (Article 14)
          • Right against Discrimination (Article 15)
          • Right to Life and Personal Liberty (Article 21)
          • Right to Constitutional Remedies (Article 32)`,
        },
        {
          title: "Laws That Protect You",
          content: `Key laws for women's safety:
          • Protection of Women from Domestic Violence Act, 2005
          • Sexual Harassment of Women at Workplace Act, 2013
          • Dowry Prohibition Act, 1961
          • Indian Penal Code Sections 354, 375, 376 (Sexual Offenses)`,
        },
        {
          title: "How to File a Complaint",
          content: `Steps to file a complaint:
          1. Visit the nearest police station
          2. File an FIR (First Information Report)
          3. Get a copy of the FIR
          4. Contact a lawyer if needed
          5. Follow up on your case regularly`,
        },
      ],
    },
    {
      id: "emergency",
      title: "Emergency Actions",
      icon: AlertTriangle,
      color: "bg-red-100 text-red-600",
      content: [
        {
          title: "Immediate Danger Response",
          content: `If you're in immediate danger:
          • Call 100 (Police) or 112 (Emergency)
          • Make noise to attract attention
          • Run to a crowded area
          • Use your phone's emergency features
          • Trust your instincts`,
        },
        {
          title: "Self-Defense Basics",
          content: `Basic self-defense techniques:
          • Target vulnerable areas (eyes, nose, groin)
          • Use your voice - scream loudly
          • Carry legal self-defense items
          • Learn basic martial arts moves
          • Stay alert and aware of surroundings`,
        },
        {
          title: "Digital Safety",
          content: `Protect yourself online:
          • Don't share personal information
          • Use privacy settings on social media
          • Be cautious with location sharing
          • Report cyberbullying and harassment
          • Keep evidence of online threats`,
        },
      ],
    },
    {
      id: "support",
      title: "Support Systems",
      icon: Users,
      color: "bg-green-100 text-green-600",
      content: [
        {
          title: "National Helplines",
          content: `Important helpline numbers:
          • Women Helpline: 181
          • Domestic Violence: 181
          • Police: 100
          • Emergency: 112
          • Child Helpline: 1098`,
        },
        {
          title: "Support Organizations",
          content: `Organizations that can help:
          • National Commission for Women
          • State Women's Commissions
          • Local NGOs and women's groups
          • Legal aid societies
          • Counseling centers`,
        },
        {
          title: "Building Your Support Network",
          content: `Create a strong support system:
          • Maintain close relationships with family/friends
          • Join women's groups in your community
          • Connect with colleagues and neighbors
          • Build relationships with local authorities
          • Use technology to stay connected`,
        },
      ],
    },
  ]

  const emergencyContacts = [
    { name: "Police", number: "100", description: "For immediate police assistance" },
    { name: "Emergency Services", number: "112", description: "All emergency services" },
    { name: "Women Helpline", number: "181", description: "24x7 women helpline" },
    { name: "Domestic Violence", number: "181", description: "Domestic violence support" },
    { name: "Child Helpline", number: "1098", description: "Child protection services" },
    { name: "Medical Emergency", number: "108", description: "Ambulance services" },
  ]

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Learn Hub</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Knowledge is power. Stay informed, stay safe.</p>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${category.color} flex items-center justify-center`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2c3e50] dark:text-white">{category.title}</h3>
                    <p className="text-sm text-gray-500">{category.content.length} topics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Category Content */}
        {selectedCategory && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{categories.find((c) => c.id === selectedCategory)?.title}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {categories
                  .find((c) => c.id === selectedCategory)
                  ?.content.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{item.title}</AccordionTrigger>
                      <AccordionContent>
                        <div className="whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">
                          {item.content}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Emergency Contacts */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyContacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm">{contact.name}</div>
                    <div className="text-xs text-gray-500">{contact.description}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-mono">
                      {contact.number}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => window.open(`tel:${contact.number}`)}>
                      Call
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety Quiz */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">🧠</div>
            <h3 className="font-medium text-[#2c3e50] dark:text-white mb-2">Test Your Knowledge</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Take our safety quiz to test what you've learned
            </p>
            <Button className="gradient-bg text-white">Start Quiz</Button>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                📚 Download Safety Guide PDF
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                🎥 Watch Safety Videos
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                📱 Share with Friends
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Menu, QrCode, Store, TrendingDown, TrendingUp, Users } from 'lucide-react'

interface DashboardStatsProps {
  stats: {
    restaurants: number
    users: number
    qrCodes: number
    activeMenus: number
  }
  userRole: string
}

export function DashboardStats({ stats, userRole }: DashboardStatsProps) {
  const statItems = [
    {
      title: 'Total Restaurants',
      value: stats.restaurants,
      icon: Store,
      color: 'bg-blue-500',
      change: '+12%',
      positive: true
    },
    ...(userRole === 'ADMIN' ? [{
      title: 'Total Users',
      value: stats.users,
      icon: Users,
      color: 'bg-green-500',
      change: '+8%',
      positive: true
    }] : []),
    {
      title: 'QR Codes',
      value: stats.qrCodes,
      icon: QrCode,
      color: 'bg-purple-500',
      change: '+15%',
      positive: true
    },
    {
      title: 'Active Menus',
      value: stats.activeMenus,
      icon: Menu,
      color: 'bg-orange-500',
      change: '+5%',
      positive: true
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <Card key={index} className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {item.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {item.value.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {item.positive ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    item.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${item.color}`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
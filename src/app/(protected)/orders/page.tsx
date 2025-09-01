/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useOrdersByRestaurant, useUpdateOrderStatus } from '@/hooks/orders';
import { useRestaurants } from '@/hooks/restaurants/useRestaurants';
import {
    closestCorners,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ListOrdered, Plus, RefreshCw, Store } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DroppableZone } from './components/DroppableZone';
import { OrderCard } from './components/OrderCard';
import { SortableItem } from './components/SortableItem';

import { Order, OrderStatus } from '@/service/orders';

const ORDER_STATUSES: Array<{ key: OrderStatus; label: string; color: string }> = [
  { key: 'RECEIVED', label: 'RECEIVED', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'PREPARING', label: 'PREPARING', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { key: 'READY', label: 'READY', color: 'bg-green-50 border-green-200 text-green-700' },
  { key: 'SERVED', label: 'SERVED', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { key: 'CANCELLED', label: 'CANCELLED', color: 'bg-red-50 border-red-200 text-red-700' },
];

export default function OrdersRootPage() {
  // Restaurant selection with search and pagination via existing hook
  const [searchQuery, setSearchQuery] = useState('');
  const { data: restaurantsData, isLoading: restaurantsLoading } = useRestaurants({
    page: 1,
    limit: 50,
    search: searchQuery,
  });
  const restaurants = useMemo(() => restaurantsData?.restaurants || [], [restaurantsData?.restaurants]);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  useEffect(() => {
    // auto-select first if none selected
    if (!selectedRestaurantId && restaurants.length > 0) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  // Orders state using hooks
  const { data: ordersData, isLoading: loading, error, refetch } = useOrdersByRestaurant(selectedRestaurantId);
  const orders = useMemo(() => ordersData?.orders || [], [ordersData?.orders]);
  
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const updatingOrder = updateOrderStatusMutation.isPending ? updateOrderStatusMutation.variables?.orderId : null;
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastToastTime, setLastToastTime] = useState<number>(0);



  // DnD sensors with improved activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  // Group orders by status
  const ordersByStatus = useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    ORDER_STATUSES.forEach(status => {
      grouped[status.key] = [];
    });
    
    orders.forEach(order => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    });
    
    return grouped;
  }, [orders]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    console.log('Drag started:', event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    console.log('Drag end:', { active: active.id, over: over?.id, overData: over?.data });

    if (!over) {
      console.log('No drop target found');
      return;
    }

    const orderId = active.id as string;
    let newStatus = over.id as string;

    // Check if we dropped on a status column directly
    if (ORDER_STATUSES.some(status => status.key === newStatus)) {
      console.log('Dropped on status column:', newStatus);
    } 
    // Check if we dropped on another order card
    else {
      const targetOrder = orders.find(o => o.id === newStatus);
      if (targetOrder) {
        newStatus = targetOrder.status;
        console.log('Dropped on order card, using status:', newStatus);
      } else {
        console.log('Invalid drop target:', newStatus);
        return;
      }
    }

    // Validate that newStatus is a valid OrderStatus
    if (!ORDER_STATUSES.some(status => status.key === newStatus)) {
      console.log('Invalid status:', newStatus);
      return;
    }

    // Find the dragged order
    const draggedOrder = orders.find(o => o.id === orderId);
    if (!draggedOrder || draggedOrder.status === newStatus) {
      console.log('Order not found or already in target status');
      return;
    }

    console.log('Updating order status:', { orderId, from: draggedOrder.status, to: newStatus });
    updateOrderStatus(orderId, newStatus as OrderStatus);
  };

  const activeOrder = activeId ? orders.find(order => order.id === activeId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-600 rounded-2xl" />
          <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1">Orders</h1>
                <p className="text-indigo-100 text-sm">Manage and track order status</p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <ListOrdered className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search restaurants</label>
              <div className="relative">
                <Input
                  placeholder="Search restaurants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="w-full md:w-80">
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
              <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
                <SelectTrigger className="w-full bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <SelectValue placeholder={restaurantsLoading ? 'Loading...' : 'Select restaurant'} />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900 border border-gray-200">
                  {restaurants.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Orders count and controls */}
        <div className="flex items-right mb-6">
          <div className="text-lg font-semibold text-gray-900">
            {orders.length} orders
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error instanceof Error ? error.message : String(error)}
          </div>
        )}

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ORDER_STATUSES.map((status) => (
              <div key={status.key} className="relative">
                <DroppableZone 
                  id={status.key} 
                  isEmpty={!ordersByStatus[status.key] || ordersByStatus[status.key].length === 0}
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full min-h-[500px]">
                    {/* Column Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900 text-sm">{status.label}</h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                            {ordersByStatus[status.key]?.length || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          </button> */}
                          {/* <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                            <Plus className="w-4 h-4 text-gray-500" />
                          </button> */}
                        </div>
                      </div>
                    </div>

                    {/* Column Content */}
                    <div className="p-3 flex-1 relative">
                      {ordersByStatus[status.key] && ordersByStatus[status.key].length > 0 ? (
                        <SortableContext
                          items={ordersByStatus[status.key].map(order => order.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3 min-h-[400px]">
                            {ordersByStatus[status.key].map((order) => (
                              <SortableItem key={order.id} id={order.id}>
                                <OrderCard 
                                  order={order} 
                                  isUpdating={updatingOrder === order.id}
                                />
                              </SortableItem>
                            ))}
                          </div>
                        </SortableContext>
                      ) : (
                        <div className="flex items-center justify-center h-80 text-gray-400 min-h-[400px]">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                              <Plus className="w-8 h-8" />
                            </div>
                            <p className="text-base font-medium">No orders</p>
                            <p className="text-sm text-gray-400 mt-2">Drop orders here</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </DroppableZone>
              </div>
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay dropAnimation={null}>
            {activeOrder ? (
              <div className="transform rotate-3 scale-105 shadow-2xl">
                <OrderCard 
                  order={activeOrder} 
                  isDragging 
                  isUpdating={updatingOrder === activeOrder.id}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading orders...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
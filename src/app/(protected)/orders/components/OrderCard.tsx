import { ArrowRight, Clock, User } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  specialRequests?: string;
  qrCode?: { tableNumber?: string };
  orderItems?: Array<{
    id: string;
    quantity: number;
    menuItem?: { name: string };
    unitPrice: number;
  }>;
}

interface OrderCardProps {
  order: Order;
  isDragging?: boolean;
  isUpdating?: boolean;
}

export function OrderCard({ order, isDragging = false, isUpdating = false }: OrderCardProps) {
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getCardBorderColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'border-l-4 border-l-blue-500 bg-blue-50/30';
      case 'PREPARING':
        return 'border-l-4 border-l-orange-500 bg-orange-50/30';
      case 'READY':
        return 'border-l-4 border-l-green-500 bg-green-50/30';
      case 'SERVED':
        return 'border-l-4 border-l-purple-500 bg-purple-50/30';
      case 'CANCELLED':
        return 'border-l-4 border-l-red-500 bg-red-50/30';
      default:
        return 'border-l-4 border-l-gray-500 bg-gray-50/30';
    }
  };

  return (
    <div className={`
      border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200
      ${getCardBorderColor(order.status)}
      ${isDragging ? 'shadow-lg scale-105 rotate-2' : ''}
      ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
    `}>
      {/* Header with time */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{getTimeAgo(order.createdAt)}</span>
        </div>
        {/* Table number */}
        {order.qrCode?.tableNumber && (
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
            <User className="w-3 h-3" />
            <span>Table {order.qrCode.tableNumber}</span>
          </div>
        )}
      </div>

      {/* Order ID */}
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 text-sm">Order #{order.id.slice(-8)}</h4>
      </div>

      {/* Order items */}
      <div className="mb-3">
        <div className="space-y-1">
          {order.orderItems?.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {item.quantity} × {item.menuItem?.name || 'Unknown item'}
              </span>
              <span className="text-gray-500">
                ${((item.unitPrice || 0) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Special requests */}
      {order.specialRequests && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Special requests:</div>
          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
            {order.specialRequests}
          </div>
        </div>
      )}

      {/* Total amount */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-900">Total:</span>
        <span className="font-semibold text-gray-900">
          ${typeof order.totalAmount === 'number' 
            ? order.totalAmount.toFixed(2) 
            : parseFloat(order.totalAmount || '0').toFixed(2)}
        </span>
      </div>

      {/* Footer with arrow */}
      <div className="flex items-center justify-end">
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
} 
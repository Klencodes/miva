import React, { useEffect, useState } from "react";
import { Button } from "../../../ui";
import { toast } from "sonner";
import { indexedDBService } from "../../../core/services/indexdb";
import { formatQuantityWithPieces } from "../../../core/utils/formatQuantity";
import { useModal } from "../../../core/hooks/useModal";

const HoldOrdersModal: React.FC = () => {
  const { modalRef } = useModal();
  const [deletingOrder, setDeletingOrder] = useState<number | null>(null);
  const [holdOrders, setHoldOrders] = useState<any[]>([]);

  // Function to retrieve a hold order

  // Function to load hold orders
  const loadHoldOrders = async () => {
    try {
      const response = await indexedDBService.getHoldOrders();
      if (response.success) {
        setHoldOrders(response.results || []);
      }
    } catch (error) {
      console.error("Failed to load hold orders:", error);
    }
  };

  // Load hold orders on component mount
  useEffect(() => {
    loadHoldOrders();
  }, []);

  const handleRetrieveOrder = async (orderId: number) => {
    modalRef!.close({ success: true, orderId });
  };

  const handleDeleteOrder = async (orderId: number, orderCode: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete hold order ${orderCode}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingOrder(orderId);
    try {
      const response = await indexedDBService.deleteHoldOrder(orderId);

      if (response.success) {
        // Update local state
        setHoldOrders((prev) =>
          prev.filter(
            (order) => order.id !== orderId && order.local_id !== orderId
          )
        );

        toast.success(`Hold order ${orderCode} deleted`);
      } else {
        toast.error("Failed to delete hold order");
      }
    } catch (error) {
      toast.error("Error deleting hold order");
      console.error("Delete hold order error:", error);
    } finally {
      setDeletingOrder(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: date.toLocaleDateString([], { month: "short", day: "numeric" }),
      full: date.toLocaleString(),
    };
  };

  return (
    <div className="rounded-sm shadow-sm flex flex-col h-full bg-card">
      {/* Modal Header */}
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div>
          <h2 className="text-xl font-bold text-text">Orders on Hold</h2>
          <p className="text-sm text-text-light mt-1">
            {holdOrders.length} order{holdOrders.length !== 1 ? "s" : ""} on
            hold
          </p>
        </div>
        <button
          onClick={() => modalRef!.close()}
          className="text-text-light hover:text-text transition-colors"
          aria-label="Close"
        >
          <i className="ri-close-line text-2xl"></i>
        </button>
      </div>

      {/* Hold Orders List */}
      <div className="flex-1 overflow-y-auto p-4">
        {holdOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-light py-12">
            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-4">
              <i className="ri-pause-line text-3xl text-text-light"></i>
            </div>
            <p className="text-lg font-medium mb-2">No orders on hold</p>
            <p className="text-sm text-center">
              Orders you put on hold will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {holdOrders.map((order) => {
              const dateTime = formatDateTime(order.created_at);
              return (
                <div
                  key={order.id || order.local_id}
                  className="bg-background rounded-sm border border-border p-4 hover:border-primary transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-warning-10 text-warning text-xs px-2 py-1 rounded-full font-medium">
                          ON HOLD
                        </span>
                        <h3 className="font-bold text-text text-lg">
                          {order.code}
                        </h3>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-text-light">
                          <i className="ri-user-line mr-2"></i>
                          {order.customer}
                        </p>
                        <p className="text-text-light">
                          <i className="ri-shopping-basket-line mr-2"></i>
                          {order.items?.length || 0} item
                          {order.items?.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-text-light">
                          <i className="ri-time-line mr-2"></i>
                          {dateTime.time} • {dateTime.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-primary mb-2">
                        GHC {order.total?.toFixed(2)}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() =>
                            handleRetrieveOrder(order.id || order.local_id)
                          }
                          size="sm"
                          variant="primary"
                          className="w-24"
                        >
                          <i className="ri-play-line mr-1"></i>
                          Retrieve
                        </Button>
                        <Button
                          onClick={() =>
                            handleDeleteOrder(
                              order.id || order.local_id,
                              order.code
                            )
                          }
                          size="sm"
                          variant="ghost"
                          loading={
                            deletingOrder === (order.id || order.local_id)
                          }
                          disabled={deletingOrder !== null}
                          className="text-danger hover:text-danger w-24"
                        >
                          <i className="ri-delete-bin-line mr-1"></i>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mt-3 pt-3 border-t border-border-light">
                    <p className="text-xs font-medium text-text-light mb-2">
                      Items in this order:
                    </p>
                    <div className="space-y-2">
                      {order.items
                        ?.slice(0, 3)
                        .map((item: any, index: number) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-sm overflow-hidden flex-shrink-0">
                              <img
                                src={item.image_url}
                                alt={item.image_alt}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text truncate">
                                {item.short_name}
                              </p>
                              <p className="text-xs text-text-light">
                                {formatQuantityWithPieces(
  item.quantity,
  item.quantity_type === "units" ? item.selling_unit : (item.content_unit_type || "piece"),
  item.selling_unit_quantity,
  item.content_unit_type || "piece"
)} × GHC{" "}
                                {item.unit_price?.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-sm font-semibold text-text">
                              GHC {(item.unit_price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      {order.items?.length > 3 && (
                        <div className="text-center pt-2">
                          <span className="inline-block bg-background text-text-light text-xs px-3 py-1 rounded-full">
                            +{order.items.length - 3} more item
                            {order.items.length - 3 !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="border-t border-border">
        <div className="flex justify-between items-center pt-3">
          <Button onClick={() => modalRef!.close()} variant="ghost">
            Close
          </Button>

          <div className="text-sm text-text-light">
            <span className="font-medium text-text">{holdOrders.length}</span>{" "}
            order
            {holdOrders.length !== 1 ? "s" : ""} on hold
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoldOrdersModal;

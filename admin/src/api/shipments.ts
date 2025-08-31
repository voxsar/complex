import httpClient from './httpClient'

export interface Shipment {
  id: string
  status: string
  trackingNumber?: string
}

export interface ShipmentStatusPayload {
  status: string
}

export function getShipments() {
  return httpClient.get<Shipment[]>('/api/shipments')
}

export function updateShipmentStatus(id: string, payload: ShipmentStatusPayload) {
  return httpClient.put<Shipment, ShipmentStatusPayload>(`/api/shipments/${id}/status`, payload)
}

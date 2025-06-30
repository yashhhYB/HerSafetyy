declare global {
  interface Window {
    tt: {
      map: (options: {
        key: string
        container: HTMLElement
        center: [number, number]
        zoom: number
        style: string
      }) => {
        on: (event: string, callback: () => void) => void
        setCenter: (center: [number, number]) => void
        fitBounds: (bounds: any, options?: { padding: number }) => void
        addSource: (id: string, source: any) => void
        addLayer: (layer: any) => void
        removeLayer: (id: string) => void
        removeSource: (id: string) => void
        getLayer: (id: string) => any
      }
      Marker: new (options?: { color?: string }) => {
        setLngLat: (lngLat: [number, number]) => any
        addTo: (map: any) => any
        setPopup: (popup: any) => any
      }
      Popup: new (options?: { offset?: number }) => {
        setHTML: (html: string) => any
      }
      LngLatBounds: new () => {
        extend: (lngLat: [number, number]) => void
      }
    }
  }
}

export {}

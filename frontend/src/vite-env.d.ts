/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the ClinFlow API when it is not served from the same origin. */
  readonly VITE_API_URL?: string
}

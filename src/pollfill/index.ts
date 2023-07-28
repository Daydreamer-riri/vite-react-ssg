import {
  FormData as NodeFormData,
  Headers as NodeHeaders,
  Request as NodeRequest,
  Response as NodeResponse,
  fetch as nodeFetch,
} from './fetch'

export function installGlobals() {
  global.Headers = NodeHeaders as typeof Headers
  global.Request = NodeRequest as typeof Request
  global.Response = NodeResponse as unknown as typeof Response
  global.fetch = nodeFetch as typeof fetch
  global.FormData = NodeFormData
}

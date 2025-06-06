"use client"

interface WebhookStatusProps {
  status: 'success' | 'error' | 'info'
  title?: string
  message: string
  responseFormat?: string
  responseStatus?: number
}

export default function WebhookStatus({ 
  status, 
  title = "Webhook Status", 
  message,
  responseFormat,
  responseStatus
}: WebhookStatusProps) {
  // Determine styles based on status
  let statusStyle = ""
  
  switch (status) {
    case 'success':
      statusStyle = "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
      break
    case 'error':
      statusStyle = "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 text-red-800 dark:text-red-300"
      break
    case 'info':
    default:
      statusStyle = "bg-slate-50 border-slate-200 dark:bg-slate-900/30 dark:border-slate-800 text-slate-800 dark:text-slate-300"
      break
  }

  return (
    <div className={`mb-6 transition-all duration-300 rounded-lg border p-4 ${statusStyle}`}>
      <div className="flex flex-col">
        <h5 className="font-medium mb-1">
          {title}
        </h5>
        <div className="text-sm">
          {message}
        </div>
        
        {(responseFormat || responseStatus) && (
          <div className="text-xs mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            {responseStatus && (
              <div className="inline-block mr-3">
                Status: <span className="font-medium">{responseStatus}</span>
              </div>
            )}
            {responseFormat && (
              <div className="inline-block">
                Format: <span className="font-medium">{responseFormat}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
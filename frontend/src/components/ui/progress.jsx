import * as React from "react"
import { cn } from "../../lib/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => {
  const progressValue = Math.min(Math.max(value || 0, 0), 100);
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      style={{ 
        backgroundColor: '#e5e7eb',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
      {...props}
    >
      <div
        className="h-full transition-all duration-300 ease-in-out"
        style={{ 
          width: `${progressValue}%`,
          backgroundColor: '#1a1a1a',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }

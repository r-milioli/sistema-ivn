import * as React from "react"
import { cn } from "../../lib/utils"

const Avatar = React.forwardRef(({ className, children, ...props }, ref) => {
  const [imageError, setImageError] = React.useState(false);
  const [showFallback, setShowFallback] = React.useState(false);
  
  // Verificar se há imagem válida nos children
  React.useEffect(() => {
    React.Children.forEach(children, child => {
      if (React.isValidElement(child) && child.type === AvatarImage) {
        if (!child.props.src) {
          setShowFallback(true);
        }
      }
    });
  }, [children]);
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === AvatarImage) {
            return React.cloneElement(child, { 
              onError: () => {
                setImageError(true);
                setShowFallback(true);
              },
              onLoad: () => {
                setImageError(false);
                setShowFallback(false);
              },
              style: { display: (imageError || !child.props.src) ? 'none' : 'block', ...child.props.style }
            });
          }
          if (child.type === AvatarFallback) {
            return React.cloneElement(child, { 
              style: { display: (imageError || showFallback) ? 'flex' : 'none', ...child.props.style }
            });
          }
        }
        return child;
      })}
    </div>
  );
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef(({ className, src, alt, onError, onLoad, ...props }, ref) => {
  if (!src) return null;
  
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={onError}
      onLoad={onLoad}
      {...props}
    />
  );
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
AvatarFallback.displayName = "AvatarFallback"

const AvatarBadge = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
      className
    )}
    {...props}
  />
))
AvatarBadge.displayName = "AvatarBadge"

const AvatarGroup = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex -space-x-2", className)}
    {...props}
  >
    {children}
  </div>
))
AvatarGroup.displayName = "AvatarGroup"

const AvatarGroupCount = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-medium",
      className
    )}
    {...props}
  />
))
AvatarGroupCount.displayName = "AvatarGroupCount"

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount }

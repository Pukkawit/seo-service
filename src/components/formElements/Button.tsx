"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import type { Url } from "next/dist/shared/lib/router/router";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover", // Changed text-primary-foreground to text-secondary-foreground
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover", // Changed text-primary-foreground to text-destructive-foreground and hover to destructive-hover
        accent: "bg-accent text-accent-foreground hover:bg-accent-hover", // Changed text-primary-foreground to text-accent-foreground and hover to accent-hover
        outline:
          "border border-input bg-background hover:bg-accent text-foreground", // Changed border-muted-foreground to border-input, hover:bg-accent-100 to hover:bg-accent/10, text-primary to text-foreground, hover:border-muted-foreground/40 removed as it's covered by hover:bg-accent/10
        ghost: "hover:bg-accent/10 hover:text-accent-foreground", // Changed hover:bg-secondary-100 to hover:bg-accent/10, border removed, hover:text-secondary-800 to hover:text-accent-foreground, border-muted-foreground removed
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success-hover", // Added success variant
        warning: "bg-warning text-warning-foreground hover:bg-warning-hover", // Added warning variant
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "rounded-sm p-1  text-xs",
        sm: "h-8 rounded-md px-2 text-sm",
        lg: "h-12 rounded-md px-8",
        icon: "flex items-center justify-center h-8 w-8 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export interface LinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
}

const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps | LinkButtonProps
>((props, ref) => {
  const {
    className,
    variant,
    size,
    isLoading = false,
    icon,
    children,
    ...rest
  } = props as ButtonProps & LinkButtonProps;

  // Check if it's a link button (has href)
  const isLinkButton = "href" in rest;

  // Render as a link
  if (isLinkButton) {
    const { href, ...linkProps } = rest as LinkButtonProps;
    const isDisabled = isLoading || linkProps.disabled;

    return (
      <Link
        href={isDisabled ? "#" : (href as Url)}
        className={cn(
          buttonVariants({ variant, size, className }),
          isDisabled ? "cursor-not-allowed" : ""
        )}
        ref={ref as React.Ref<HTMLAnchorElement>}
        onClick={isDisabled ? (e) => e.preventDefault() : undefined}
        {...linkProps}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {isLoading ? <Loader className="mr-1 animate-spin" /> : children}
      </Link>
    );
  }

  // Render as a button
  return (
    <button
      className={cn(
        buttonVariants({ variant, size, className }),
        isLoading || (rest as ButtonProps).disabled
          ? "cursor-not-allowed"
          : "cursor-pointer"
      )}
      ref={ref as React.Ref<HTMLButtonElement>}
      disabled={isLoading || (rest as ButtonProps).disabled}
      {...rest}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {isLoading && <Loader className="mr-1 animate-spin w-4 h-4" />} {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };

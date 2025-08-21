"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/formElements/Button";

interface ScrollablePopoverProps {
  title: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ScrollablePopover({
  title,
  trigger,
  children,
  className,
}: ScrollablePopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrollPosition, setScrollPosition] = React.useState(0);

  const togglePopover: () => void = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    if (newState) {
      // Save current scroll position
      setScrollPosition(window.scrollY);
      // Lock body scroll
      document.body.style.position = "fixed";
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = "100%";
    } else {
      // Restore body scroll and position
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollPosition);
    }
  };

  React.useEffect(() => {
    return () => {
      // Cleanup function to restore scroll
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollPosition);
    };
  }, [scrollPosition]);

  return (
    <>
      <div onClick={togglePopover}>{trigger}</div>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-[0.075rem]">
          <div
            className={cn(
              "w-full bg-gray-300 dark:bg-gray-700 text-foreground rounded-lg shadow-lg max-h-[80vh] max-w-lg sm:max-w-md md:max-w-md lg:max-w-lg xl:max-w-xl flex flex-col",
              className
            )}
          >
            <div className="flex justify-between gap-4 items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-center bg-foreground/10 p-2 rounded-md">
                {title}
              </h2>
              <Button variant="ghost" size="icon" onClick={togglePopover}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex overflow-y-auto text-base space-y-4 flex-col gap-2 p-4 flex-grow">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
/* 
"use client"

import { Button } from "@/components/ui/button"
import { ScrollablePopover } from "@/components/scrollable-popover"

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <ScrollablePopover className="sm:max-w-[425px]" trigger={<Button variant="outline">Open Scrollable Popover</Button>}>
        <h2 className="text-lg font-semibold mb-4">Scrollable Content</h2>
        <p className="mb-4">This is a scrollable popover with responsive width and centered positioning.</p>
        {Array(15)
          .fill(0)
          .map((_, i) => (
            <p key={i} className="mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies aliquam, nunc
              nisl aliquet nunc, vitae aliquam nisl nunc vitae nisl.
            </p>
          ))}
      </ScrollablePopover>
    </div>
  )
}



*/
